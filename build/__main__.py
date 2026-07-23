"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import sys
from . import (
    check_environment,
    run_lint,
    run_tests,
    run_stage_1_parallel,
    run_stage_2_parallel,
    run_build,
)

if __name__ == "__main__":
    check_environment()
    arg = sys.argv[1] if len(sys.argv) > 1 else ""

    if arg == "lint":
        run_lint()
        print("\n  ✓ Static analysis & linting passed.")
    elif arg == "test":
        run_tests()
        print("\n  ✓ Test suite passed.")
    elif arg == "check":
        run_stage_1_parallel()
        run_stage_2_parallel()
        print("\n  ✓ Check finished (staged parallel validation passed).")
    else:
        run_stage_1_parallel()
        run_stage_2_parallel()
        run_build()
        print("\n  ✓ Build finished (dist/ is ready to deploy).")
