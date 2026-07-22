"""LibrePT build steps: environment check, test run, and bundling src/ into dist/.

Run the whole build (env -> tests -> bundle) with `python -m build`, or import the individual
steps (used by the root pipeline.py orchestrator). Paths are relative to the current working
directory, so run these from the repository root.

Always invoke via `.venv/bin/python -m build` or the venv Python so that pytest-xdist
(-n flag) and all other test dependencies are available. Running with system python3 is
also safe — run_tests() always shells out to the venv python explicitly.
"""

import os
import sys
import shutil
import subprocess


def check_environment():
    """Verifies that the virtual environment, pytest, and playwright are set up."""
    print(">>> Step 1: Checking Environment Setup...")

    # Determine pip and python paths based on OS
    if os.name == "nt":
        pip_path = os.path.join(".venv", "Scripts", "pip.exe")
        playwright_path = os.path.join(".venv", "Scripts", "playwright.exe")
    else:
        pip_path = os.path.join(".venv", "bin", "pip")
        playwright_path = os.path.join(".venv", "bin", "playwright")

    if not os.path.exists(".venv"):
        print(
            "  Virtual environment '.venv' not found. Creating and installing dependencies..."
        )
        subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
        subprocess.run([playwright_path, "install", "chromium"], check=True)
    else:
        print("  ✓ Virtual environment '.venv' verified.")
        # Ensure dependencies from requirements.txt are up to date
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)


