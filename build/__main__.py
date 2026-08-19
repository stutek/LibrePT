"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import sys
import time
from datetime import datetime
from . import (
    PIPELINE_STAGES,
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


def run_all_stages():
    """Every stage in order, each starting only if the previous one was clean.

    Driven off `PIPELINE_STAGES` rather than a hand-written call list so this order and the one
    `.github/workflows/deploy.yml` enforces cannot drift apart — see that table's comment.
    """
    return [runner() for _, runner, _ in PIPELINE_STAGES]


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
    # Before the environment check, not after: the header is what tells anyone watching that the run
    # started and when, and `check_environment` can itself spend a minute installing requirements.
    print_run_header(label)
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
