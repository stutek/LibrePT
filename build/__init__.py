"""LibrePT build steps: environment check, test run, and bundling src/ into dist/.

Run the whole build (env -> tests -> bundle) with `python -m build`, or import the individual
steps (used by the root pipeline.py orchestrator). Paths are relative to the current working
directory, so run these from the repository root.

Always invoke via `.venv/bin/python -m build` or the venv Python so that pytest-xdist
(-n flag) and all other test dependencies are available. Running with system python3 is
also safe — run_tests() always shells out to the venv python explicitly.
"""

import hashlib
import json
import os
import sys
import shutil
import subprocess
import time

from build.frontend_audit import audit_html_sinks, compare_csp
from build.testreport import REPORT_DIR, failed_test_ids, print_digest, run_logged


def _timed_task(name, fn):
    """Run one pipeline task, always printing its wall-clock time — pass or fail — so a slow gate
    step is visible without re-running it under `time` by hand. Re-raises whatever `fn` raised
    (SystemExit or otherwise) so the caller's existing failure handling is unchanged."""
    start = time.monotonic()
    try:
        fn()
    except SystemExit as e:
        elapsed = time.monotonic() - start
        mark = "✓" if e.code in (0, None) else "✗"
        print(f"    ⏱ {name}: {elapsed:.1f}s {mark}")
        raise
    except Exception:
        elapsed = time.monotonic() - start
        print(f"    ⏱ {name}: {elapsed:.1f}s ✗")
        raise
    else:
        elapsed = time.monotonic() - start
        print(f"    ⏱ {name}: {elapsed:.1f}s ✓")


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


def _linux_platform_suffix(arch):
    if "arm64" in arch or "aarch64" in arch:
        return "linux-arm64"
    if "64" in arch:
        return "linux-x64"
    raise RuntimeError(f"Unsupported Linux architecture: {arch}")


def _darwin_platform_suffix(arch):
    if "arm64" in arch or "aarch64" in arch:
        return "darwin-arm64"
    if "64" in arch:
        return "darwin-x64"
    raise RuntimeError(f"Unsupported macOS architecture: {arch}")


def _windows_platform_suffix(arch):
    if "arm64" in arch:
        return "win32-arm64.exe"
    if "64" in arch:
        return "win32-x64.exe"
    raise RuntimeError(f"Unsupported Windows architecture: {arch}")


_PLATFORM_SUFFIX_RESOLVERS = {
    "linux": _linux_platform_suffix,
    "darwin": _darwin_platform_suffix,
    "windows": _windows_platform_suffix,
}


def _resolve_platform_suffix(os_name, arch):
    resolver = _PLATFORM_SUFFIX_RESOLVERS.get(os_name)
    if resolver is None:
        raise RuntimeError(f"Unsupported OS: {os_name}")
    return resolver(arch)


def _check_binary_size(path):
    size = os.path.getsize(path)
    if size < 10 * 1024 * 1024:
        print(
            f"  ! Warning: Cached Biome binary is too small ({size} bytes). Possibly corrupted."
        )
        return False
    return True


def _check_binary_magic(path, os_name, expected_magics):
    try:
        with open(path, "rb") as f:
            header = f.read(4)
    except Exception as e:
        print(f"  ! Warning: Failed to read binary headers: {e}")
        return False

    magic = expected_magics.get(os_name)
    if not magic:
        return True
    if isinstance(magic, tuple):
        if any(header.startswith(m) for m in magic):
            return True
        print(
            "  ! Warning: Cached Biome binary magic bytes do not match macOS Mach-O headers."
        )
        return False
    if header.startswith(magic):
        return True
    print(
        f"  ! Warning: Cached Biome binary magic bytes do not match {os_name} executable signature."
    )
    return False


def _check_binary_checksum(path, platform_suffix, expected_hashes):
    expected_hash = expected_hashes.get(platform_suffix)
    if not expected_hash:
        return True
    sha256 = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        current_hash = sha256.hexdigest()
    except Exception as e:
        print(f"  ! Warning: Failed to calculate SHA256 checksum: {e}")
        return False
    if current_hash != expected_hash:
        print(
            f"  ! Warning: SHA256 checksum mismatch for cached Biome binary.\n    Expected: {expected_hash}\n    Got: {current_hash}"
        )
        return False
    return True


def verify_binary_integrity(
    path, os_name, platform_suffix, expected_magics, expected_hashes
):
    """Verifies binary size, magic bytes, and SHA256 checksum to prevent corruption. Three
    independent checks that all have to run and all have to pass — genuinely one sequential
    validation, not several concerns, so each stays its own named step rather than a shared loop."""
    if not os.path.exists(path):
        return False
    return (
        _check_binary_size(path)
        and _check_binary_magic(path, os_name, expected_magics)
        and _check_binary_checksum(path, platform_suffix, expected_hashes)
    )


def ensure_biome_binary():
    """Detects platform and architecture, downloads the precompiled Biome binary if missing."""
    import platform
    import stat
    import requests

    venv_bin = os.path.join(".venv", "Scripts" if os.name == "nt" else "bin")
    binary_name = "biome.exe" if os.name == "nt" else "biome"
    biome_path = os.path.join(venv_bin, binary_name)

    os_name = platform.system().lower()
    arch = platform.machine().lower()
    platform_suffix = _resolve_platform_suffix(os_name, arch)

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

    # Check cached binary
    if verify_binary_integrity(
        biome_path, os_name, platform_suffix, expected_magics, expected_hashes
    ):
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
        if not verify_binary_integrity(
            biome_path, os_name, platform_suffix, expected_magics, expected_hashes
        ):
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


