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

from build.frontend_audit import audit_html_sinks, compare_csp
from build.testreport import REPORT_DIR, failed_test_ids, print_digest, run_logged


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


# Platform/arch detection, download, and integrity verification for one binary — each step depends
# on the platform branch taken above it, so splitting would thread the same platform_suffix/
# biome_path pair through several functions for no real separation of concerns. Pre-existing debt,
# not part of today's complexity-gate work.
def ensure_biome_binary():  # noqa: C901
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

    # Three independent corruption checks (existence, size, magic bytes, checksum) that all have
    # to run and all have to pass — genuinely one sequential validation, not several concerns.
    # Pre-existing debt, not part of today's complexity-gate work.
    def verify_binary_integrity(path):  # noqa: C901
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
        [biome_path, "check", "--write", "src/"], capture_output=True, text=True
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
    biome_res = subprocess.run([biome_path, "check", "src/"])
    if biome_res.returncode != 0:
        print(
            "  ✗ Frontend static analysis failed (findings above need a human decision)."
        )
        sys.exit(1)
    print("  ✓ Frontend static analysis (Biome) passed.")


def _tracked_frontend_mtimes():
    """(path -> mtime_ns) for every file Biome may rewrite, so the gate can report what it changed."""
    stamps = {}
    for root, _dirs, files in os.walk("src"):
        for name in files:
            if name.endswith((".js", ".css", ".json")):
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


E2E_ARTIFACT_DIR = os.path.join(REPORT_DIR, "e2e-artifacts")


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

    What actually makes a failure here investigable without re-deriving it from scratch: `--tb=long`
    (the full call chain, not just the assertion line — parallel runs are already isolated into their
    own log so verbosity here doesn't drown anything out), plus a screenshot at the moment of failure
    retained ONLY for failing tests (`.build-reports/e2e-artifacts/`) — one static capture, essentially
    free at collection time, unlike tracing/video (both tried and dropped: they record CONTINUOUSLY
    for every test, not just on failure, and at full -n auto parallelism that measurably slowed the
    whole run — a ~4-minute e2e stage became 12+ minutes. Self-inflicted load working directly against
    the goal of fewer load-induced flakes. If a screenshot isn't enough to diagnose a specific failure,
    re-run that one node id alone with `--tracing=on` rather than paying the cost on every run.
    """
    print("\n  Running E2E Browser Tests (parallel)...")
    venv_python = venv_python_path()
    returncode, output, path = run_logged(
        [
            venv_python,
            "-m",
            "pytest",
            "-n",
            "8",
            # Fixed at 8, not "auto" (= nproc, 16 here): at full core-count parallelism, headless
            # Chromium's own per-instance process fan-out (renderer, GPU, sandbox processes) creates
            # enough contention to intermittently starve compositor frame production — timing-
            # sensitive tests failed under -n auto that were reliable in isolation and even reliable
            # at -n 4. Half the cores trades some wall-clock time for actually deterministic runs.
            "--dist=loadfile",
            "-q",
            "--tb=long",
            "--screenshot=only-on-failure",
            f"--output={E2E_ARTIFACT_DIR}",
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
    print(f"    Traces/screenshots/video for failing tests: {E2E_ARTIFACT_DIR}/")
    print("    Open a trace with: .venv/bin/playwright show-trace <trace.zip>")
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
        "Static Security Audits": run_static_security_checks,
        "Documentation Graph": run_doc_graph_check,
        "Pipeline Gating": run_pipeline_gate_check,
        "Cyclomatic Complexity": run_complexity_check,
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
        print(f"    Digests above; full runner logs in {REPORT_DIR}/")
        sys.exit(1)
    print("\n  ✓ Stage 1 completed cleanly!")


def run_stage_2_parallel():
    """Stage 2: Runs the E2E browser suite and the OWASP ZAP scan concurrently.

    The static security audits moved to stage 1 — they are file analysis, not dynamic checks."""
    import concurrent.futures

    print("\n=== Stage 2: E2E Browser Tests & OWASP ZAP Scan (Parallel Execution) ===")
    tasks = {
        "E2E Browser Tests": run_e2e_tests,
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
        print(f"    Digests above; full runner logs in {REPORT_DIR}/")
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
    generate_integrity_catalog(dist_dir)

    print(f"  ✓ Build complete. Bundle stored in: {os.path.abspath(dist_dir)}")


def resolve_release_tag():
    """The git tag this build is cut from — the release identity (TODO §16) used by versioned
    hosting, per-version storage namespacing and the upgrade/rollback flow.

    Deliberately `--exact-match`: only a commit that IS a tag is a release. A commit sitting a few
    commits past v1.2.0 is NOT v1.2.0 — calling it that would let an untagged build write into a
    released version's storage bucket. Anything untagged is "dev" and simply opts out of switching.
    """
    try:
        return (
            subprocess.check_output(
                ["git", "describe", "--tags", "--exact-match"],
                stderr=subprocess.DEVNULL,
            )
            .decode()
            .strip()
            or "dev"
        )
    except Exception:
        return "dev"


def stamp_build_version(dist_dir):
    """Overwrite dist/version.js with the real short commit SHA, UTC build time and release tag (the
    header build stamp). Mirrors the Pages deploy (.github/workflows/deploy.yml) — keep the two
    writers in sync; test_release_identity.py checks they emit the same fields."""
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
    release = resolve_release_tag()
    with open(os.path.join(dist_dir, "version.js"), "w") as f:
        f.write(
            f'export const BUILD_INFO = {{ commit: "{commit}", builtAt: "{built_at}", release: "{release}" }};\n'
        )
    print(f"  Stamped build {commit} ({built_at}) release {release}")


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
