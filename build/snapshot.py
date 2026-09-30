"""The gate on a COPY of the tree: HEAD plus the paths one session names, and a commit of exactly that.

`python -m build check -- <path> ...`   runs the whole gate on HEAD + those paths, in a snapshot
`python -m build commit -F <msg> -- <path> ...`   commits those paths, if they are what that run proved

**Why.** Several sessions write in one working tree, and a gate run proves a whole tree. So a run in
the shared tree needed every other session to stop writing for its nine minutes, and whatever another
session had half-written failed it: on 2026-09-30 one session had to move its unfinished work out of
the tree with `git stash` so another could run the gate, and putting it back collided with the first
session's staged files. A snapshot removes the reason to wait: the run sees HEAD and the named paths
and nothing else, so nobody else's edit can fail it or has to pause for it.

**What is proved is what is committed.** A green run writes `.build-reports/proof.json`: the HEAD it
started from and the SHA-256 of every named path. `build commit` refuses unless each path still has
that content, and unless HEAD has not moved or has moved only by Markdown files — a commit of code by
another session since then makes the combined tree unproven, and the answer is another run. The
commit is built in a private index, so the shared one (where another session may have staged its own
work) neither leaks into it nor is overwritten by it.

**The snapshot's own server.** Browser tests reach the app through a dev server, and the shared one
on DEV_SERVER_PORT serves the shared tree. The run therefore starts a server of the snapshot's own
on SNAPSHOT_SERVER_PORT, tells every process of the run through LIBREPT_DEV_SERVER_PORT, and stops it
at the end: it belongs to this run, unlike the shared one, which only the maintainer stops.

**One gate at a time still holds.** The shared tree's `.build-reports/gate.lock` is taken for the
whole run, so a snapshot run and a run in the shared tree never compete for the cores.

The snapshot lives outside the repository (`~/.cache/librept/gate-snapshot`), so a tool that walks
the repository never finds a second copy of every file. It is a git worktree, reused between runs.
"""

import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time

from deploy.local_http_server import PORT_ENV, SNAPSHOT_SERVER_PORT

from . import gate_lock
from .testreport import REPORT_DIR

SNAPSHOT_DIR = os.path.join(
    os.path.expanduser("~"), ".cache", "librept", "gate-snapshot"
)
PROOF_PATH = os.path.join(REPORT_DIR, "proof.json")
RUN_HISTORY_NAME = "last-run.json"


def _git(*args, cwd=None, capture=True, env=None):
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=capture, text=True, env=env, check=False
    )
    if result.returncode:
        raise SystemExit(f"  ✗ git {' '.join(args)} failed:\n{result.stderr.strip()}")
    return result.stdout if capture else ""


def digest(path):
    """SHA-256 of a path's bytes, or None when the path does not exist (a deletion)."""
    if not os.path.lexists(path):
        return None
    with open(path, "rb") as handle:
        return hashlib.sha256(handle.read()).hexdigest()


def check_paths(paths, tracked_in_head):
    """The refusal text for paths that cannot be proved one by one, or None.

    A path is a FILE in the working tree, or a file HEAD tracks and the tree has deleted. A directory
    is refused rather than expanded: what goes into the commit is then exactly what was typed.
    """
    if not paths:
        return "  ✗ Name the paths to prove:  build check -- <path> ..."
    wrong = []
    for path in paths:
        if os.path.isabs(path) or path.startswith(".."):
            wrong.append(f"{path} (outside the repository)")
        elif os.path.isdir(path):
            wrong.append(f"{path} (a directory — name its files)")
        elif not os.path.exists(path) and path not in tracked_in_head:
            wrong.append(f"{path} (neither in the tree nor in HEAD)")
    if wrong:
        return "  ✗ These cannot be proved:\n" + "\n".join(f"      {w}" for w in wrong)
    return None


def _tracked_in_head(paths):
    listed = _git("ls-tree", "-r", "--name-only", "HEAD", "--", *paths)
    return set(listed.split("\n")) - {""}