def ensure_biome_binary():
    """Detects platform and architecture, downloads the precompiled Biome binary if missing."""
    import platform
    import stat
    import requests
    import hashlib

    venv_bin = os.path.join(".venv", "Scripts" if os.name == "nt" else "bin")
    binary_name = "biome.exe" if os.name == "nt" else "biome"
    biome_path = os.path.join(venv_bin, binary_name)

    os_name = platform.system().lower()
    arch = platform.machine().lower()

    if os_name == "linux":
        if "arm64" in arch or "aarch64" in arch:
            platform_suffix = "linux-arm64"
        elif "64" in arch:
            platform_suffix = "linux-x64"
        else:
            raise RuntimeError(f"Unsupported Linux architecture: {arch}")
    elif os_name == "darwin":
        if "arm64" in arch or "aarch64" in arch:
            platform_suffix = "darwin-arm64"
        elif "64" in arch:
            platform_suffix = "darwin-x64"
        else:
            raise RuntimeError(f"Unsupported macOS architecture: {arch}")
    elif os_name == "windows":
        if "arm64" in arch:
            platform_suffix = "win32-arm64.exe"
        elif "64" in arch:
            platform_suffix = "win32-x64.exe"
        else:
            raise RuntimeError(f"Unsupported Windows architecture: {arch}")
    else:
        raise RuntimeError(f"Unsupported OS: {os_name}")

    # Expected SHA256 checksums/validation info for security
    expected_hashes = {
        "linux-x64": "ce247fb644999ef52e5111dd6fd6e471019669fc9c4a44b5699721e39b7032c3",
    }

    # Executable magic bytes per platform to check corruption
    expected_magics = {
        "linux": b"\x7fELF",
        "windows": b"MZ",
        "darwin": (b"\xcf\xfa\xed\xfe", b"\xfe\xed\xfa\xcf", b"\xca\xfe\xba\xbe"),
    }

    def verify_binary_integrity(path):
        """Verifies binary size, magic bytes, and SHA256 checksum to prevent corruption."""
        if not os.path.exists(path):
            return False

        # 1. Size check
        size = os.path.getsize(path)
        if size < 10 * 1024 * 1024:
            print(
                f"  ! Warning: Cached Biome binary is too small ({size} bytes). Possibly corrupted."
            )
            return False

        # 2. Magic bytes check
        try:
            with open(path, "rb") as f:
                header = f.read(4)
            magic = expected_magics.get(os_name)
            if magic:
                if isinstance(magic, tuple):
                    if not any(header.startswith(m) for m in magic):
                        print(
                            "  ! Warning: Cached Biome binary magic bytes do not match macOS Mach-O headers."
                        )
                        return False
                else:
                    if not header.startswith(magic):
                        print(
                            f"  ! Warning: Cached Biome binary magic bytes do not match {os_name} executable signature."
                        )
                        return False
        except Exception as e:
            print(f"  ! Warning: Failed to read binary headers: {e}")
            return False

        # 3. SHA256 check
        expected_hash = expected_hashes.get(platform_suffix)
        if expected_hash:
            sha256 = hashlib.sha256()
            try:
                with open(path, "rb") as f:
                    for chunk in iter(lambda: f.read(65536), b""):
                        sha256.update(chunk)
                current_hash = sha256.hexdigest()
                if current_hash != expected_hash:
                    print(
                        f"  ! Warning: SHA256 checksum mismatch for cached Biome binary.\n    Expected: {expected_hash}\n    Got: {current_hash}"
                    )
                    return False
            except Exception as e:
                print(f"  ! Warning: Failed to calculate SHA256 checksum: {e}")
                return False

        return True

    # Check cached binary
    if verify_binary_integrity(biome_path):
        return biome_path

    # Clean up corrupted file if present
    if os.path.exists(biome_path):
        os.remove(biome_path)

    print("  Downloading precompiled Biome Rust binary...")

    # Download from GitHub Releases
    version = "1.9.4"  # Pinned stable version
    url = f"https://github.com/biomejs/biome/releases/download/cli%2Fv{version}/biome-{platform_suffix}"

    try:
        response = requests.get(url, stream=True, timeout=15)
        response.raise_for_status()
        os.makedirs(venv_bin, exist_ok=True)
        with open(biome_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        if os.name != "nt":
            st = os.stat(biome_path)
            os.chmod(biome_path, st.st_mode | stat.S_IEXEC)

        # Validate integrity of newly downloaded binary
        if not verify_binary_integrity(biome_path):
            raise ValueError("Integrity check failed after download.")

        print("  ✓ Biome binary downloaded and verified successfully.")
        return biome_path
    except Exception as e:
        if os.environ.get("CI") == "true":
            print(f"  ✗ Failed to download/verify Biome binary in CI: {e}")
            raise e
        else:
            print(f"  ! Warning: Failed to download/verify Biome binary: {e}")
            print("  ! Skipping frontend static analysis locally.")
            return None


def run_lint():
    """Runs Python static analysis (Ruff) and frontend static analysis (Biome)."""
    print("\n>>> Step 1.5: Running Static Code Analysis...")

    if os.name == "nt":
        ruff_path = os.path.join(".venv", "Scripts", "ruff.exe")
    else:
        ruff_path = os.path.join(".venv", "bin", "ruff")

    if not os.path.exists(ruff_path):
        print(
            "  ✗ Ruff linter not found in virtual environment. Run check_environment first."
        )
        sys.exit(1)

    print("  Running Ruff (Python linter & formatter)...")
    print("    - Checking code lint rules...")
    lint_res = subprocess.run([ruff_path, "check", "build/", "deploy/", "tests/"])
    print("    - Checking code formatting...")
    fmt_res = subprocess.run(
        [ruff_path, "format", "--check", "build/", "deploy/", "tests/"]
    )

    if lint_res.returncode != 0 or fmt_res.returncode != 0:
        print("  ✗ Python static analysis failed.")
        sys.exit(1)
    print("  ✓ Python static analysis passed.")

    biome_path = ensure_biome_binary()
    if biome_path:
        print("  Running Biome (JS/CSS/JSON linter & formatter)...")
        biome_res = subprocess.run([biome_path, "check", "src/"])
        if biome_res.returncode != 0:
            print("  ✗ Frontend static analysis failed.")
            sys.exit(1)
        print("  ✓ Frontend static analysis passed.")

    # 3. Dependency Security Audit
    print("  Running Security Vulnerability Audit (pip-audit)...")
    if os.name == "nt":
        audit_path = os.path.join(".venv", "Scripts", "pip-audit.exe")
    else:
        audit_path = os.path.join(".venv", "bin", "pip-audit")

    if os.path.exists(audit_path):
        audit_res = subprocess.run([audit_path, "--desc"])
        if audit_res.returncode != 0:
            print("  ✗ Security vulnerability audit failed.")
            sys.exit(1)
        print("  ✓ Security vulnerability audit passed.")


def run_tests():
    """Runs the test suite via the venv Python so pytest-xdist (-n) is always available.

    Shells out to `<venv>/python -m pytest` rather than calling pytest.main() directly, which
    would use whichever pytest was imported — potentially the system one that lacks xdist.
    """
    print("\n>>> Step 2: Running Automated Test Suite (parallel)...")

    if os.name == "nt":
        venv_python = os.path.join(".venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join(".venv", "bin", "python")

    if not os.path.exists(venv_python):
        print(
            f"  ✗ Venv Python not found at {venv_python}. Run check_environment first."
        )
        sys.exit(1)

    result = subprocess.run([venv_python, "-m", "pytest", "-n", "auto", "-v", "tests/"])

    if result.returncode != 0:
        print(f"\n  ✗ Test suite failed with exit code: {result.returncode}")
        sys.exit(result.returncode)
    print("  ✓ All tests passed successfully!")


def run_build():
    """Builds and bundles the PWA files into the dist/ distribution directory."""
    print("\n>>> Step 3: Running Build & Bundle Step...")
    dist_dir = "dist"

    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)

    # The runtime app lives under src/. Publish that whole tree (index.html, app.js, index.css,
    # manifest.json, sw.js, i18n/, components/, icons/) flattened to the dist root so relative
    # paths resolve the same as in local dev. Mirrors .github/workflows/deploy.yml.
    #
    # Note: this local dist keeps <base href="/"> because it is served at the domain root.
    # The GitHub Pages deploy (deploy.yml) additionally rewrites <base> to the /<repo>/ sub-path,
    # since a project site is served under stutek.github.io/<repo>/, not the root.
    src_dir = "src"
    if not os.path.isdir(src_dir):
        print(f"  Warning: {src_dir}/ not found!")
        os.makedirs(dist_dir)
        return

    shutil.copytree(src_dir, dist_dir)
    for path in sorted(os.listdir(dist_dir)):
        print(f"  Copied src/{path} -> {dist_dir}/{path}")

    stamp_build_version(dist_dir)

    print(f"  ✓ Build complete. Bundle stored in: {os.path.abspath(dist_dir)}")


def stamp_build_version(dist_dir):
    """Overwrite dist/version.js with the real short commit SHA + UTC build time (the header build
    stamp). Mirrors the Pages deploy (.github/workflows/deploy.yml) — keep the two writers in sync."""
    from datetime import datetime, timezone

    try:
        commit = (
            subprocess.check_output(
                ["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.DEVNULL
            )
            .decode()
            .strip()
        )
    except Exception:
        commit = "local"
    built_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    with open(os.path.join(dist_dir, "version.js"), "w") as f:
        f.write(
            f'export const BUILD_INFO = {{ commit: "{commit}", builtAt: "{built_at}" }};\n'
        )
    print(f"  Stamped build {commit} ({built_at})")
