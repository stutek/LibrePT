"""`python -m build` — run the full build: environment check, tests, then bundle src/ -> dist/."""

from . import check_environment, run_lint, run_tests, run_build

if __name__ == "__main__":
    check_environment()
    run_lint()
    run_tests()
    run_build()
    print("\n  ✓ Build finished (dist/ is ready to deploy).")
