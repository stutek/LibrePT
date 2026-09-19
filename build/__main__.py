"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import atexit
import os
import sys
import time
from datetime import datetime

from . import gate_lock
from .quiet_machine import wait_for_quiet_machine
from . import (
    PIPELINE_STAGES,
    _load_average,
    check_environment,
    format_elapsed,
    print_pressure_delta,
    print_run_header,
    read_host_pressure,
    record_run,
    run_lint,
    run_tests,
    run_build,
)


# Commands whose whole job is to throw most of their input away. A pipe into one of these is the
# mistake this guard exists for; a pipe into a file or a pager that keeps everything is not.
OUTPUT_FILTERS = frozenset(
    {"tail", "head", "grep", "egrep", "rg", "sed", "awk", "cut", "wc"}
)


def sibling_commands(read=None):
    """The commands running beside us under the same shell — which, in a pipeline, is the rest of it.

    `cmd | tail` makes both processes children of the same shell, so the filter is visible from here
    as a sibling. Linux-only by construction (it reads /proc), which is what the gate runs on; a
    machine without /proc simply reports nothing and the guard lets the run through, since a guard
    that cannot see is not entitled to refuse.
    """
    read = read or _read_proc_siblings
    try:
        return read(os.getppid())
    except OSError:
        return []


def _read_proc_siblings(parent_pid):
    names = []
    for entry in os.listdir("/proc"):
        if not entry.isdigit() or int(entry) == os.getpid():
            continue
        try:
            with open(f"/proc/{entry}/stat", encoding="utf-8") as handle:
                stat = handle.read()
        except OSError:
            continue
        # `comm` is parenthesised and may itself contain spaces, so the fields after it are found
        # from the LAST closing bracket rather than by splitting the whole line.
        close = stat.rfind(")")
        if close < 0:
            continue
        comm = stat[stat.find("(") + 1 : close]
        fields = stat[close + 2 :].split()
        if len(fields) > 1 and fields[1] == str(parent_pid):
            names.append(comm)
    return names


def output_filter_reading_us(read=None):
    """The name of a truncating filter reading this run's output, or None."""
    for name in sibling_commands(read):
        if name in OUTPUT_FILTERS:
            return name
    return None


def refuse_a_pipe(read=None):
    """Stop, loudly, if this run's output is being fed to something that throws most of it away.

    Asked for 2026-08-29 after the gate was run through `tail` several times in one session: "can we
    somehow prevent build checks to be run piped? to exit if pipe is detected?" — the right instinct,
    because the rule already existed and a rule is the weakest way to hold anything.

    **What piping costs.** This output IS the report. `| tail -20` keeps the closing summary and
    throws away every stage line above it — including the ones that say a check was skipped, a
    warning was printed, or a stage took four times as long as last time. A green summary read
    through a pipe is a green summary with the evidence removed, and the failure it hides looks
    exactly like a pass.

    **Not a TTY check, and that is the whole design problem.** `sys.stdout.isatty()` is false for an
    agent's shell whether or not anything was piped — every tool that captures output captures it the
    same way — so a TTY test refuses the honest run and the careless one alike, and the only way past
    it would be a flag, which is the mistake with one extra keystroke. What is actually wrong is
    specific: a `tail` is READING this. So that is what is looked for, and nothing else is refused —
    redirecting to a file keeps every line, and is none of this function's business.

    **CI is exempt** and it is a real exception: a workflow may legitimately pipe, and the runner sets
    `CI`. That is an escape hatch for a machine, not a flag a person reaches for in a hurry.
    """
    if os.environ.get("CI"):
        return
    filter_name = output_filter_reading_us(read)
    if not filter_name:
        return
    print(
        f"\n  ✗ build refuses to run with `{filter_name}` reading its output.\n\n"
        "    This output is the report. What a filter cuts is exactly what a green run is worth\n"
        "    reading for: a check that was skipped, a warning nobody failed on, a stage that\n"
        "    suddenly takes four times as long as the header predicted.\n\n"
        "    Run it plainly:  .venv/bin/python -m build check\n"
        "    Every stage also writes its own log to .build-reports/ to read afterwards.\n",
        file=sys.stderr,
    )
    sys.exit(2)


def run_all_stages():
    """Every stage in order, each starting only if the previous one was clean.

    Driven off `PIPELINE_STAGES` rather than a hand-written call list so this order and the one
    `.github/workflows/deploy.yml` enforces cannot drift apart — see that table's comment.

    **The tree is fingerprinted after stage 1 and checked at the end** (build/gate_lock.py). A green
    is a property of a TREE, not of a run: on 2026-09-12 a run passed all four stages while the tree
    it measured had already stopped existing, and the catalog check failed against what was on disk.
    Taken after stage 1 because the gate's own formatter rewrites files during it — a snapshot from
    before would report those every run, and noise is how a real difference gets waved through.
    """
    stages = []
    settled = None
    for index, (_, runner, _) in enumerate(PIPELINE_STAGES):
        stages.append(runner())
        if index == 0:
            settled = gate_lock.tree_fingerprint()

    moved = gate_lock.movement_report(settled, gate_lock.tree_fingerprint())
    if moved:
        print()
        print(moved)
        sys.exit(1)
    return stages


