"""One declaration of the Python version, and this machine on it.

**Why this exists.** On 2026-08-18 CI failed a test that had passed locally three times. That specific
failure was a frozen-clock problem, but chasing it surfaced something quieter: CI was running Python 3.11
and the maintainer's machine 3.14.4, with nothing anywhere saying so. A "works locally" that is not about
the tests at all is the most expensive kind to diagnose, because nothing in the diff points at the
interpreter.

**The first fix was worse than the problem.** It bumped thirteen `python-version:` literals across two
workflow files and added a check that they agreed — a checker whose whole job is to keep copies in step,
which is the shape of a missing single source of truth ("12 pins for python? that is not single source of
truth", Simon, 2026-08-18). There is one declaration now: `.python-version`, which
`actions/setup-python` reads via `python-version-file:` and pyenv reads directly. Drift is not detected,
it is impossible.

**Which leaves this tool checking something narrower than its first draft, and worth being honest
about** ("does parity check make sense if it is just one value?", Simon). Two things:

  1. **This machine's interpreter matches the declaration.** The real check, and the one that cannot be
     solved structurally: a developer's machine is not the repository, so nothing but a check can notice
     that a green local gate ran on a different language than the deploy will.
  2. **No workflow pins a literal version.** A regression guard, not a discovery — it exists so the
     thirteen copies cannot come back, which is exactly the mistake this replaced.

**Minor versions, not patch.** CI takes whatever patch the runner image carries and so does a developer;
failing on that would be a gate nobody could keep green, and patches are not where the language changes.

Run: `python -m agent_tools.python_version`
"""

import glob
import re
import sys

WORKFLOW_GLOB = ".github/workflows/*.yml"
VERSION_FILE = ".python-version"
LITERAL_PIN = re.compile(r"^\s*python-version:\s*['\"]?([0-9]+\.[0-9]+)", re.M)


def _minor(version):
    return ".".join(str(version).strip().split(".")[:2])


def running_python():
    return f"{sys.version_info.major}.{sys.version_info.minor}"


def declared_version(path=VERSION_FILE):
    """The one declaration, or "" when the file is missing — which is itself the problem to report."""
    try:
        with open(path, encoding="utf-8") as handle:
            return handle.read().strip()
    except OSError:
        return ""


def version_problems(workflow_paths=None, running=None, version_file=VERSION_FILE):
    """Human-readable problems; empty means there is one declaration and this machine is on it.

    The paths and the running version are injected by the tests; the real call reads the repository and
    the interpreter executing it, which is the point — the check is about THIS machine.
    """
    paths = (
        workflow_paths
        if workflow_paths is not None
        else sorted(glob.glob(WORKFLOW_GLOB))
    )
    declared = declared_version(version_file)
    local = _minor(running if running is not None else running_python())

    problems = []
    if not declared:
        problems.append(
            f"{version_file} is missing — it is the single declaration every workflow reads via "
            "`python-version-file:`"
        )
    elif _minor(declared) != local:
        problems.append(
            f"{version_file} declares Python {declared}, this machine runs {local} — "
            "match it locally, or change the declaration and let CI follow"
        )

    for path in paths:
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        for pinned in sorted(set(LITERAL_PIN.findall(text))):
            problems.append(
                f"{path} pins Python {pinned} inline — use "
                f"`python-version-file: {version_file}` so there is one declaration, not a copy"
            )
    return problems


def main():
    problems = version_problems()
    if problems:
        print(f"  ✗ Python version: {len(problems)} problem(s)")
        print()
        for problem in problems:
            print(f"    {problem}")
        print()
        print(
            "    One declaration, and this machine on it — a green local gate that ran on a\n"
            "    different language version is not evidence about the deploy."
        )
        return 1

    print(
        f"  ✓ Python version: one declaration ({declared_version()}), and this machine runs it."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