NODE_VERSION = "24.19.0"

# SHA256 of the official release archive itself (not an extracted binary — Node ships as an
# archive, unlike Biome's single-file binary), from https://nodejs.org/dist/vX.Y.Z/SHASUMS256.txt.
_NODE_ARCHIVE_HASHES = {
    "darwin-arm64": "8294b7aa9b03997481c06babf1e8b270c859358f27da57a11509afe537ac381d",
    "darwin-x64": "d1b5e999db158c62fe8f7267a4476b035d8bd93b1a605bac24a3f0dd166e3316",
    "linux-arm64": "01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc",
    "linux-x64": "14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647",
    "win-arm64": "8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f",
    "win-x64": "57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73",
}

NODE_INSTALL_DIR = os.path.join(".venv", "node-runtime")


def _node_platform_suffix(os_name, arch):
    """Node's own dist naming — reuses Biome's linux/darwin resolvers (identical strings), but
    Node names Windows archives "win-x64"/"win-arm64" rather than Biome's "win32-x64.exe"."""
    if os_name == "windows":
        return "win-arm64" if "arm64" in arch else "win-x64"
    return _resolve_platform_suffix(os_name, arch)


def _node_archive_ext(os_name):
    if os_name == "windows":
        return "zip"
    if os_name == "darwin":
        return "tar.gz"
    return "tar.xz"


def _node_binary_path(platform_suffix, os_name):
    root = os.path.join(NODE_INSTALL_DIR, f"node-v{NODE_VERSION}-{platform_suffix}")
    return os.path.join(root, "node.exe" if os_name == "windows" else "bin/node")


def ensure_node_binary():
    """Detects platform and architecture, downloads the precompiled Node.js runtime if missing.

    tests/unit_js/ needs a real ES-module-capable JS runtime to import src/data/*.js and
    src/modules/common/*.js directly (see run_javascript_unit_tests) — Node's built-in `node:test` +
    `node:assert` need zero npm packages, so this is the only new dependency the tier adds: no
    package.json, no node_modules, nothing for a JS-side pip-audit equivalent to even cover.
    Vendored the same way as Biome (ensure_biome_binary) rather than assumed on PATH: contributors
    run this on very different machines, and a system Node install (or lack of one) should not gate
    the build.
    """
    import platform
    import stat
    import requests

    os_name = platform.system().lower()
    arch = platform.machine().lower()
    platform_suffix = _node_platform_suffix(os_name, arch)
    node_path = _node_binary_path(platform_suffix, os_name)

    if os.path.exists(node_path):
        return node_path

    print("  Downloading precompiled Node.js runtime...")
    expected_hash = _NODE_ARCHIVE_HASHES.get(platform_suffix)
    ext = _node_archive_ext(os_name)
    archive_name = f"node-v{NODE_VERSION}-{platform_suffix}.{ext}"
    url = f"https://nodejs.org/dist/v{NODE_VERSION}/{archive_name}"

    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        os.makedirs(NODE_INSTALL_DIR, exist_ok=True)
        archive_path = os.path.join(NODE_INSTALL_DIR, archive_name)
        sha256 = hashlib.sha256()
        with open(archive_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=65536):
                f.write(chunk)
                sha256.update(chunk)

        if expected_hash and sha256.hexdigest() != expected_hash:
            os.remove(archive_path)
            raise ValueError("Integrity check failed after download (SHA256 mismatch).")

        if ext == "zip":
            import zipfile

            with zipfile.ZipFile(archive_path) as zf:
                zf.extractall(NODE_INSTALL_DIR)
        else:
            import tarfile

            with tarfile.open(
                archive_path, "r:xz" if ext == "tar.xz" else "r:gz"
            ) as tf:
                tf.extractall(NODE_INSTALL_DIR, filter="data")
        os.remove(archive_path)

        if os_name != "windows":
            st = os.stat(node_path)
            os.chmod(node_path, st.st_mode | stat.S_IEXEC)

        if not os.path.exists(node_path):
            raise ValueError(f"Extracted archive did not produce {node_path}.")

        print("  ✓ Node.js runtime downloaded and verified successfully.")
        return node_path
    except Exception as e:
        if os.environ.get("CI") == "true":
            print(f"  ✗ Failed to download/verify Node.js runtime in CI: {e}")
            raise e
        else:
            print(f"  ! Warning: Failed to download/verify Node.js runtime: {e}")
            print("  ! Skipping JavaScript unit tests locally.")
            return None


PYTHON_LINT_TARGETS = ("build/", "deploy/", "tests/", "agent_tools/")


def run_python_lint():
    """Runs Python static analysis (Ruff), applying formatting itself — see run_frontend_lint."""
    print("\n  Running Python Lint & Format (Ruff)...")
    if os.name == "nt":
        ruff_path = os.path.join(".venv", "Scripts", "ruff.exe")
    else:
        ruff_path = os.path.join(".venv", "bin", "ruff")

    if not os.path.exists(ruff_path):
        print("  ✗ Ruff linter not found in virtual environment.")
        sys.exit(1)

    fmt_res = subprocess.run(
        [ruff_path, "format", *PYTHON_LINT_TARGETS], capture_output=True, text=True
    )
    for line in fmt_res.stdout.splitlines():
        if "reformatted" in line:
            print(f"    ⓘ {line.strip()}")

    lint_res = subprocess.run([ruff_path, "check", *PYTHON_LINT_TARGETS])
    if lint_res.returncode != 0 or fmt_res.returncode != 0:
        print("  ✗ Python static analysis failed.")
        sys.exit(1)
    print("  ✓ Python static analysis (Ruff) passed.")


