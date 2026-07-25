# build/testreport.py — capture and summarise test-runner output for the build gate.
# Single responsibility: run a test command with its output captured to a log file, and turn a
# failure into a short, immediately actionable digest (which tests failed, where the full log is).
#
# Why this exists: the gate runs its stages in parallel threads, so streaming every runner's output
# to the terminal interleaves them into noise and buries the one thing that matters — the failing
# test id. A bare "failed with exit code: 1" then costs a full re-run just to learn what broke.

import os
import re
import subprocess

REPORT_DIR = ".build-reports"
SUMMARY_MARKER = "short test summary info"
# pytest prints tracebacks in a FAILURES section BEFORE the short summary. The summary names WHICH
# test broke; only the traceback says WHY — and without it the log has to be opened and grepped,
# which is exactly the round trip this module exists to remove.
FAILURES_MARKER = "= FAILURES ="
# pytest's short-summary lines: "FAILED tests/e2e/x.py::test_y[chromium] - AssertionError: ..."
SUMMARY_LINE = re.compile(r"^(?:FAILED|ERROR)\s+(\S+)")


def log_path(name):
    os.makedirs(REPORT_DIR, exist_ok=True)
    return os.path.join(REPORT_DIR, f"{name}.log")


def run_logged(cmd, log_name):
    """Run `cmd`, capturing stdout+stderr to .build-reports/<log_name>.log.

    Returns (returncode, combined_output, path_to_log). Output is captured rather than streamed so
    parallel stages don't interleave; the log keeps the full detail a digest necessarily drops.
    """
    result = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    output = result.stdout or ""
    path = log_path(log_name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(output)
    return result.returncode, output, path


def failed_test_ids(output):
    """The node ids pytest reported as FAILED/ERROR, in order and de-duplicated."""
    ids = []
    for line in output.splitlines():
        match = SUMMARY_LINE.match(line.strip())
        if match and match.group(1) not in ids:
            ids.append(match.group(1))
    return ids


def failure_traceback(output, limit=24):
    """The FAILURES section — the exception, its message and the line that raised it.

    Run with --tb=short, one failure is ~6 lines, so a cap of 24 covers the usual case of several
    tests failing for one shared reason. Anything beyond the cap stays in the log.
    """
    lines = output.splitlines()
    starts = [i for i, line in enumerate(lines) if FAILURES_MARKER in line]
    if not starts:
        return [], 0
    summaries = [i for i, line in enumerate(lines) if SUMMARY_MARKER in line]
    end = summaries[-1] if summaries and summaries[-1] > starts[0] else len(lines)
    section = [line for line in lines[starts[0] : end] if line.strip()]
    return section[:limit], max(0, len(section) - limit)


def print_digest(label, output, path, limit=30):
    """Print WHY it failed (the compact traceback) and WHICH tests failed (pytest's short summary),
    plus the log path for everything else. Both halves matter: the ids alone still cost a trip to
    the log to learn the reason."""
    lines = output.splitlines()
    marker_indexes = [i for i, line in enumerate(lines) if SUMMARY_MARKER in line]
    digest = lines[marker_indexes[-1] :] if marker_indexes else lines[-limit:]

    print(f"\n  ── {label}: failure digest ──  (full log: {path})")
    traceback, trimmed = failure_traceback(output)
    for line in traceback:
        print(f"    {line}")
    if trimmed:
        print(f"    … {trimmed} more traceback line(s) in {path}")
    if traceback:
        print()
    for line in digest[:limit]:
        print(f"    {line}")
    if len(digest) > limit:
        print(f"    … {len(digest) - limit} more line(s) in {path}")
