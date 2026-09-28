"""`python -m agent_tools.unit_coverage` — pure logic that has lost its unit tests.

`src/domain/` and `src/data/` hold the rules the rest of the app is built on: schema migrations,
merges, ids, projections, the wording of a target. Their tests live in `tests/unit_js/`, which runs
in four seconds and names the function that broke. Nothing noticed when a function was added there
with no test, or when a test was deleted: measured on 2026-09-28, the form controls for a load
(`loadInputHTML`) and the unit label of every metric (`metricLabelKey`) were run by no unit test,
and a whole function (`loadParts`) had no caller at all.

**What it measures.** It runs the unit suite under Node's own coverage (`--experimental-test-coverage`,
no package to install) and reads the share of lines each module ran. Node's figure is the same on
every run of the same tree — checked three times before this was written — so a floor here is
safe to hold exactly. Browser-tier coverage is NOT measured here: it moves with timing, takes
minutes, and cannot see the service worker.

**What it requires.** Every module in scope reaches `FLOOR`, with two kinds of exception, each
written down:
- `TESTED_IN_THE_BROWSER`: modules whose job is a browser API (IndexedDB, localStorage, Google's
  sign-in, another tab). A unit test cannot hold them; the named test file does, and must exist.
- `HELD`: modules below the floor today, held where they are. The number may only rise, and the
  check fails when it has risen by `RAISE_BY` without the entry following, so an improvement cannot
  quietly loosen the hold.

Exit code is 1 on any breach, so it can gate a commit.
"""

import pathlib
import subprocess
import sys
import tempfile

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCOPE = ("src/domain/", "src/data/")

# The share of lines a pure-logic module's unit tests must run, in percent.
FLOOR = 90

# Held below FLOOR, in percent; the value only goes up. Empty is the goal.
HELD = {}

# How far a HELD module may rise before its entry must follow it.
RAISE_BY = 5

# Module → the test file that holds it, for modules whose job is a browser API.
TESTED_IN_THE_BROWSER = {
    "src/data/connectedAccounts.js": "tests/medium/test_connected_accounts.py",
    "src/data/driveSyncService.js": "tests/e2e/test_sync_backup.py",
    "src/data/erasureChecklist.js": "tests/medium/test_client_data_rights.py",
    "src/data/googleAuth.js": "tests/unit_js/data/googleAuthRevoke.test.mjs",
    "src/data/indexedDb.js": "tests/e2e/test_indexed_db.py",
    "src/data/lastRoute.js": "tests/e2e/test_sandbox.py",
    "src/data/previewTransfer.js": "tests/e2e/test_device_database_corpus.py",
    "src/data/readSchema.js": "tests/e2e/test_read_schema_toggle.py",
    "src/data/sessionCache.js": "tests/e2e/test_sandbox.py",
    "src/data/stateStore.js": "tests/e2e/test_indexed_db.py",
    "src/data/tabOwnership.js": "tests/e2e/test_two_tabs.py",
}


def measure(node_path):
    """Line coverage of every module the unit suite loads: {repo-relative path: percent}. None when
    the suite itself failed — the JavaScript Unit Tests task reports that, by name."""
    with tempfile.TemporaryDirectory() as tmp:
        lcov = pathlib.Path(tmp) / "unit.lcov"
        run = subprocess.run(
            [
                node_path,
                "--test",
                "--experimental-test-coverage",
                "--test-coverage-include=src/**",
                "--test-reporter=lcov",
                f"--test-reporter-destination={lcov}",
                "tests/unit_js/**/*.test.mjs",
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        if run.returncode != 0 or not lcov.exists():
            return None
        return parse_lcov(lcov.read_text(encoding="utf-8"))


def parse_lcov(text):
    """{repo-relative path: percent of lines run} from an lcov report."""
    found, path, lines, hit = {}, None, 0, 0
    for line in text.splitlines():
        if line.startswith("SF:"):
            path = pathlib.Path(line[3:])
            if path.is_absolute():
                path = path.relative_to(REPO_ROOT)
            path = path.as_posix()
        elif line.startswith("LF:"):
            lines = int(line[3:])
        elif line.startswith("LH:"):
            hit = int(line[3:])
        elif line == "end_of_record" and path:
            found[path] = 100.0 * hit / lines if lines else 100.0
    return found


def modules_in_scope():
    return sorted(
        p.relative_to(REPO_ROOT).as_posix()
        for prefix in SCOPE
        for p in (REPO_ROOT / prefix).rglob("*.js")
    )


def breaches(
    modules, coverage, held=HELD, browser=TESTED_IN_THE_BROWSER, test_exists=None
):
    """Every rule the tree breaks, as sentences. `test_exists` answers whether a named test file is
    there; the default looks at the repository."""
    if test_exists is None:
        test_exists = lambda rel: (REPO_ROOT / rel).is_file()  # noqa: E731
    found = []
    for listed in sorted((set(held) | set(browser)) - set(modules)):
        found.append(f"{listed} is listed here and no longer exists — remove its entry")
    for module in modules:
        if module in browser:
            if not test_exists(browser[module]):
                found.append(f"{module} names {browser[module]}, which does not exist")
            continue
        percent = coverage.get(module, 0.0)
        floor = held.get(module, FLOOR)
        if percent < floor:
            what = (
                "is run by no unit test"
                if module not in coverage
                else f"is at {percent:.1f}%"
            )
            found.append(f"{module} {what}, below its floor of {floor}%")
        elif module in held and percent >= FLOOR:
            found.append(f"{module} reached {percent:.1f}% — remove it from HELD")
        elif module in held and percent >= floor + RAISE_BY:
            found.append(
                f"{module} rose to {percent:.1f}% — set HELD to {int(percent)}"
            )
    return found


def main(node_path=None):
    if node_path is None:
        from build import ensure_node_binary

        node_path = ensure_node_binary()
    if not node_path:
        print("  (skipped: no Node runtime; CI always has one)")
        return 0
    coverage = measure(node_path)
    if coverage is None:
        print(
            "  ✗ The unit suite failed, so nothing was measured; JavaScript Unit Tests says why."
        )
        return 1
    found = breaches(modules_in_scope(), coverage)
    for sentence in found:
        print(f"  ✗ {sentence}")
    if found:
        print(
            f"\n  Pure logic in {' and '.join(SCOPE)} is held by tests/unit_js/ at {FLOOR}% of its lines."
            "\n  Write the test; or, for a module whose job is a browser API, name its test in"
            "\n  TESTED_IN_THE_BROWSER in agent_tools/unit_coverage.py."
        )
        return 1
    print(
        f"  ✓ Every pure-logic module is at or above its floor ({FLOOR}% unless held)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