def run_doc_graph_check():
    """Verifies the OKF knowledge graph connects — see agent_tools/doclinks.py for the rules.

    In the gate rather than in review because the failure is invisible by inspection: a renumbered
    section leaves references that still *read* correctly and simply resolve to nothing.
    """
    print("\n  Checking documentation cross-references...")
    from agent_tools import doclinks

    if doclinks.main() != 0:
        sys.exit(1)


def run_catalog_coverage_check():
    """Verifies the module catalog still describes the tree — see agent_tools/catalog_coverage.py.

    Paired with, not covered by, the doc-graph check above: that one proves every link RESOLVES,
    which says nothing about a module nobody linked at all. A catalog can therefore rot into a
    partial map with every link green, and an agent trusting it as the map of the codebase reasons
    from a repo that no longer exists.
    """
    print("\n  Checking module catalog coverage...")
    from agent_tools import catalog_coverage

    if catalog_coverage.main() != 0:
        sys.exit(1)


def run_pipeline_gate_check():
    """Verifies every CI job actually gates the deploy — see agent_tools/pipeline_gates.py.

    An orphan job is invisible by inspection: it runs, it can go red, and the deploy ships anyway.
    """
    print("\n  Checking CI pipeline gating...")
    from agent_tools import pipeline_gates

    if pipeline_gates.main() != 0:
        sys.exit(1)


def run_complexity_check():
    """Cyclomatic complexity gate for the frontend JS — see agent_tools/complexity.py.

    A function that grows past a reasonable size reads fine one branch at a time in review; only
    counting the whole thing at once catches it, which review does not do reliably.
    """
    print("\n  Checking frontend cyclomatic complexity...")
    from agent_tools import complexity

    if complexity.main() != 0:
        sys.exit(1)


def run_frontend_lint():
    """Runs JS/CSS/JSON static analysis (Biome), applying the formatting it can fix itself.

    Pure formatting (line breaks, quotes, trailing commas) is not a decision anyone needs to make:
    printing a diff for a human to re-apply by hand only costs a second gate run, and a skipped
    re-run is what produced c3cc369. So the gate WRITES those fixes and then names every file it
    touched, loudly — the run stays observable, and `git diff` after a gate is the record of what it
    changed. Lint findings that need judgement are never auto-fixed: the verification pass below
    re-checks without --write and still fails the stage.
    """
    print("\n  Running Frontend Lint & Format (Biome)...")
    biome_path = ensure_biome_binary()
    if not biome_path:
        return

    before = _tracked_frontend_mtimes()
    subprocess.run(
        [biome_path, "check", "--write", *FRONTEND_LINT_TARGETS],
        capture_output=True,
        text=True,
    )
    rewritten = [
        path
        for path, stamp in _tracked_frontend_mtimes().items()
        if before.get(path) != stamp
    ]
    if rewritten:
        print(f"    ⓘ Formatter rewrote {len(rewritten)} file(s):")
        for path in sorted(rewritten):
            print(f"        {path}")

    # The verdict: a clean tree after the writes, or a genuine finding the formatter cannot fix.
    biome_res = subprocess.run([biome_path, "check", *FRONTEND_LINT_TARGETS])
    if biome_res.returncode != 0:
        print(
            "  ✗ Frontend static analysis failed (findings above need a human decision)."
        )
        sys.exit(1)
    print("  ✓ Frontend static analysis (Biome) passed.")


# src/ is the runtime app; tests/unit_js/ is the only other place hand-written JS lives (the
# node:test suite). Deliberately NOT all of tests/ — tests/fixtures/backups/*.json are frozen
# byte-for-byte on purpose (test_frozen_backup_corpus.py: "never edit an existing one, that would
# stop testing what it always tested"), and Biome would otherwise reformat their whitespace.
FRONTEND_LINT_TARGETS = ("src/", "tests/unit_js/")


def _tracked_frontend_mtimes():
    """(path -> mtime_ns) for every file Biome may rewrite, so the gate can report what it changed."""
    stamps = {}
    for target in FRONTEND_LINT_TARGETS:
        for root, _dirs, files in os.walk(target):
            for name in files:
                if name.endswith((".js", ".mjs", ".css", ".json")):
                    path = os.path.join(root, name)
                    stamps[path] = os.stat(path).st_mtime_ns
    return stamps


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


def venv_python_path():
    return (
        os.path.join(".venv", "Scripts", "python.exe")
        if os.name == "nt"
        else os.path.join(".venv", "bin", "python")
    )


def run_unit_tests():
    """Runs fast unit tests (tests/unit/ and tests/test_app.py)."""
    print("\n  Running Unit Tests...")
    returncode, output, path = run_logged(
        [
            venv_python_path(),
            "-m",
            "pytest",
            "-q",
            "--tb=short",
            "tests/unit/",
            "tests/test_app.py",
        ],
        "unit-tests",
    )
    if returncode != 0:
        print_digest("Unit tests", output, path)
        print(f"  ✗ Unit tests failed with exit code: {returncode}")
        sys.exit(returncode)
    print("  ✓ Unit tests passed successfully!")


