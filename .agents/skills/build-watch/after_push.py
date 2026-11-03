#!/usr/bin/env python3
"""After a push to main: watch the build, and open a session to fix it if it falls.

Called by the git pre-push hook, so it covers a push from any terminal, not only from an agent.
Git runs that hook BEFORE the push is sent and stops the push on a non-zero exit, so this returns 0
at once, whatever happens, and leaves a detached copy of itself to do the waiting. watch.py waits
until the runs of the pushed commit exist and have finished.

    python3 .agents/skills/build-watch/after_push.py < <pre-push stdin>   # from the hook
    python3 .agents/skills/build-watch/after_push.py --watch <sha>        # the detached part

On a green build it shows a desktop notice. On a fall it opens LibrePT in VS Code and a new Claude
Code tab whose prompt asks to fix the fall; the prompt is not sent until Simon presses Enter, so no
agent commits without him. The link is the one the Claude Code extension documents for "Launch a VS
Code tab from other tools" (code.claude.com/docs/en/vs-code.md).
"""

import os
import shutil
import subprocess
import sys
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
LOG_DIR = os.path.join(ROOT, ".private", "tmp", "build-watch")
WATCH = os.path.join(HERE, "watch.py")
MAIN = "refs/heads/main"


def pushed_main_shas(lines):
    """The commits a push sends to main, read from the lines git gives pre-push on stdin:
    `<local ref> <local sha> <remote ref> <remote sha>`. A deletion has an all-zero local sha."""
    shas = []
    for line in lines:
        parts = line.split()
        if len(parts) == 4 and parts[2] == MAIN and set(parts[1]) != {"0"}:
            shas.append(parts[1])
    return shas


def start(lines):
    for sha in pushed_main_shas(lines):
        os.makedirs(LOG_DIR, exist_ok=True)
        log_path = os.path.join(LOG_DIR, f"{sha[:7]}.log")
        with open(log_path, "w", encoding="utf-8") as log:
            subprocess.Popen(
                [sys.executable, os.path.abspath(__file__), "--watch", sha],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        print(
            f"build-watch: watching the build of {sha[:7]}; log {log_path}",
            file=sys.stderr,
        )


def notify(title, body):
    if shutil.which("notify-send"):
        subprocess.run(["notify-send", title, body], check=False)


def open_fix_session(sha):
    report = os.path.join(".private", "BUILD_WATCH", f"{sha[:7]}.md")
    prompt = (
        f"LibrePT: gradnja na GitHubu za {sha[:7]} je padla. Poročilo je v {report}. Preberi "
        ".agents/skills/build-watch/SKILL.md, razdelek »After a push«, in popravi padec."
    )
    url = "vscode://anthropic.claude-code/open?prompt=" + urllib.parse.quote(
        prompt, safe=""
    )
    # The tab opens in the VS Code window in front; `code` brings LibrePT's window there first.
    subprocess.run(["code", ROOT], check=False)
    time.sleep(2)
    subprocess.run(["xdg-open", url], check=False)


def watch(sha):
    code = subprocess.run([sys.executable, WATCH, "--sha", sha], cwd=ROOT).returncode
    if code == 0:
        notify("LibrePT: gradnja zelena", f"Vsi zagoni za {sha[:7]} so uspeli.")
    elif code == 1:
        notify(
            "LibrePT: gradnja padla",
            f"{sha[:7]}: odpira se zavihek Claude s popravilom.",
        )
        open_fix_session(sha)
    else:
        notify("LibrePT: gradnja ni končala", f"{sha[:7]}: glej .private/BUILD_WATCH/.")
    return code


def main(argv):
    if len(argv) == 2 and argv[0] == "--watch":
        return watch(argv[1])
    try:
        start(sys.stdin.read().splitlines())
    except Exception as error:  # a failed watch must never stop the push
        print(f"build-watch: not started ({error})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
