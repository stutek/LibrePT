"""LibrePT build steps: environment check, test run, and bundling src/ into dist/.

Run the whole build (env -> tests -> bundle) with `python -m build`, or import the individual
steps (used by the root pipeline.py orchestrator). Paths are relative to the current working
directory, so run these from the repository root.
"""
import os
import sys
import shutil

import pytest


def check_environment():
    """Verifies that the virtual environment, pytest, and playwright are set up."""
    print(">>> Step 1: Checking Environment Setup...")

    if not os.path.exists(".venv"):
        print("  Virtual environment '.venv' not found. Creating and installing dependencies...")
        import subprocess
        subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
        pip_path = os.path.join(".venv", "bin", "pip")
        subprocess.run([pip_path, "install", "pytest", "playwright", "pytest-playwright"], check=True)

        playwright_path = os.path.join(".venv", "bin", "playwright")
        subprocess.run([playwright_path, "install", "chromium"], check=True)
    else:
        print("  ✓ Virtual environment '.venv' verified.")


def run_tests():
    """Runs the test suite programmatically. Allows a debugger to step directly into test setup."""
    print("\n>>> Step 2: Running Automated Test Suite...")

    exit_code = pytest.main(["-v", "tests/"])

    if exit_code != 0:
        print(f"\n  ✗ Test suite failed with exit code: {exit_code}")
        sys.exit(exit_code)
    print("  ✓ All tests passed successfully!")


def run_build():
    """Builds and bundles the PWA files into the dist/ distribution directory."""
    print("\n>>> Step 3: Running Build & Bundle Step...")
    dist_dir = 'dist'

    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)

    # The runtime app lives under src/. Publish that whole tree (index.html, app.js, index.css,
    # manifest.json, sw.js, i18n/, components/, icons/) flattened to the dist root so relative
    # paths resolve the same as in local dev. Mirrors .github/workflows/deploy.yml.
    #
    # Note: this local dist keeps <base href="/"> because it is served at the domain root.
    # The GitHub Pages deploy (deploy.yml) additionally rewrites <base> to the /<repo>/ sub-path,
    # since a project site is served under stutek.github.io/<repo>/, not the root.
    src_dir = 'src'
    if not os.path.isdir(src_dir):
        print(f"  Warning: {src_dir}/ not found!")
        os.makedirs(dist_dir)
        return

    shutil.copytree(src_dir, dist_dir)
    for path in sorted(os.listdir(dist_dir)):
        print(f"  Copied src/{path} -> {dist_dir}/{path}")

    print(f"  ✓ Build complete. Bundle stored in: {os.path.abspath(dist_dir)}")
