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


def run_logged(cmd, log_name, timeout=None):
    """Run `cmd`, capturing stdout+stderr to .build-reports/<log_name>.log.

     Returns (returncode, combined_output, path_to_log). Output is captured rather than streamed so
     parallel stages don't interleave; the log keeps the full detail a digest necessarily drops.

     `timeout` (seconds) bounds the run. On expiry the partial output collected so far is still
     written to the log — a runner that hung is exactly the case where you most want to see how far
     it got — and `subprocess.TimeoutExpired` is re-raised for the caller to turn into a build
     failure. A gate step that cannot finish is a failure to fix, not a pass to log
    .
    """
    path = log_path(log_name)
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as expired:
        # .stdout is None on POSIX (communicate() raises before collecting) and str on Windows in
        # text mode, so normalise rather than assuming either.
        partial = expired.stdout or ""
        if isinstance(partial, bytes):
            partial = partial.decode("utf-8", errors="replace")
        with open(path, "w", encoding="utf-8") as f:
            f.write(partial)
        expired.log_path = path
        raise

    output = result.stdout or ""
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


# pytest marks the raised exception with a leading "E   " in every --tb mode. Under --tb=long that
# marker is the ONLY reliable way to find it: the exception sits at the END of a traceback block
# that can run past 150 lines of source listing, so a head-truncated digest shows call-site
# boilerplate and drops the one line that says what actually went wrong (observed 2026-08-04: the
# digest printed 24 lines of function signature, then "… 143 more", hiding a `TimeoutError`).
EXCEPTION_LINE = re.compile(r"^E\s{2,}\S")


def failure_exceptions(output, limit=12):
    """Just the raised exceptions, de-duplicated, in order.

    This is the part of a failure that is never safe to truncate, so it is extracted separately and
    printed before (and independently of) the surrounding traceback. De-duplicated because a
    parallel suite failing for ONE shared reason otherwise repeats the same line once per worker,
    pushing everything else out of the digest.
    """
    seen = []
    for line in output.splitlines():
        if EXCEPTION_LINE.match(line.strip()) and line.strip() not in seen:
            seen.append(line.strip())
    return seen[:limit], max(0, len(seen) - limit)


def failure_traceback(output, limit=24):
    """The FAILURES section — the call chain leading to the exception.

    Capped, and that cap is safe ONLY because failure_exceptions() surfaces the exception itself
    separately: under --tb=long this section is mostly source listing, and the cap would otherwise
    swallow the message. Anything beyond the cap stays in the log.
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
    """Print WHY it failed (the exception, then the call chain) and WHICH tests failed (pytest's
    short summary), plus the log path for everything else. All three matter: the ids alone still
    cost a trip to the log to learn the reason, and the traceback alone can bury the reason.

    The exception block comes FIRST and is never truncated away — the browser suites run with
    --tb=long, where the message is the last line of a very long block, so ordering by "most
    important first" is what keeps a digest useful without reading the log.
    """
    lines = output.splitlines()
    marker_indexes = [i for i, line in enumerate(lines) if SUMMARY_MARKER in line]
    digest = lines[marker_indexes[-1] :] if marker_indexes else lines[-limit:]

    print(f"\n  ── {label}: failure digest ──  (full log: {path})")
    exceptions, more_exceptions = failure_exceptions(output)
    for line in exceptions:
        print(f"    {line}")
    if more_exceptions:
        print(f"    … {more_exceptions} more distinct exception(s) in {path}")
    if exceptions:
        print()

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