def prepare(paths, snapshot=SNAPSHOT_DIR):
    """Make `snapshot` HEAD plus the working-tree content of `paths`. Returns (head, digests)."""
    head = _git("rev-parse", "HEAD").strip()
    if not os.path.isdir(os.path.join(snapshot, ".git")) and not os.path.isfile(
        os.path.join(snapshot, ".git")
    ):
        _git("worktree", "prune")
        if os.path.exists(snapshot):
            shutil.rmtree(snapshot)
        os.makedirs(os.path.dirname(snapshot), exist_ok=True)
        _git("worktree", "add", "--detach", "--force", snapshot, head)
    else:
        _git("checkout", "--quiet", "--force", "--detach", head, cwd=snapshot)
        _git("clean", "-fdq", cwd=snapshot)

    digests = {}
    for path in paths:
        target = os.path.join(snapshot, path)
        digests[path] = digest(path)
        if digests[path] is None:
            if os.path.lexists(target):
                os.remove(target)
            continue
        os.makedirs(os.path.dirname(target) or snapshot, exist_ok=True)
        shutil.copy2(path, target)

    venv = os.path.join(snapshot, ".venv")
    if not os.path.lexists(venv):
        os.symlink(os.path.abspath(".venv"), venv)
    reports = os.path.join(snapshot, REPORT_DIR)
    os.makedirs(reports, exist_ok=True)
    history = os.path.join(REPORT_DIR, RUN_HISTORY_NAME)
    if os.path.exists(history):
        shutil.copy2(history, os.path.join(reports, RUN_HISTORY_NAME))
    return head, digests


def _port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(0.2)
        return probe.connect_ex(("127.0.0.1", port)) == 0


