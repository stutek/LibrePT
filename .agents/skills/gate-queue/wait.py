#!/usr/bin/env python3
"""Queues for the two things a parallel session has to wait for: the gate, and a claimed file.

Both waits were done by hand until now, and both were done wrong in one session on 2026-10-01: a
hand-written loop would have re-run a FAILED gate every fifteen seconds, because `build check`
answers 1 both when the lock is held and when the tree is bad. This tool keeps the two apart — only
"already running" sends it back to waiting.

    python3 .agents/skills/gate-queue/wait.py gate -- src/a.js tests/b.py
    python3 .agents/skills/gate-queue/wait.py files src/a.js src/b.js
    python3 .agents/skills/gate-queue/wait.py lock

`gate` waits, then runs the gate ONCE on those paths and prints the whole run. `files` says which
session's note claims the paths you are about to edit. `lock` says who holds the gate and for how
long, and waits for it to clear.

Exit code: 0 the gate passed, or the paths are free; 1 the gate failed, or a note claims a path;
2 the wait ran out.
"""

import argparse
import glob
import json
import os
import subprocess
import sys
import time

LOCK = os.path.join(".build-reports", "gate.lock")
LOG = os.path.join(".build-reports", "gate-wait.log")
NOTES = os.path.join(".private", "AGENT_SYNC", "*.md")
# Once a minute. A gate run lasts minutes, so a shorter look answers nothing new and every look
# costs the watching model a call.
POLL_SECONDS = 60
DEFAULT_MAX_MINUTES = 40


def clock():
    return subprocess.run(
        ("date", "+%H:%M:%S"), capture_output=True, text=True, check=True
    ).stdout.strip()


def lock_holder():
    """Who holds the gate, as the lock file itself says. The process table is not the answer: the
    command that asks also matches `python -m build`."""
    try:
        with open(LOCK, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return None


def describe_lock(holder):
    return f"pid {holder.get('pid')}, started {holder.get('started')}"


def wait_for_lock(max_minutes):
    """Returns True once no gate holds the lock, False when the wait runs out."""
    deadline = time.monotonic() + max_minutes * 60
    announced = None
    while True:
        holder = lock_holder()
        if holder is None:
            return True
        if describe_lock(holder) != announced:
            announced = describe_lock(holder)
            print(f"    {clock()} gate held by {announced} — waiting")
        if time.monotonic() + POLL_SECONDS > deadline:
            print(
                f"    {clock()} still held after {max_minutes} min — giving up the wait"
            )
            return False
        time.sleep(POLL_SECONDS)


def gate_python():
    """The gate runs under the project's own interpreter: the dependencies are installed there, and
    `python3` on the PATH is the system one, which does not have them."""
    venv = os.path.join(".venv", "bin", "python")
    return venv if os.path.exists(venv) else sys.executable


def run_gate(paths):
    """One run, output kept whole in a log and printed whole. Returns (exit code, output)."""
    with open(LOG, "w", encoding="utf-8") as handle:
        code = subprocess.run(
            (gate_python(), "-m", "build", "check", "--", *paths),
            stdout=handle,
            stderr=subprocess.STDOUT,
            check=False,
        ).returncode
    with open(LOG, encoding="utf-8") as handle:
        output = handle.read()
    print(output)
    return code, output


def cmd_gate(args):
    for _ in range(200):
        if not wait_for_lock(args.max_minutes):
            return 2
        print(
            f"    {clock()} lock free — running the gate on {len(args.paths)} path(s)"
        )
        code, output = run_gate(args.paths)
        if "already running" in output:
            print(
                f"    {clock()} another session took the lock first — back to waiting"
            )
            time.sleep(POLL_SECONDS)
            continue
        print(f"    {clock()} gate finished, exit {code}. Full run also in {LOG}")
        return 0 if code == 0 else 1
    return 2


def claims():
    """Every path any note claims, as {path: note file}. A note claims a path by naming it."""
    found = {}
    for note in sorted(glob.glob(NOTES)):
        with open(note, encoding="utf-8") as handle:
            text = handle.read()
        for line in text.splitlines():
            stripped = line.strip().lstrip("-* ").strip()
            for candidate in stripped.split(","):
                candidate = candidate.strip().strip("`")
                if candidate and os.path.sep in candidate and os.path.exists(candidate):
                    found.setdefault(candidate, os.path.basename(note))
    return found


def cmd_files(args):
    taken = claims()
    mine = os.environ.get("AGENT_NOTE", "")
    busy = False
    for path in args.paths:
        note = taken.get(path)
        if note and note != mine:
            print(f"  x {path} — claimed by {note}")
            busy = True
        else:
            print(f"  ok {path} — no note claims it")
    if busy:
        print(
            "\n    A claimed file is not yours: take other work, or ask that session through\n"
            "    its note. Set AGENT_NOTE=<your note's file name> to exclude your own claims."
        )
    return 1 if busy else 0


def cmd_lock(args):
    holder = lock_holder()
    if holder is None:
        print(f"  ok {clock()} no gate running")
        return 0
    print(f"  = {clock()} gate held by {describe_lock(holder)}")
    return 0 if wait_for_lock(args.max_minutes) else 2


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="what", required=True)
    gate = sub.add_parser("gate", help="wait for the lock, then gate these paths once")
    gate.add_argument("paths", nargs="+")
    files = sub.add_parser("files", help="say which note claims these paths")
    files.add_argument("paths", nargs="+")
    sub.add_parser("lock", help="say who holds the gate, and wait for it")
    # On every subcommand rather than before it: `wait.py lock --max-minutes 1` is the order a
    # person writes, and argparse puts a parent option only before the subcommand name.
    for part in (gate, files, sub.choices["lock"]):
        part.add_argument("--max-minutes", type=int, default=DEFAULT_MAX_MINUTES)
    args = parser.parse_args(argv)
    return {"gate": cmd_gate, "files": cmd_files, "lock": cmd_lock}[args.what](args)


if __name__ == "__main__":
    sys.exit(main())
