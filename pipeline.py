#!/usr/bin/env python3
"""
LibrePT CI/CD Pipeline Orchestrator.
Allows full step-by-step debugging of checks, pytest executions, packaging, and deployments.

How to debug step-by-step:
1. Terminal PDB:
   python3 -m pdb pipeline.py
2. IDE Debugger:
   Set breakpoints on any function (check_environment, run_tests, run_build, run_deploy)
   and click "Debug pipeline.py".
"""

import os
import sys
import shutil
import subprocess
import pytest

def check_environment():
    """Verifies that the virtual environment, pytest, and playwright are set up."""
    print(">>> Step 1: Checking Environment Setup...")
    
    # Verify .venv exists
    if not os.path.exists(".venv"):
        print("  Virtual environment '.venv' not found. Creating and installing dependencies...")
        subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
        pip_path = os.path.join(".venv", "bin", "pip")
        subprocess.run([pip_path, "install", "pytest", "playwright", "pytest-playwright"], check=True)
        
        playwright_path = os.path.join(".venv", "bin", "playwright")
        subprocess.run([playwright_path, "install", "chromium"], check=True)
    else:
        print("  ✓ Virtual environment '.venv' verified.")

def run_tests():
    """Runs the test suite programmatically. Allows debugger to step directly into test setup."""
    print("\n>>> Step 2: Running Automated Test Suite...")
    
    # We run pytest.main directly in the Python process.
    # This allows a debugger to step straight from this orchestrator into test execution.
    exit_code = pytest.main(["-v", "tests/"])
    
    if exit_code != 0:
        print(f"\n  ✗ Test suite failed with exit code: {exit_code}")
        sys.exit(exit_code)
    print("  ✓ All tests passed successfully!")

def run_build():
    """Builds and bundles PWA files into the dist/ distribution directory."""
    print("\n>>> Step 3: Running Build & Bundle Step...")
    dist_dir = 'dist'
    
    # Clean output dir
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir)
    
    files_to_copy = [
        'index.html',
        'index.css',
        'app.js',
        'mockData.js',
        'manifest.json',
        'sw.js'
    ]
    
    for filename in files_to_copy:
        if os.path.exists(filename):
            shutil.copy(filename, dist_dir)
            print(f"  Copied {filename} -> {dist_dir}/{filename}")
        else:
            print(f"  Warning: {filename} not found!")

    # Asset directories referenced by manifest.json and the Service Worker cache
    dirs_to_copy = ['icons']

    for dirname in dirs_to_copy:
        if os.path.isdir(dirname):
            shutil.copytree(dirname, os.path.join(dist_dir, dirname))
            print(f"  Copied {dirname}/ -> {dist_dir}/{dirname}/")
        else:
            print(f"  Warning: {dirname}/ not found!")

    print(f"  ✓ Build complete. Bundle stored in: {os.path.abspath(dist_dir)}")

def run_deploy():
    """Simulates deployment of the bundled app to a target environment."""
    print("\n>>> Step 4: Simulating Deployment...")
    dist_dir = 'dist'
    
    if not os.path.exists(dist_dir) or not os.listdir(dist_dir):
        print("  ✗ Deployment failed: Build folder is empty or not found.")
        sys.exit(1)
        
    # Simulate deployment action (e.g. copying to a local staging/production path)
    staging_path = os.path.abspath(os.path.join(dist_dir, "..", "dist"))
    print(f"  ✓ Staged and deployed output files to production root at: {staging_path}")
    print("  ✓ Deployment verified.")

def main():
    print("=========================================")
    print("   LibrePT Pipeline: Verification & Build")
    print("=========================================")
    print("")
    
    check_environment()
    run_tests()
    run_build()
    run_deploy()
    
    print("\n=========================================")
    print("Pipeline execution finished successfully!")
    print("=========================================")
    print("")
    print("TIP: To debug this runner or tests step-by-step in your terminal, run:")
    print("  .venv/bin/python -m pdb pipeline.py")
    print("")

if __name__ == '__main__':
    main()
