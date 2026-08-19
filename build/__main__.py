"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import sys
import time
from . import (
    PIPELINE_STAGES,
    check_environment,
    format_elapsed,
    print_run_header,
    record_run_seconds,
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


def _finish(label, verdict, total_seconds, stage_seconds):
    """The closing report, and the measurement the NEXT run's header estimates from — recorded here
    so a command cannot print a summary without leaving the evidence behind (build.record_run_seconds).
    Only a clean run is recorded: a gate that failed in Stage 1 says nothing about how long a whole
    one takes."""
    record_run_seconds(label, total_seconds)
    _print_summary(verdict, total_seconds, stage_seconds)


def _print_summary(verdict, total_seconds, stage_seconds):
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
    print(f"    TOTAL WALL TIME: {format_elapsed(total_seconds)}")
    if stage_seconds:
        breakdown = "  ".join(
            f"stage {n} {seconds:.0f}s" for n, seconds in enumerate(stage_seconds, 1)
        )
        print(f"    = {breakdown}")


if __name__ == "__main__":
    start = time.monotonic()
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    label = f"build {arg}".strip()
    # Before the environment check, not after: the header is what tells anyone watching that the run
    # started and when, and `check_environment` can itself spend a minute installing requirements.
    print_run_header(label)
    check_environment()

    if arg == "lint":
        run_lint()
        _finish(label, "LINT PASSED", time.monotonic() - start, [])
    elif arg == "test":
        run_tests()
        _finish(label, "TESTS PASSED", time.monotonic() - start, [])
    elif arg == "check":
        stages = run_all_stages()
        _finish(
            label,
            f"build check PASSED — all {len(stages)} stages green",
            time.monotonic() - start,
            stages,
        )
    else:
        stages = run_all_stages()
        run_build()
        _finish(
            label,
            f"build PASSED — all {len(stages)} stages green, dist/ ready to deploy",
            time.monotonic() - start,
            stages,
        )
