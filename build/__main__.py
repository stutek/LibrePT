"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import sys
import time
from . import (
    check_environment,
    run_lint,
    run_tests,
    run_stage_1_parallel,
    run_stage_2_medium,
    run_stage_3_e2e,
    run_stage_4_zap,
    run_build,
)


def _fmt_elapsed(seconds):
    minutes, secs = divmod(round(seconds), 60)
    return f"{minutes}m{secs:02d}s" if minutes else f"{secs}s"


def _print_summary(verdict, total_seconds, stage_seconds):
    """The last line anyone reads, so it must not need interpreting.

    It previously said "Check finished (staged parallel validation passed). (2m53s)", which never
    stated what the number measured — and it sits directly under Stage 4's own "(33.7s)", so the
    obvious reading is that it belongs to that stage rather than the whole run. Printing the total
    next to the per-stage breakdown it is the sum of removes the question instead of answering it.
    """
    print(f"\n  ✓ {verdict}")
    print(f"    TOTAL WALL TIME: {_fmt_elapsed(total_seconds)}")
    if stage_seconds:
        breakdown = "  ".join(
            f"stage {n} {seconds:.0f}s" for n, seconds in enumerate(stage_seconds, 1)
        )
        print(f"    = {breakdown}")


if __name__ == "__main__":
    start = time.monotonic()
    check_environment()
    arg = sys.argv[1] if len(sys.argv) > 1 else ""

    if arg == "lint":
        run_lint()
        _print_summary("LINT PASSED", time.monotonic() - start, [])
    elif arg == "test":
        run_tests()
        _print_summary("TESTS PASSED", time.monotonic() - start, [])
    elif arg == "check":
        stages = [
            run_stage_1_parallel(),
            run_stage_2_medium(),
            run_stage_3_e2e(),
            run_stage_4_zap(),
        ]
        _print_summary(
            "build check PASSED — all 4 stages green",
            time.monotonic() - start,
            stages,
        )
    else:
        stages = [
            run_stage_1_parallel(),
            run_stage_2_medium(),
            run_stage_3_e2e(),
            run_stage_4_zap(),
        ]
        run_build()
        _print_summary(
            "build PASSED — all 4 stages green, dist/ ready to deploy",
            time.monotonic() - start,
            stages,
        )
