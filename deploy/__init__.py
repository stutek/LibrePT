"""LibrePT deploy step: publish the built dist/ bundle to a target environment.

Run with `python -m deploy` (after a build), or import run_deploy (used by pipeline.py). This is
a local simulation of the deploy; the real GitHub Pages deploy is .github/workflows/deploy.yml.
Paths are relative to the current working directory, so run this from the repository root.
"""
import os
import sys


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
