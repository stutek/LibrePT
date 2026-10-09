#!/usr/bin/env python3
# .agents/skills/exploratory-test/cloud_setup.py
"""Makes a cloud session (claude.ai/code) able to explore the app. One command, safe to run again.

A cloud session reaches the package registries and GitHub, and nothing else: `stutek.github.io`,
where mode 1 of SKILL.md tests the published app, and `cdn.playwright.dev`, where Playwright
downloads its Chromium, both answer 403 at the session's proxy. Found 2026-10-09, when a second
cloud session could not open the app at all. This script stands in for both:

1. The project's Python environment, `.venv`, at the version `.python-version` names.
2. A Chromium Playwright can launch. The machine image carries an older Playwright build in
   /opt/pw-browsers; it is linked under the revision this Playwright asks for. It is an older
   Chrome, and the script says which one, so a finding that may depend on the version is known.
3. The PUBLISHED build, served locally: a git worktree beside this repository, checked out at the
   commit of the last successful deploy, served on PUBLISHED_PORT. It stays at that commit until
   this script runs again, so it is frozen the way mode 1 needs.
4. The dev server, which serves `main` for mode 2.

Standard library only: it runs before `.venv` exists.

    python3 .agents/skills/exploratory-test/cloud_setup.py
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from deploy.local_http_server import (  # noqa: E402  (needs ROOT on the path first)
    DEV_SERVER_BASE_PATH,
    DEV_SERVER_PORT,
    SNAPSHOT_SERVER_PORT,
)

VENV_PYTHON = ROOT / ".venv" / "bin" / "python"
PRESHIPPED_BROWSERS = Path("/opt/pw-browsers")
PLAYWRIGHT_CACHE = Path(
    os.environ.get("PLAYWRIGHT_BROWSERS_PATH") or Path.home() / ".cache/ms-playwright"
)
PUBLISHED_TREE = ROOT.parent / f"{ROOT.name}-published"
# Beside the dev server's port and the gate's snapshot port, and different from both.
PUBLISHED_PORT = 8090
assert PUBLISHED_PORT not in (DEV_SERVER_PORT, SNAPSHOT_SERVER_PORT)
DEPLOY_WORKFLOW = "deploy.yml"


def run(command, **kwargs):
    return subprocess.run(
        command, check=True, text=True, capture_output=True, **kwargs
    ).stdout.strip()


def ensure_python_environment():
    if VENV_PYTHON.exists():
        print(f"Python environment: {VENV_PYTHON.relative_to(ROOT)} (already there)")
        return
    if not shutil.which("uv"):
        sys.exit(
            "No .venv and no `uv` to make one with. Install uv, or make .venv by hand."
        )
    version = (ROOT / ".python-version").read_text().strip()
    run(["uv", "python", "install", version])
    run(["uv", "venv", "-p", version, str(ROOT / ".venv")])
    run(
        [
            "uv",
            "pip",
            "install",
            "-p",
            str(VENV_PYTHON),
            "-r",
            str(ROOT / "requirements.txt"),
        ]
    )
    print(f"Python environment: {VENV_PYTHON.relative_to(ROOT)} made, Python {version}")


def playwright_chromium():
    """The path Playwright will launch, and the Chromium revisions it expects, asked of Playwright."""
    script = (
        "import json, os, playwright\n"
        "from playwright.sync_api import sync_playwright\n"
        "p = sync_playwright().start()\n"
        "path = p.chromium.executable_path\n"
        "p.stop()\n"
        "listing = os.path.join(os.path.dirname(playwright.__file__), 'driver/package/browsers.json')\n"
        "browsers = json.load(open(listing))['browsers']\n"
        "print(json.dumps([path, {b['name']: b for b in browsers}]))\n"
    )
    path, browsers = json.loads(run([str(VENV_PYTHON), "-c", script]))
    return Path(path), browsers


def newest_preshipped(prefix):
    builds = sorted(
        PRESHIPPED_BROWSERS.glob(f"{prefix}-*"),
        key=lambda p: int(p.name.rsplit("-", 1)[1]),
    )
    return builds[-1] / "chrome-linux" if builds else None


def link_build(target_dir, source_dir, renames):
    """`target_dir` filled with links to every file of `source_dir`, plus `renames` (new → old)."""
    target_dir.mkdir(parents=True, exist_ok=True)
    for item in source_dir.iterdir():
        link = target_dir / item.name
        if not link.exists():
            link.symlink_to(item)
    for new, old in renames.items():
        if not (target_dir / new).exists():
            (target_dir / new).symlink_to(source_dir / old)
    for marker in ("INSTALLATION_COMPLETE", "DEPENDENCIES_VALIDATED"):
        (target_dir.parent / marker).touch()


def ensure_browser():
    wanted, browsers = playwright_chromium()
    full = newest_preshipped("chromium")
    shell = newest_preshipped("chromium_headless_shell")
    if not wanted.exists():
        if not (full and shell):
            sys.exit(
                f"Playwright wants {wanted}, and {PRESHIPPED_BROWSERS} holds no Chromium to stand in."
            )
        revision = browsers["chromium"]["revision"]
        shell_revision = browsers["chromium-headless-shell"]["revision"]
        link_build(
            PLAYWRIGHT_CACHE / f"chromium-{revision}" / "chrome-linux64", full, {}
        )
        link_build(
            PLAYWRIGHT_CACHE
            / f"chromium_headless_shell-{shell_revision}"
            / "chrome-headless-shell-linux64",
            shell,
            {"chrome-headless-shell": "headless_shell"},
        )
    version = run([str(wanted), "--version", "--no-sandbox"])
    expected = browsers["chromium"]["browserVersion"]
    stand_in = (
        ""
        if expected in version
        else f", standing in for the {expected} Playwright asks for"
    )
    print(f"Browser: {version}{stand_in}")


def responds(port):
    url = f"http://localhost:{port}{DEV_SERVER_BASE_PATH}"
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(url, timeout=3) as response:
            return response.status == 200
    except OSError:
        return False


def ensure_server(tree, port):
    """The dev server of `tree` on `port`, started in the background if nothing answers there."""
    if not responds(port):
        log_dir = tree / ".build-reports"
        log_dir.mkdir(exist_ok=True)
        with open(log_dir / f"server-{port}.log", "a") as log:
            subprocess.Popen(
                [
                    str(VENV_PYTHON),
                    "-m",
                    "deploy.local_http_server",
                    "--port",
                    str(port),
                ],
                cwd=tree,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        for _ in range(40):
            time.sleep(0.25)
            if responds(port):
                break
        else:
            sys.exit(
                f"The server for {tree} did not answer on port {port}; see {log_dir}."
            )
    return f"http://localhost:{port}{DEV_SERVER_BASE_PATH}"


def published_commit():
    """The commit GitHub Pages serves: the head of the last deploy run that succeeded."""
    sha = run(
        [
            "gh",
            "run",
            "list",
            "-w",
            DEPLOY_WORKFLOW,
            "-s",
            "success",
            "-L",
            "1",
            "--json",
            "headSha",
            "-q",
            ".[0].headSha",
        ],
        cwd=ROOT,
    )
    if not sha:
        sys.exit(
            "No successful deploy run was found, so the published commit is unknown."
        )
    return sha


def ensure_published_tree(sha):
    run(["git", "fetch", "--quiet", "--depth=1", "origin", sha], cwd=ROOT)
    if (PUBLISHED_TREE / ".git").exists():
        run(["git", "checkout", "--quiet", "--detach", sha], cwd=PUBLISHED_TREE)
    else:
        run(
            ["git", "worktree", "add", "--quiet", "--detach", str(PUBLISHED_TREE), sha],
            cwd=ROOT,
        )


def main():
    ensure_python_environment()
    ensure_browser()
    sha = published_commit()
    ensure_published_tree(sha)
    published = ensure_server(PUBLISHED_TREE, PUBLISHED_PORT)
    current = ensure_server(ROOT, DEV_SERVER_PORT)
    print(
        f"Published build, for mode 1: {published}  (commit {sha[:7]}, the one GitHub Pages serves)"
    )
    print(f"main, for mode 2: {current}")


if __name__ == "__main__":
    main()
