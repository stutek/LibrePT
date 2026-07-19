"""`python -m deploy` — publish the built dist/ bundle (run `python -m build` first)."""

from . import run_deploy

if __name__ == "__main__":
    run_deploy()
