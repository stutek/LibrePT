#!/usr/bin/env python3
"""Watches the GitHub Actions runs of one commit and reports what fell.

Why a tool and not six commands in the skill: the waiting and the reading are mechanical, so they
belong to the cheapest model that can run a command — and a model paid by the token should spend one
call, not twelve. Everything that needs judgement (why it fell, what to change) is left out on
purpose; this prints facts and writes them to a file.

Reads only. It never re-runs a job, never pushes, never edits the tree outside its report file.

    python3 .agents/skills/build-watch/watch.py                 # HEAD, wait for the verdict
    python3 .agents/skills/build-watch/watch.py --once           # one look, no waiting
    python3 .agents/skills/build-watch/watch.py --sha <sha>

Exit code: 0 every run succeeded, 1 something failed, 2 nothing to watch or the wait ran out.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

API = "https://api.github.com"
# 60 anonymous requests an hour per address is GitHub's budget, and this walks several endpoints per
# look, so a shorter interval buys nothing but a 403.
MIN_INTERVAL_SECONDS = 120
DEFAULT_MAX_MINUTES = 45
UNFINISHED = ("queued", "in_progress", "waiting", "pending", "requested")
BAD = ("failure", "cancelled", "timed_out", "startup_failure")


def git(*args):
    return subprocess.run(
        ("git", *args), capture_output=True, text=True, check=True
    ).stdout.strip()


def owner_repo():
    """OWNER/REPO out of the origin remote, whether it is https or ssh."""
    url = git("remote", "get-url", "origin")
    match = re.search(r"github\.com[:/]+([^/]+)/(.+?)(?:\.git)?$", url)
    if not match:
        raise SystemExit(f"  x origin is not a GitHub remote: {url}")
    return f"{match.group(1)}/{match.group(2)}"


def token():
    """A login lifts the one wall that matters: without it the log endpoint answers 403.

    `gh` keeps the login, and it holds a fine-grained read-only token as well as a wide one, so
    there is no second place to read a token from.
    """
    for name in ("GH_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(name):
            return os.environ[name]
    try:
        value = subprocess.run(
            ("gh", "auth", "token"), capture_output=True, text=True, check=True
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    return value or None


def get(path, auth):
    request = urllib.request.Request(f"{API}/{path}")
    request.add_header("Accept", "application/vnd.github+json")
    if auth:
        request.add_header("Authorization", f"Bearer {auth}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        return {"_error": f"HTTP {error.code} on {path}"}
    except OSError as error:
        return {"_error": f"{type(error).__name__} on {path}: {error}"}


def runs_for(repo, sha, auth):
    payload = get(f"repos/{repo}/actions/runs?head_sha={sha}&per_page=20", auth)
    if "_error" in payload:
        return payload["_error"], []
    return None, payload.get("workflow_runs", [])


def failed_steps(repo, run_id, auth):
    """The jobs that fell, and inside each the steps that fell. Visible without a token."""
    payload = get(f"repos/{repo}/actions/runs/{run_id}/jobs?per_page=60", auth)
    lines = []
    for job in payload.get("jobs", []):
        if job.get("conclusion") not in BAD:
            continue
        lines.append(
            f"Fallen job: {job['name']} — {job['conclusion']} (id {job['id']})"
        )
        for step in job.get("steps") or []:
            if step.get("conclusion") in BAD:
                lines.append(f"  Fallen step {step['number']}: {step['name']}")
        lines.extend(annotations(repo, job["id"], auth))
    return lines


def annotations(repo, job_id, auth):
    payload = get(f"repos/{repo}/check-runs/{job_id}/annotations", auth)
    if isinstance(payload, dict):
        return [f"  Annotations: {payload.get('_error', 'none')}"]
    return [
        f"  Annotation ({item['annotation_level']}): {item['message'].strip()[:300]}"
        for item in payload
        if item.get("annotation_level") == "failure"
    ]


def log_tail(repo, run_id, auth, lines=40):
    """The log, which needs a login. Says so plainly rather than guessing at the cause."""
    if not auth:
        return [
            "Log: no access without a login (the endpoint answers 403). Run: gh auth login"
        ]
    result = subprocess.run(
        ("gh", "run", "view", str(run_id), "--repo", repo, "--log-failed"),
        capture_output=True,
        text=True,
        check=False,
    )
    output = (result.stdout or result.stderr).splitlines()
    return ["Log, last lines:", *[f"  {line}" for line in output[-lines:]]] or [
        "Log: empty"
    ]


def now():
    return subprocess.run(
        ("date", "+%Y-%m-%d %H:%M:%S"), capture_output=True, text=True, check=True
    ).stdout.strip()


def report_path(sha, given):
    if given:
        return given
    directory = os.path.join(".private", "BUILD_WATCH")
    os.makedirs(directory, exist_ok=True)
    return os.path.join(directory, f"{sha[:7]}.md")


def write_report(path, sha, subject, body):
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(
            "---\ntype: note\n"
            f'title: "GitHub checks {sha[:7]}"\n'
            'description: "What the GitHub Actions runs of this commit did."\n'
            "tags: [ci]\n---\n\n"
            f"Commit: {sha} — {subject}\nRead at: {now()}\n\n" + "\n".join(body) + "\n"
        )


def look(repo, sha, auth):
    """One look. Returns (still_running, lines, verdict) — verdict is None while anything runs."""
    error, runs = runs_for(repo, sha, auth)
    if error:
        return False, [error], None
    if not runs:
        return True, ["No runs for this commit yet."], None
    lines = [
        f"Run: {run['name']} — {run['status']}/{run['conclusion']} — {run['html_url']}"
        for run in runs
    ]
    if any(run["status"] in UNFINISHED for run in runs):
        return True, lines, None
    fallen = [run for run in runs if run["conclusion"] in BAD]
    for run in fallen:
        lines.extend(failed_steps(repo, run["id"], auth))
        lines.extend(log_tail(repo, run["id"], auth))
    return False, lines, "FAILED" if fallen else "PASSED"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sha", help="the commit to watch (default: HEAD)")
    parser.add_argument("--once", action="store_true", help="one look, do not wait")
    parser.add_argument("--interval", type=int, default=MIN_INTERVAL_SECONDS)
    parser.add_argument("--max-minutes", type=int, default=DEFAULT_MAX_MINUTES)
    parser.add_argument("--report", help="where to write the report")
    args = parser.parse_args(argv)

    repo = owner_repo()
    # Resolved to the full id: GitHub matches `head_sha` exactly, so a short id found no runs at
    # all and the watch waited on nothing (2026-10-09).
    sha = git("rev-parse", args.sha or "HEAD")
    subject = git("log", "-1", "--format=%s", sha)
    auth = token()
    interval = max(args.interval, MIN_INTERVAL_SECONDS)
    deadline = time.monotonic() + args.max_minutes * 60
    print(f">>> {repo} {sha[:7]} — {subject}")
    # A login is necessary for the log, not sufficient: a cloud session has one, and its proxy still
    # refuses the server GitHub sends the log from. Whether the log was read shows in the report.
    print(f"    login: {'yes' if auth else 'no, logs not readable'}")

    while True:
        running, lines, verdict = look(repo, sha, auth)
        for line in lines:
            print(f"    {line}")
        if not running:
            break
        if args.once or time.monotonic() + interval > deadline:
            path = report_path(sha, args.report)
            write_report(path, sha, subject, ["Verdict: STILL RUNNING", *lines])
            print(f"\n  = Still running. Report: {path}")
            return 2
        print(f"    ... another look in {interval}s")
        time.sleep(interval)

    path = report_path(sha, args.report)
    write_report(path, sha, subject, [f"Verdict: {verdict or 'NO RUNS'}", *lines])
    print(
        f"\n  {'OK' if verdict == 'PASSED' else 'x'} {verdict or 'NO RUNS'}. Report: {path}"
    )
    return 0 if verdict == "PASSED" else 1


if __name__ == "__main__":
    sys.exit(main())
