"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/.
`python -m build check` — run lint analysis and tests together without bundling dist/.
"""

import sys
from . import check_environment, run_lint, run_tests, run_build

if __name__ == "__main__":
    check_environment()
    run_lint()
    run_tests()
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        print("\n  ✓ Check finished (linting and tests passed).")
    else:
        run_build()
        print("\n  ✓ Build finished (dist/ is ready to deploy).")