def start_server(snapshot=SNAPSHOT_DIR, port=SNAPSHOT_SERVER_PORT):
    """The snapshot's own dev server, serving the snapshot's src/. Refuses a port already taken:
    whatever answers there serves some other tree, and testing against it proves nothing."""
    if _port_open(port):
        raise SystemExit(
            f"  ✗ Port {port} is already answering. A snapshot run needs its own server there;\n"
            "    another snapshot run, or a stray server, holds it. Find it with:  ss -ltnp"
        )
    server = subprocess.Popen(
        [
            sys.executable,
            os.path.join(snapshot, "deploy", "local_http_server.py"),
            "--port",
            str(port),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.monotonic() + 10
    while not _port_open(port):
        if time.monotonic() >= deadline or server.poll() is not None:
            server.kill()
            raise SystemExit(
                f"  ✗ The snapshot's dev server did not start on port {port}."
            )
        time.sleep(0.1)
    return server


def write_proof(head, digests, path=PROOF_PATH):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump({"head": head, "paths": digests}, handle, indent=2)


def run_check(paths):
    """`build check -- <paths>`: the gate in the snapshot. Returns the exit code."""
    refusal = check_paths(paths, _tracked_in_head(paths))
    if refusal:
        print(refusal)
        return 2
    holding, refusal = gate_lock.acquire()
    if not holding:
        print(refusal)
        return 1
    server = None
    try:
        if os.path.exists(PROOF_PATH):
            os.remove(PROOF_PATH)
        head, digests = prepare(paths)
        print(f">>> Snapshot at {SNAPSHOT_DIR}: HEAD {head[:7]} + {len(paths)} path(s)")
        for path in paths:
            print(f"      {path}{'  (deleted)' if digests[path] is None else ''}")
        server = start_server()
        env = {**os.environ, PORT_ENV: str(SNAPSHOT_SERVER_PORT)}
        code = subprocess.run(
            [sys.executable, "-m", "build", "check"],
            cwd=SNAPSHOT_DIR,
            env=env,
            check=False,
        ).returncode
        history = os.path.join(SNAPSHOT_DIR, REPORT_DIR, RUN_HISTORY_NAME)
        if os.path.exists(history):
            shutil.copy2(history, os.path.join(REPORT_DIR, RUN_HISTORY_NAME))
        if code == 0:
            write_proof(head, digests)
            print(
                f"\n  ✓ Proof written ({PROOF_PATH}). Commit them, all at once or in parts, with:\n"
                f"    .venv/bin/python -m build commit -F <message file> -- {' '.join(paths)}"
            )
        else:
            print(f"\n  ✗ Stage logs are in {os.path.join(SNAPSHOT_DIR, REPORT_DIR)}")
        return code
    finally:
        if server is not None:
            server.terminate()
            server.wait(timeout=10)
        gate_lock.release()


def stale_reasons(proof, paths, head, changed_since, current_digest=digest):
    """Why a commit of `paths` would not be the tree the proof covers — an empty list when it is.

    One run may yield several commits, one logical change each: `paths` may be any part of what was
    proved and not yet committed. The proof remembers what its earlier commits took, so HEAD moving
    by those is this run's own history, not a change it did not see. Only the LAST commit of a run
    lands exactly the tree the run proved, as with any gate that yields several commits.
    """
    reasons = []
    committed = set(proof.get("committed", []))
    open_paths = set(proof["paths"]) - committed
    outside = sorted(set(paths) - open_paths)
    if not paths or outside:
        reasons.append(
            "not among the paths proved and not yet committed: "
            + (" ".join(outside) or "(none named)")
        )
        return reasons
    for path in paths:
        if current_digest(path) != proof["paths"][path]:
            reasons.append(f"{path} changed after the run")
    if head != proof["head"]:
        foreign = [p for p in changed_since if p not in committed]
        code = [p for p in foreign if not p.endswith(".md")]
        overlap = [p for p in foreign if p in open_paths]
        if code:
            reasons.append("HEAD moved by files the run did not see: " + " ".join(code))
        if overlap:
            reasons.append(
                "HEAD moved by a commit to the same paths: " + " ".join(overlap)
            )
    return reasons


def run_commit(message_file, paths):
    """`build commit -F <msg> -- <paths>`: commit proved paths, all or some. Returns the exit code."""
    if not os.path.exists(PROOF_PATH):
        print("  ✗ No proof: run  .venv/bin/python -m build check -- <paths>  first.")
        return 1
    with open(PROOF_PATH, encoding="utf-8") as handle:
        proof = json.load(handle)
    with open(message_file, encoding="utf-8") as handle:
        if "Co-Authored-By:" not in handle.read():
            print("  ✗ The message has no Co-Authored-By line.")
            return 1
    head = _git("rev-parse", "HEAD").strip()
    changed = (
        _git("diff", "--name-only", proof["head"], head).split("\n")
        if head != proof["head"]
        else []
    )
    reasons = stale_reasons(proof, paths, head, [p for p in changed if p])
    if reasons:
        print(
            "  ✗ Not the tree the gate proved:\n"
            + "\n".join(f"      {r}" for r in reasons)
        )
        print("    Run the gate again on these paths.")
        return 1
    # A private index: HEAD plus these paths, and nothing anyone else staged.
    with tempfile.TemporaryDirectory() as scratch:
        env = {**os.environ, "GIT_INDEX_FILE": os.path.join(scratch, "index")}
        _git("read-tree", "HEAD", env=env)
        _git("add", "--all", "--", *paths, env=env)
        _git("commit", "--quiet", "-F", message_file, env=env)
    # The shared index now says these paths are as committed; every other entry is left alone.
    _git("reset", "--quiet", "--", *paths)
    proof["committed"] = sorted(set(proof.get("committed", [])) | set(paths))
    if set(proof["committed"]) == set(proof["paths"]):
        os.remove(PROOF_PATH)
    else:
        with open(PROOF_PATH, "w", encoding="utf-8") as handle:
            json.dump(proof, handle, indent=2)
    print(
        _git("show", "--stat", "--format=%h %s%n%(trailers:key=Co-Authored-By)", "HEAD")
    )
    return 0