def run_javascript_unit_tests():
    """Runs the pure-logic JavaScript test suite (tests/unit_js/) under node:test.

    These tests import src/data/*.js and src/modules/common/*.js directly as native ESM — no
    browser needed. They used to run only under Playwright because the app's CSP forbids
    `new Function`, so there was no in-process eval harness; Node's own `import()` never touches a
    page, so the CSP is not in play. Skipped rather than failed if the runtime could not be
    fetched locally (see ensure_node_binary) — CI always has it and fails hard instead.
    """
    print("\n  Running JavaScript Unit Tests (node:test)...")
    node_path = ensure_node_binary()
    if not node_path:
        return
    returncode, output, path = run_logged(
        # A bare directory arg fails on this Node build (misresolves as a CJS module
        # rather than a glob root); the explicit glob is what actually recurses.
        [node_path, "--test", "tests/unit_js/**/*.test.mjs"],
        "unit-js-tests",
    )
    if returncode != 0:
        print_digest("JavaScript unit tests", output, path)
        print(f"  ✗ JavaScript unit tests failed with exit code: {returncode}")
        sys.exit(returncode)
    print("  ✓ JavaScript unit tests passed successfully!")


def _playwright_worker_count():
    """Half the visible core count, not a hardcoded number — contributors run this on very
    different hardware, and a fixed "8" is either wasted (a 4-core laptop oversubscribes worse
    than -n auto ever would) or needlessly conservative (a 32-core CI box gets the same headroom
    ratio as this repo's 16-core dev machine, one Chromium instance per two cores, at half the
    wall time). Shared by both Playwright suites (run_e2e_tests and run_medium_tests) — full
    core-count parallelism (`-n auto`) has TWO independent failure modes here, not one: headless
    Chromium's own per-instance process fan-out (renderer/GPU/sandbox) starves compositor frame
    production for e2e's timing-sensitive assertions, but a medium test was assumed exempt from
    that and given `-n auto` anyway — which surfaced the OTHER cause instead: enough simultaneous
    fresh browser contexts opening their ~6 connections apiece can still burst past the dev
    server's TCP listen backlog (`deploy/local_http_server.py`'s `request_queue_size`), producing
    the exact same `Page.goto` 30s timeout e2e was capped to avoid (seen 2026-08-04, medium tier,
    full clean pipeline run). That constraint applies to ANY Playwright suite hitting this shared
    server, regardless of what the tests themselves assert — so both suites use this one function.
    `os.cpu_count()` can return None (containers with no /proc affinity info); fall back to a
    serial run rather than crashing the gate over an unknowable core count.

    DELIBERATELY NOT load-aware. Scaling this down by `os.getloadavg()` was tried on 2026-08-04 and
    reverted the same day: the stages run back-to-back, so Stage 3 samples the 1-minute load average
    seconds after Stage 2's own workers stopped — it reads the pipeline's OWN exhaust (measured: 4.2
    on a 16-core box, with nothing else running) and throttles itself for load that is already gone.
    The e2e stage went 171-191s at the static count to 359s at the throttled one, and still failed
    the same way, so the throttle cost three minutes and fixed nothing. If ambient load is genuinely
    the problem, the answer is to not run the gate while hammering the machine — not to let the gate
    misread its own footprint as a reason to go slower.
    """
    cpu_count = os.cpu_count() or 2
    return max(1, cpu_count // 2)


def run_medium_tests():
    """Runs the medium-tier Playwright suite (tests/medium/): one component mounted via a
    src/appBoot.js boot step, real index.html markup, no router/IndexedDB/service worker/demo-data
    seed (see tests/medium/_harness.py). Same worker count as run_e2e_tests — see
    _playwright_worker_count's docstring for why `-n auto` isn't safe for this suite either, even
    though it isn't timing-sensitive the way full e2e is.
    """
    print("\n  Running Medium Component Tests (parallel)...")
    returncode, output, path = run_logged(
        [
            venv_python_path(),
            "-m",
            "pytest",
            "-n",
            str(_playwright_worker_count()),
            "--dist=loadfile",
            "-q",
            "--tb=long",
            "tests/medium/",
        ],
        "medium-parallel",
    )
    if returncode == 0:
        print("  ✓ Medium component tests passed successfully!")
        return

    print_digest("Medium component tests", output, path)
    failed = failed_test_ids(output)
    print("  ✗ Medium component tests failed:")
    for test_id in failed:
        print(f"      • {test_id}")
    if not failed:
        print(
            f"    (runner itself died — collection error or crashed worker; see {path})"
        )
    print(f"    Full log: {path}")
    sys.exit(returncode)


def run_e2e_tests():
    """Runs Playwright browser E2E tests in parallel (every test under tests/e2e/).

    A failure fails the build outright — no automatic re-run. A prior version of this gate re-ran
    failing node ids serially and forgave them if that re-run passed, on the theory that pytest-xdist
    port contention against the shared dev server produced spurious timeouts. That masked more than
    it excused: not every failure this caught was port contention (a genuine app-level async race
    surfaced this way and went unnoticed for a while), and "passed on retry" is not evidence a test
    is reliable, only that it didn't fail *that* time. Flaky tests get fixed at the root — a race in
    the app, an under-specified wait in the test — not laundered through a second chance.
    See AGENT_RULES.md §2.A.3.

    What makes a failure here investigable without re-deriving it from scratch is `--tb=long` (the
    full call chain, not just the assertion line — parallel runs are isolated into their own log, so
    verbosity here drowns nothing out) plus build/testreport.py's digest, which lifts the raised
    exception out of that block and prints it FIRST, un-truncated.

    NO artifact capture. `--screenshot=only-on-failure --output=…` used to run here, documented as
    "essentially free at collection time". Measured 2026-08-04, that was simply false: any artifact
    option activates pytest-playwright's per-test artifact recorder, which wrapped every context in
    the suite and cost ~40s of a 175s stage (~23%) on a fully GREEN run, where by definition not one
    screenshot is written. Tracing and video were dropped earlier for the same reason at larger
    scale (a ~4-minute stage became 12+). Across ~11 real e2e failures diagnosed on 2026-08-04, every
    single one was read off the traceback and not one screenshot was opened — so the tax bought
    nothing it was claimed to. When a failure genuinely needs visual state, re-run that one node id
    with `--screenshot=on` (or `--tracing=on`), which is the same escalate-on-demand rule already
    applied to tracing rather than paying for it on every run.
    """
    print("\n  Running E2E Browser Tests (parallel)...")
    venv_python = venv_python_path()
    worker_count = _playwright_worker_count()
    returncode, output, path = run_logged(
        [
            venv_python,
            "-m",
            "pytest",
            "-n",
            str(worker_count),
            # Half the visible cores (_playwright_worker_count), not "auto" (= the full count): at full
            # core-count parallelism, headless Chromium's own per-instance process fan-out
            # (renderer, GPU, sandbox processes) creates enough contention to intermittently starve
            # compositor frame production — timing-sensitive tests failed under -n auto that were
            # reliable in isolation. Half the cores trades some wall-clock time for actually
            # deterministic runs, on any machine this happens to run on, not just this repo's.
            #
            # 2026-08-03: on this repo's 16-core dev machine, two consecutive full runs at -n 8
            # each dropped a different, disjoint set of ~7 tests to a `Page.goto` 30s timeout (all
            # passed cleanly in isolation) — NOT the Chromium-side contention above, which would
            # show up as flaky rendering/timing assertions, not navigation itself failing to
            # complete. Root cause was the dev server (deploy/local_http_server.py):
            # `socketserver`'s default TCP listen backlog is 5, and a fresh browser context opens
            # ~6 simultaneous connections just to fetch one page's ~89 assets — worker_count
            # contexts starting near-simultaneously (pytest-xdist's loadfile distribution) could
            # burst past that backlog, so `Page.goto` waited on a connection sitting in the
            # kernel's SYN queue rather than on anything the app or Chromium was doing. Fixed at
            # the actual bottleneck (`request_queue_size` raised there), not by lowering
            # parallelism — slowing the suite down would only have hidden the same server-side
            # limit on faster hardware, not removed it.
            "--dist=loadfile",
            "-q",
            "--tb=long",
            "tests/e2e/",
        ],
        "e2e-parallel",
    )
    if returncode == 0:
        print("  ✓ E2E browser tests passed successfully!")
        return

    print_digest("E2E browser tests", output, path)
    failed = failed_test_ids(output)
    print("  ✗ E2E browser tests failed:")
    for test_id in failed:
        print(f"      • {test_id}")
    if not failed:
        print(
            f"    (runner itself died — collection error or crashed worker; see {path})"
        )
    print(f"    Full log: {path}")
    print(
        "    Need visual state? Re-run that one node id with --screenshot=on (or --tracing=on)."
    )
    sys.exit(returncode)


def _csp_parity():
    """Extract the dev server's CSP header and index.html's <meta> CSP, and compare them."""
    import re

    server = open(
        os.path.join("deploy", "local_http_server.py"), encoding="utf-8"
    ).read()
    block = re.search(r'"Content-Security-Policy": \((.*?)\n    \),', server, re.S)
    header_policy = "".join(re.findall(r'"([^"]*)"', block.group(1))) if block else ""

    index = open(os.path.join("src", "index.html"), encoding="utf-8").read()
    meta = re.search(r'http-equiv="Content-Security-Policy"\s+content="([^"]*)"', index)
    return compare_csp(header_policy, meta.group(1) if meta else "")


# The ZAP scan's target: the local dev server, which serves src/ under the production sub-path.
ZAP_TARGET = "http://localhost:8081/LibrePT/"
ZAP_PORT = 8081

ZAP_ADDONS_DIR = os.path.join(".venv", "zap-addons")

# The passive-scan add-ons the stock `zaproxy/zap-stable` image does NOT bundle, pinned by version
# and SHA-256 exactly like the Biome and Node runtimes above. `commonlib` is pscanrulesBeta's own
# dependency, not an extra we chose — ZAP refuses to load the rules without it.
#
# Why vendor these at all: `zap-baseline.py` starts ZAP with `-addonupdate -addoninstall
# pscanrulesBeta`, so every scan re-fetched them from the ZAP marketplace. Measured 2026-08-04:
# 262s per scan with that round trip, 40s without it — i.e. ~85% of the gate's slowest stage was
# network I/O, not scanning this app.
#
# Passing ZAP's `-silent` flag alone "fixes" that and is a TRAP: with the marketplace unreachable
# the beta rules never load, and the scan happily reports `WARN-NEW: 0 / PASS: 57` having quietly
# stopped checking six things — including Source Code Disclosure [10099] and Dangerous JS Functions
# [10110], both squarely relevant to this app. A scan that checks LESS and still says clean is the
# false assurance AGENT_RULES §2.A.3 forbids. Vendoring the add-ons and THEN passing `-silent`
# keeps the full 67-rule set (verified by diffing rule ids against a marketplace run) at the fast
# path's speed.
#
# Pinned rather than refreshed on a timer on purpose: for a security gate, a change to WHICH rules
# run should be a visible, reviewable commit — not something that happens overnight and shifts what
# the gate enforces without anyone deciding to.
_ZAP_ADDONS = {
    "pscanrulesBeta-beta-50.zap": (
        "https://github.com/zaproxy/zap-extensions/releases/download/pscanrulesBeta-v50/pscanrulesBeta-beta-50.zap",
        "a979f7cd5d8be10e0338b417e006ec1e2f6ec79101010d570ddb5199892e921b",
    ),
    "commonlib-release-1.43.0.zap": (
        "https://github.com/zaproxy/zap-extensions/releases/download/commonlib-v1.43.0/commonlib-release-1.43.0.zap",
        "f1c46d6c65434a2a54307065b558a87121eaa5b9b6bc6cfb10bf230b6335d1f5",
    ),
}


def _file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_zap_addons():
    """Vendors the pinned ZAP passive-scan add-ons into .venv/zap-addons/, downloading only what is
    missing or checksum-mismatched. Returns the absolute directory to mount into the scanner, or
    None if it could not be assembled.

    Same contract as ensure_biome_binary/ensure_node_binary: pinned version, verified hash, cached
    under .venv/ so it is fetched once per environment rather than once per run (and never at all
    on a warm checkout). See _ZAP_ADDONS for why the add-ons are vendored instead of fetched by ZAP.
    """
    # urllib, NOT requests, deliberately: unlike every other job, the CI owasp-zap-scan job
    # (.github/workflows/deploy.yml) has no venv and no `pip install` — it runs bare system python
    # on the strength of `build` importing with stdlib only. `import requests` here would therefore
    # ImportError on the runner, failing a job the deploy gates on, while passing locally where the
    # venv has it. Keep this function stdlib-clean, or give that job a dependency install step.
    import urllib.request

    os.makedirs(ZAP_ADDONS_DIR, exist_ok=True)
    for name, (url, expected_hash) in _ZAP_ADDONS.items():
        path = os.path.join(ZAP_ADDONS_DIR, name)
        if os.path.exists(path) and _file_sha256(path) == expected_hash:
            continue
        if os.path.exists(path):
            os.remove(
                path
            )  # corrupt or superseded — never scan with an unverified rule set
        print(f"  Downloading ZAP add-on {name}...")
        try:
            with (
                urllib.request.urlopen(url, timeout=60) as response,
                open(path, "wb") as f,
            ):
                shutil.copyfileobj(response, f)
            actual = _file_sha256(path)
            if actual != expected_hash:
                os.remove(path)
                raise ValueError(
                    f"SHA256 mismatch for {name}\n    Expected: {expected_hash}\n    Got:      {actual}"
                )
        except Exception as e:
            print(f"  ✗ Failed to download/verify ZAP add-on {name}: {e}")
            return None
    return os.path.abspath(ZAP_ADDONS_DIR)


def check_required_meta_policies():
    """The <meta> security policies index.html must ship. Production is GitHub Pages, which sends no
    custom headers, so these tags ARE the deployed policy — not a belt-and-braces duplicate."""
    index_path = os.path.join("src", "index.html")
    if not os.path.exists(index_path):
        return [f"{index_path} not found"]
    with open(index_path, encoding="utf-8") as handle:
        content = handle.read()
    required = [
        'http-equiv="Content-Security-Policy"',
        'http-equiv="X-Content-Type-Options"',
        'http-equiv="Referrer-Policy"',
    ]
    return [f"missing {tag}" for tag in required if tag not in content]


def check_csp_parity():
    """(problems, notes) — is the SHIPPED policy as strong as the SCANNED one?

    ZAP validates the dev server's real HTTP headers; GitHub Pages cannot send headers at all. So
    hardening the header while leaving <meta> behind buys a green scan and ships nothing.
    """
    weaker, header_only = _csp_parity()
    notes = []
    if header_only:
        # Not a failure — a hosting limitation to accept knowingly rather than meet in an audit.
        notes.append(
            f"{', '.join(header_only)} cannot be expressed in <meta>, so production goes "
            "without (GitHub Pages sends no custom headers)"
        )
    return weaker, notes


def check_html_sinks():
    """User-controlled text reaching innerHTML unescaped — the bug class that shipped twice under a
    green ZAP badge, because a passive scan of a client-routed SPA never reaches these views."""
    return [
        f"{path}:{line}  ${{{expression}}} — wrap in escapeHTML(); an imported backup is untrusted"
        for path, line, expression in audit_html_sinks("src")
    ]


# Named, independently-reported checks rather than one opaque pass/fail: when this stage goes red,
# the line that fails should say WHICH property broke. All three are pure file analysis — despite
# the old name, nothing here is dynamic; ZAP is the only check that probes a running app.
STATIC_SECURITY_CHECKS = (
    ("Required <meta> security policies", lambda: (check_required_meta_policies(), [])),
    ("CSP parity (shipped <meta> vs scanned header)", check_csp_parity),
    ("HTML-sink escaping audit", lambda: (check_html_sinks(), [])),
)


def run_static_security_checks():
    """Run every static security check, reporting each by name.

    Deliberately runs them ALL before failing: a single run should list everything that is wrong,
    not stop at the first problem and make you re-run to discover the second.
    """
    print("\n  Running Static Security Audits...")
    failures = []
    for name, check in STATIC_SECURITY_CHECKS:
        problems, notes = check()
        if problems:
            print(f"    ✗ {name}")
            for problem in problems:
                print(f"        • {problem}")
            failures.append(name)
        else:
            print(f"    ✓ {name}")
        for note in notes:
            print(f"        note: {note}")

    if failures:
        print(f"  ✗ Static security audits failed: {', '.join(failures)}")
        sys.exit(1)
    print("  ✓ Static security audits passed.")


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

    # Fail CLOSED. Without these the scan still runs and still reports "clean", just with six fewer
    # rules — a weaker gate that looks identical in the log. Same reasoning as "a security scan that
    # scans nothing is a failed scan" (AGENT_RULES §2.A.3): silently scanning LESS is the same
    # false assurance, only harder to notice.
    addons_dir = ensure_zap_addons()
    if not addons_dir:
        print(
            "  ✗ OWASP ZAP add-ons could not be vendored — refusing to scan with an incomplete "
            "rule set (six passive rules, incl. Source Code Disclosure, would be silently skipped)."
        )
        sys.exit(1)

    print("    - Launching OWASP ZAP container baseline scan (host network)...")
    conf_dir = os.path.join(os.path.abspath("deploy"), "zap")
    container_name = "librept-zap-baseline"
    # ZAP baseline typically finishes in 3-4 minutes against an app this size; 20 minutes is a
    # generous ceiling, not a target. Bounded because an unbounded subprocess.run() turned a
    # genuine hang (or, observed 2026-08-04, severe host CPU contention — 8 Playwright workers
    # plus the operator's own browser tabs pushed 1-min load average to 13+/16 cores) into a gate
    # that never fails, never passes, and never tells you why: "a stage that cannot run is a
    # failure to fix, not a pass to log" (AGENT_RULES §2.A.3) applies to hanging, not just crashing.
    timeout_seconds = 1200
    try:
        # Logged like every other runner (build/testreport.py) rather than captured and thrown away
        # on success: this scan is the slowest stage in the gate, and when it took 9m27s instead of
        # its usual 3-4 (2026-08-04) there was no artifact to diagnose from, because the output was
        # only ever printed on failure. A stage you cannot explain the duration of is a stage you
        # cannot tune.
        returncode, output, path = run_logged(
            [
                docker_bin,
                "run",
                "--rm",
                "--name",
                container_name,
                "--network",
                "host",
                "-v",
                f"{conf_dir}:/zap/wrk:ro",
                # ZAP loads add-ons from its home plugin dir; mounting the vendored set there is
                # what makes `-silent` below safe (see _ZAP_ADDONS).
                "-v",
                f"{addons_dir}:/home/zap/.ZAP/plugin",
                "zaproxy/zap-stable",
                "zap-baseline.py",
                "-t",
                ZAP_TARGET,
                "-c",
                "zap-baseline.conf",
                # No marketplace round trip: every rule this scan needs is already mounted above.
                "-z",
                "-silent",
            ],
            "zap-baseline",
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired as e:
        # `docker run --rm` without -d is attached; killing the client process alone can leave the
        # container running server-side, so stop it explicitly rather than trust SIGTERM to propagate.
        subprocess.run([docker_bin, "stop", container_name], capture_output=True)
        print(
            f"  ✗ OWASP ZAP scan did not finish within {timeout_seconds}s — killed. "
            f"Partial output: {getattr(e, 'log_path', REPORT_DIR)}. "
            "Check host load (`uptime`) and Docker's own network reachability for the ZAP "
            "add-on update it runs on startup before assuming the app is at fault."
        )
        sys.exit(1)

    if returncode == 0:
        print(
            f"  ✓ OWASP ZAP baseline security scan passed cleanly (WARN-NEW: 0). Log: {path}"
        )
        return

    # Non-zero: surface the report tail so the offending alerts are visible, then fail.
    print("\n".join(output.strip().splitlines()[-40:]))
    print(f"  ✗ OWASP ZAP scan failed (exit {returncode}). Full log: {path}")
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
        "JavaScript Unit Tests": run_javascript_unit_tests,
        "Static Security Audits": run_static_security_checks,
        "Documentation Graph": run_doc_graph_check,
        "Module Catalog Coverage": run_catalog_coverage_check,
        "Pipeline Gating": run_pipeline_gate_check,
        "Cyclomatic Complexity": run_complexity_check,
    }

    stage_start = time.monotonic()
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        future_to_name = {
            executor.submit(_timed_task, name, task): name
            for name, task in tasks.items()
        }
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
    stage_elapsed = time.monotonic() - stage_start

    if failures:
        print(
            f"\n  ✗ Stage 1 failed in tasks: {', '.join(failures)} ({stage_elapsed:.1f}s)"
        )
        print(f"    Digests above; full runner logs in {REPORT_DIR}/")
        sys.exit(1)
    print(f"\n  ✓ Stage 1 completed cleanly! ({stage_elapsed:.1f}s)")


def run_stage_2_medium():
    """Stage 2: Runs the medium-tier component suite (tests/medium/) — see run_medium_tests'
    docstring for what makes this tier different from Stage 3's full e2e suite. Gated on Stage 1
    the same way Stage 3 is, so a broken component fails fast here before the pipeline pays for
    the slower, harder-to-diagnose full-flow suite."""
    print("\n=== Stage 2: Medium Component Tests ===")
    stage_start = time.monotonic()
    _timed_task("Medium Component Tests", run_medium_tests)
    print(f"\n  ✓ Stage 2 completed cleanly! ({time.monotonic() - stage_start:.1f}s)")


def run_stage_3_e2e():
    """Stage 3: Runs the E2E browser suite.

    The static security audits moved to stage 1 — they are file analysis, not dynamic checks.
    Split from the ZAP scan (stage 4, run sequentially after this one): in CI the two are already
    separate jobs on separate runners, each hitting its own dev server, so they never contend. The
    local `build check`/`build` path used to run them concurrently via one ThreadPoolExecutor
    against the SAME local :8081 server — ZAP's baseline scan floods it with requests while
    pytest-xdist's workers are mid-suite, and that contention produced `Page.goto` timeouts across
    unrelated specs (seen 2026-08-03: 30 failures, all `Timeout 30000ms exceeded`, with no relation
    to whatever the change under test touched). Running sequentially locally too trades some wall
    time for a gate that does not spuriously fail — matching AGENT_RULES' "never hand-wave a
    failure as probably flaky" stance: this was traceable to a real, avoidable contention source,
    not an unexplained flake to shrug off.
    """
    print("\n=== Stage 3: E2E Browser Tests ===")
    stage_start = time.monotonic()
    _timed_task("E2E Browser Tests", run_e2e_tests)
    print(f"\n  ✓ Stage 3 completed cleanly! ({time.monotonic() - stage_start:.1f}s)")


def run_stage_4_zap():
    """Stage 4: Runs the OWASP ZAP baseline scan, alone, after Stage 3's e2e suite has released
    the dev server — see run_stage_3_e2e's docstring for why this no longer runs concurrently
    with e2e locally."""
    print("\n=== Stage 4: OWASP ZAP Security Scan ===")
    stage_start = time.monotonic()
    _timed_task("OWASP ZAP Scan", run_owasp_zap_scan)
    print(f"\n  ✓ Stage 4 completed cleanly! ({time.monotonic() - stage_start:.1f}s)")


def run_lint():
    """Backwards-compatible wrapper for linting & scans."""
    run_python_lint()
    run_frontend_lint()
    run_security_audit()


def run_tests():
    """Backwards-compatible wrapper for running all tests."""
    run_unit_tests()
    run_medium_tests()
    run_e2e_tests()


def rewrite_base_href(target_dir, base):
    """GitHub Pages serves the site under /<repo>/, but the source assumes the domain root so it
    also works from localhost. Rewrite it for the published copy only."""
    index_path = os.path.join(target_dir, "index.html")
    with open(index_path, encoding="utf-8") as handle:
        html = handle.read()
    html = html.replace('<base href="/">', f'<base href="{base}">')
    with open(index_path, "w", encoding="utf-8") as handle:
        handle.write(html)


def run_build(base=None):
    """Builds and bundles the PWA files into the dist/ distribution directory.

    `base` rewrites `<base href="/">` to the given path and adds a `404.html` SPA fallback (Pages
    serves it for any path with no matching file, letting a deep link boot the app and resolve the
    route client-side) — used by the GitHub Pages deploy, which serves the site under `/<repo>/`
    rather than the domain root. Local builds omit it and keep `<base href="/">`.
    """
    print("\n>>> Step 3: Running Build & Bundle Step...")
    dist_dir = "dist"

    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)

    # The runtime app lives under src/. Publish that whole tree (index.html, app.js, index.css,
    # manifest.json, sw.js, i18n/, components/, icons/) flattened to the dist root so relative
    # paths resolve the same as in local dev. Mirrors .github/workflows/deploy.yml.
    src_dir = "src"
    if not os.path.isdir(src_dir):
        print(f"  Warning: {src_dir}/ not found!")
        os.makedirs(dist_dir)
        return

    shutil.copytree(src_dir, dist_dir)
    for path in sorted(os.listdir(dist_dir)):
        print(f"  Copied src/{path} -> {dist_dir}/{path}")

    stamp_build_version(dist_dir)
    if base:
        rewrite_base_href(dist_dir, base)
        # Pages serves 404.html for any path with no file, so shipping the shell there lets a deep
        # link to a clean route boot the app and resolve the route client-side.
        shutil.copyfile(
            os.path.join(dist_dir, "index.html"), os.path.join(dist_dir, "404.html")
        )
    # Last, so it covers the exact bytes actually served.
    generate_integrity_catalog(dist_dir)

    print(f"  ✓ Build complete. Bundle stored in: {os.path.abspath(dist_dir)}")


