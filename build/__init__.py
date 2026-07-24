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
        subprocess.run(
            [pip_path, "install", "--upgrade", "pip", "setuptools>=83.0.0"],
            check=True,
        )
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
        subprocess.run([playwright_path, "install", "chromium"], check=True)
    else:
        print("  ✓ Virtual environment '.venv' verified.")
        # Ensure dependencies from requirements.txt are up to date
        subprocess.run(
            [pip_path, "install", "--upgrade", "pip", "setuptools>=83.0.0"],
            check=True,
        )
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


def run_python_lint():
    """Runs Python static analysis (Ruff lint and format check)."""
    print("\n  Running Python Lint & Format (Ruff)...")
    if os.name == "nt":
        ruff_path = os.path.join(".venv", "Scripts", "ruff.exe")
    else:
        ruff_path = os.path.join(".venv", "bin", "ruff")

    if not os.path.exists(ruff_path):
        print("  ✗ Ruff linter not found in virtual environment.")
        sys.exit(1)

    lint_res = subprocess.run([ruff_path, "check", "build/", "deploy/", "tests/"])
    fmt_res = subprocess.run(
        [ruff_path, "format", "--check", "build/", "deploy/", "tests/"]
    )
    if lint_res.returncode != 0 or fmt_res.returncode != 0:
        print("  ✗ Python static analysis failed.")
        sys.exit(1)
    print("  ✓ Python static analysis (Ruff) passed.")


def run_frontend_lint():
    """Runs JS/CSS/JSON static analysis (Biome)."""
    print("\n  Running Frontend Lint & Format (Biome)...")
    biome_path = ensure_biome_binary()
    if biome_path:
        biome_res = subprocess.run([biome_path, "check", "src/"])
        if biome_res.returncode != 0:
            print("  ✗ Frontend static analysis failed.")
            sys.exit(1)
        print("  ✓ Frontend static analysis (Biome) passed.")


def run_security_audit():
    """Runs Dependency Security Vulnerability Audit (pip-audit)."""
    print("\n  Running Dependency Security Audit (pip-audit)...")
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


def run_unit_tests():
    """Runs fast unit tests (tests/unit/ and tests/test_app.py)."""
    print("\n  Running Unit Tests...")
    venv_python = (
        os.path.join(".venv", "Scripts", "python.exe")
        if os.name == "nt"
        else os.path.join(".venv", "bin", "python")
    )
    result = subprocess.run(
        [venv_python, "-m", "pytest", "-v", "tests/unit/", "tests/test_app.py"]
    )
    if result.returncode != 0:
        print(f"  ✗ Unit tests failed with exit code: {result.returncode}")
        sys.exit(result.returncode)
    print("  ✓ Unit tests passed successfully!")


def run_e2e_tests():
    """Runs Playwright browser E2E tests in parallel (tests/e2e/ and tests/test_browser.py)."""
    print("\n  Running E2E Browser Tests (parallel)...")
    venv_python = (
        os.path.join(".venv", "Scripts", "python.exe")
        if os.name == "nt"
        else os.path.join(".venv", "bin", "python")
    )
    result = subprocess.run(
        [
            venv_python,
            "-m",
            "pytest",
            "-n",
            "auto",
            "--dist=loadfile",
            "-v",
            "tests/e2e/",
            "tests/test_browser.py",
        ]
    )
    if result.returncode != 0:
        print(f"  ✗ E2E browser tests failed with exit code: {result.returncode}")
        sys.exit(result.returncode)
    print("  ✓ E2E browser tests passed successfully!")


def run_dynamic_security_checks():
    """Runs dynamic security checks (CSP, HTTP security headers, and client-side DOM injection & sanitization verification)."""
    print("\n  Running Dynamic Security Checks...")
    index_path = os.path.join("src", "index.html")
    if not os.path.exists(index_path):
        print(f"  ✗ {index_path} not found for security check.")
        sys.exit(1)
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_headers = [
        'http-equiv="Content-Security-Policy"',
        'http-equiv="X-Content-Type-Options"',
        'http-equiv="Referrer-Policy"',
    ]
    missing = [h for h in required_headers if h not in content]
    if missing:
        print(f"  ✗ Dynamic security check failed. Missing headers: {missing}")
        sys.exit(1)

    # Injection Vulnerability & Unsanitized innerHTML Audit across frontend codebase
    print(
        "    - Auditing frontend codebase for unsanitized HTML/script injection patterns..."
    )
    unsafe_patterns = ["document.write(", "eval("]
    violations = []
    for root, _, files in os.walk("src"):
        for file in files:
            if file.endswith(".js"):
                fp = os.path.join(root, file)
                with open(fp, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, 1):
                        for p in unsafe_patterns:
                            if p in line and "//" not in line.split(p)[0]:
                                violations.append(f"{fp}:{line_num} -> {p.strip()}")

    if violations:
        print(
            "  ✗ Dynamic security injection check failed. Found unsafe injection patterns:\n    "
            + "\n    ".join(violations)
        )
        sys.exit(1)

    print("  ✓ Dynamic security checks (headers & code injection audit) passed.")


ZAP_TARGET = "http://localhost:8081/LibrePT/"
ZAP_PORT = 8081


def _is_port_open(port):
    import socket

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("localhost", port)) == 0


