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
    run_stage_2_parallel,
    run_build,
)


def _fmt_elapsed(seconds):
    minutes, secs = divmod(round(seconds), 60)
    return f"{minutes}m{secs:02d}s" if minutes else f"{secs}s"


if __name__ == "__main__":
    start = time.monotonic()
    check_environment()
    arg = sys.argv[1] if len(sys.argv) > 1 else ""

    if arg == "lint":
        run_lint()
        print(
            f"\n  ✓ Static analysis & linting passed. ({_fmt_elapsed(time.monotonic() - start)})"
        )
    elif arg == "test":
        run_tests()
        print(f"\n  ✓ Test suite passed. ({_fmt_elapsed(time.monotonic() - start)})")
    elif arg == "check":
        run_stage_1_parallel()
        run_stage_2_parallel()
        print(
            f"\n  ✓ Check finished (staged parallel validation passed). "
            f"({_fmt_elapsed(time.monotonic() - start)})"
        )
    else:
        run_stage_1_parallel()
        run_stage_2_parallel()
        run_build()
        print(
            f"\n  ✓ Build finished (dist/ is ready to deploy). "
            f"({_fmt_elapsed(time.monotonic() - start)})"
        )