def stamp_build_version(dist_dir):
    """Overwrite dist/version.js with the real short commit SHA and UTC build time (the header
    build stamp). Mirrors the Pages deploy (.github/workflows/deploy.yml) — keep the two writers in
    sync. No release tag: multi-version hosting was dropped (TODO §16/§18) — one build carries every
    supported data schema concurrently, and storage keys on the schema major, not a release tag."""
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


INTEGRITY_CATALOG_NAME = "integrity.json"


def generate_integrity_catalog(dist_dir, catalog_name=INTEGRITY_CATALOG_NAME):
    """Write dist/integrity.json: a SHA-256 hash of every bundled file, keyed by its dist-root-relative
    (POSIX) path — the same path the service worker fetches it under.

    This is the download-integrity + version-coherence guarantee (README "Architectural Invariants").
    The service worker verifies each precached shell asset against this catalog and aborts the whole
    atomic install on any mismatch, so a corrupted download OR a stale file from a different build
    (a version skew) can never be cached alongside fresh ones. Run LAST in the bundle — AFTER every
    file mutation (version stamping, the <base href> rewrite, the 404.html copy) — so the recorded
    hashes match the exact bytes that ship. The catalog cannot hash itself, so it is excluded.

    Returns the {relpath: "sha256hex"} map for callers/tests."""
    files = {}
    for root, _dirs, names in os.walk(dist_dir):
        for name in names:
            abs_path = os.path.join(root, name)
            rel = os.path.relpath(abs_path, dist_dir).replace(os.sep, "/")
            if rel == catalog_name:
                continue
            with open(abs_path, "rb") as f:
                files[rel] = hashlib.sha256(f.read()).hexdigest()

    catalog = {"algorithm": "SHA-256", "files": dict(sorted(files.items()))}
    with open(os.path.join(dist_dir, catalog_name), "w") as f:
        json.dump(catalog, f, indent=2, sort_keys=False)
        f.write("\n")
    print(f"  Wrote {catalog_name} ({len(files)} files hashed, SHA-256)")
    return files