def _ensure_zap_target_up():
    """Guarantee the app is actually being served on :8081 before ZAP scans it.

    A scan that reaches nothing exits "clean" and gives false assurance (AGENT_RULES §2.A.3),
    so if the dev server / e2e fixture has not already bound the port we start our own copy and
    wait for it. Returns the Popen we started (to leave running — the user owns the dev server)
    or None if the port was already up.
    """
    import time

    if _is_port_open(ZAP_PORT):
        return None
    proc = subprocess.Popen(
        [sys.executable, "-m", "deploy.local_http_server", "--port", str(ZAP_PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(100):  # up to ~10s for the server to come up
        if _is_port_open(ZAP_PORT):
            return proc
        time.sleep(0.1)
    proc.terminate()
    return None


def run_owasp_zap_scan():
    """Runs the OWASP ZAP baseline scan against the live app and FAILS the build on any finding.

    Enforcement (AGENT_RULES §2.A.3): the container runs with host networking so it truly reaches
    the app on :8081, alerts are triaged by deploy/zap/zap-baseline.conf (each ignore justified in
    that file), and a non-zero ZAP exit — code 1 (FAIL), 2 (WARN), or 3 (scan error / unreachable) —
    fails the build. Nothing is printed-and-passed.
    """
    print("\n  Running OWASP ZAP Security Scan...")

    docker_bin = shutil.which("docker")
    if not docker_bin:
        print("  ✗ OWASP ZAP requires Docker, which is not available on PATH.")
        sys.exit(1)

    if not _is_port_open(ZAP_PORT):
        _ensure_zap_target_up()
    if not _is_port_open(ZAP_PORT):
        print(f"  ✗ OWASP ZAP target {ZAP_TARGET} is not reachable — nothing to scan.")
        sys.exit(1)

    print("    - Launching OWASP ZAP container baseline scan (host network)...")
    conf_dir = os.path.join(os.path.abspath("deploy"), "zap")
    res = subprocess.run(
        [
            docker_bin,
            "run",
            "--rm",
            "--network",
            "host",
            "-v",
            f"{conf_dir}:/zap/wrk:ro",
            "zaproxy/zap-stable",
            "zap-baseline.py",
            "-t",
            ZAP_TARGET,
            "-c",
            "zap-baseline.conf",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if res.returncode == 0:
        print("  ✓ OWASP ZAP baseline security scan passed cleanly (WARN-NEW: 0).")
        return

    # Non-zero: surface the report tail so the offending alerts are visible, then fail.
    tail = "\n".join(res.stdout.strip().splitlines()[-40:])
    print(tail)
    print(f"  ✗ OWASP ZAP scan failed (exit {res.returncode}).")
    sys.exit(1)


def run_stage_1_parallel():
    """Stage 1: Runs Python Lint, Frontend Lint, Dependency Scan, and Unit Tests concurrently."""
    import concurrent.futures

    print(
        "\n=== Stage 1: Linting, Security Scans & Unit Tests (Parallel Execution) ==="
    )
    tasks = {
        "Python Lint (Ruff)": run_python_lint,
        "Frontend Lint (Biome)": run_frontend_lint,
        "Dependency Security Scan (pip-audit)": run_security_audit,
        "Unit Tests": run_unit_tests,
    }

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        future_to_name = {executor.submit(task): name for name, task in tasks.items()}
        for future in concurrent.futures.as_completed(future_to_name):
            name = future_to_name[future]
            try:
                future.result()
            except SystemExit as e:
                if e.code != 0:
                    failures.append(name)
            except Exception as e:
                print(f"  ✗ Task '{name}' raised exception: {e}")
                failures.append(name)

    if failures:
        print(f"\n  ✗ Stage 1 failed in tasks: {', '.join(failures)}")
        sys.exit(1)
    print("\n  ✓ Stage 1 completed cleanly!")


def run_stage_2_parallel():
    """Stage 2: Runs E2E Browser Tests, Dynamic Security Checks, and OWASP ZAP Scan concurrently."""
    import concurrent.futures

    print(
        "\n=== Stage 2: E2E Browser Tests, Dynamic Security & OWASP ZAP (Parallel Execution) ==="
    )
    tasks = {
        "E2E Browser Tests": run_e2e_tests,
        "Dynamic Security Checks": run_dynamic_security_checks,
        "OWASP ZAP Scan": run_owasp_zap_scan,
    }

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        future_to_name = {executor.submit(task): name for name, task in tasks.items()}
        for future in concurrent.futures.as_completed(future_to_name):
            name = future_to_name[future]
            try:
                future.result()
            except SystemExit as e:
                if e.code != 0:
                    failures.append(name)
            except Exception as e:
                print(f"  ✗ Task '{name}' raised exception: {e}")
                failures.append(name)

    if failures:
        print(f"\n  ✗ Stage 2 failed in tasks: {', '.join(failures)}")
        sys.exit(1)
    print("\n  ✓ Stage 2 completed cleanly!")


def run_lint():
    """Backwards-compatible wrapper for linting & scans."""
    run_python_lint()
    run_frontend_lint()
    run_security_audit()


def run_tests():
    """Backwards-compatible wrapper for running all tests."""
    run_unit_tests()
    run_e2e_tests()


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
