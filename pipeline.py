#!/usr/bin/env python3
"""
LibrePT CI/CD Pipeline Orchestrator.

Thin entry point that runs the full verify -> build -> deploy chain. The actual step logic lives
in the build/ package (environment check, tests, bundling into dist/) and the deploy/ package
(publishing dist/). Run individually with `python -m build` / `python -m deploy`, the whole chain
with `python pipeline.py`, or step through any of it in a debugger (`python -m pdb pipeline.py`).
"""
from build import check_environment, run_tests, run_build
from deploy import run_deploy


def main():
    print("=========================================")
    print("   LibrePT Pipeline: Verification & Build")
    print("=========================================")
    print("")

    check_environment()
    run_tests()
    run_build()
    run_deploy()

    print("\n=========================================")
    print("Pipeline execution finished successfully!")
    print("=========================================")
    print("")
    print("TIP: run steps on their own with `python -m build` / `python -m deploy`,")
    print("or debug this runner step-by-step with `.venv/bin/python -m pdb pipeline.py`.")
    print("")


if __name__ == '__main__':
    main()