def _finish(label, verdict, total_seconds, stage_seconds, pressure_at_start=None):
    """The closing report, and the history line the NEXT run's header estimates from — recorded here
    so a command cannot print a summary without leaving the evidence behind (build.record_run)."""
    ended = datetime.now()
    started = datetime.fromtimestamp(ended.timestamp() - total_seconds)
    host = _print_summary(
        verdict,
        total_seconds,
        stage_seconds,
        started=started,
        ended=ended,
        pressure_at_start=pressure_at_start,
    )
    record_run(
        label,
        started,
        ended,
        total_seconds,
        stage_seconds,
        verdict="PASSED",
        host_pressure=host,
    )


def _print_summary(
    verdict,
    total_seconds,
    stage_seconds,
    started=None,
    ended=None,
    pressure_at_start=None,
):
    """The last line anyone reads, so it must not need interpreting.

    It previously said "Check finished (staged parallel validation passed). (2m53s)", which never
    stated what the number measured — and it sits directly under Stage 4's own "(33.7s)", so the
    obvious reading is that it belongs to that stage rather than the whole run. Printing the total
    next to the per-stage breakdown it is the sum of removes the question instead of answering it.

    The `=== Report ===` banner matches the per-stage banners so the summary is findable by the same
    visual cue when scrolling back through minutes of output — without it the verdict is a bare
    indented line that reads as part of Stage 4's block, which is the same ambiguity the total-time
    wording above was fixed for.
    """
    print("\n=== Report ===\n")
    print(f"  ✓ {verdict}")
    if started and ended:
        # Clock times, not just a duration: the question asked later is "was that the run from just
        # after lunch?", and `.build-reports/run-history.jsonl` holds the same line for every run
        # whose scrollback is long gone.
        print(
            f"    STARTED {started.strftime('%Y-%m-%d %H:%M:%S')}"
            f" · FINISHED {ended.strftime('%H:%M:%S')}"
            f" · TOOK {format_elapsed(total_seconds)}"
        )
    else:
        print(f"    TOTAL WALL TIME: {format_elapsed(total_seconds)}")
    host = None
    if pressure_at_start is not None:
        # Whether the MACHINE was in the way, which the per-task CPU figures cannot say: a stage that
        # slowed down while the host stalled on IO or swapped was starved, not doing more work.
        host = print_pressure_delta(pressure_at_start, read_host_pressure())
    if stage_seconds:
        breakdown = "  ".join(
            f"stage {n} {seconds:.0f}s" for n, seconds in enumerate(stage_seconds, 1)
        )
        print(f"    = {breakdown}")
    return host


if __name__ == "__main__":
    start = time.monotonic()
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    label = f"build {arg}".strip()
    # Before anything is printed or installed: a refusal that arrives after a minute of environment
    # setup has already wasted the minute it exists to save.
    refuse_a_pipe()
    # One gate at a time (build/gate_lock.py). Before the header, because a refusal that arrives
    # after a run has announced itself reads as that run failing rather than never starting.
    holding, refusal = gate_lock.acquire()
    if not holding:
        print(refusal)
        sys.exit(1)
    atexit.register(gate_lock.release)
    # Before the environment check, not after: the header is what tells anyone watching that the run
    # started and when, and `check_environment` can itself spend a minute installing requirements.
    print_run_header(label)
    # Only on a machine that is not already busy (build/quiet_machine.py, TODO §64). Here and
    # nowhere later: between stages the load average is this pipeline's own exhaust, so it is only
    # before the first stage that the reading says anything about anyone else.
    if not wait_for_quiet_machine(
        read_load=lambda: (_load_average() or (None,))[0],
        cores=os.cpu_count() or 1,
        sleep=time.sleep,
        announce=print,
    ):
        sys.exit(1)
    pressure_at_start = read_host_pressure()
    check_environment()

    def record_failure(exit_code):
        """A failed run is the row most often asked about later ("when did this last break?"), and it
        is the one the summary never prints — the stage runners exit from deep inside. Recorded here,
        where every exit passes, and deliberately not used as the next run's estimate."""
        ended = datetime.now()
        elapsed = time.monotonic() - start
        record_run(
            label,
            datetime.fromtimestamp(ended.timestamp() - elapsed),
            ended,
            elapsed,
            [],
            verdict=f"FAILED({exit_code})",
        )

    try:
        if arg == "lint":
            run_lint()
            _finish(
                label, "LINT PASSED", time.monotonic() - start, [], pressure_at_start
            )
        elif arg == "test":
            run_tests()
            _finish(
                label, "TESTS PASSED", time.monotonic() - start, [], pressure_at_start
            )
        elif arg == "check":
            stages = run_all_stages()
            _finish(
                label,
                f"build check PASSED — all {len(stages)} stages green",
                time.monotonic() - start,
                stages,
                pressure_at_start,
            )
        else:
            stages = run_all_stages()
            run_build()
            _finish(
                label,
                f"build PASSED — all {len(stages)} stages green, dist/ ready to deploy",
                time.monotonic() - start,
                stages,
                pressure_at_start,
            )
    except SystemExit as failure:
        if failure.code:
            record_failure(failure.code)
        raise
