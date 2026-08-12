"""`python -m agent_tools.test_assertions` — keep tests pinned to behaviour, not mechanics.

Why this exists: AGENT_RULES §5.8 says a test must assert the behaviour a caller depends on, never
the mechanics that produce it. A test that encodes *how* the code works fails on every refactor that
changes nothing observable — so it punishes cleanup — and it passes while the behaviour is broken,
as long as the mechanics survive. Neither failure is visible in review: the assertion looks precise,
which is exactly what makes it convincing.

The rule was written after an audit that read ~7 of 125 test files. Reading the other 118 would cost
more than the cleanup is worth and would decay the moment someone writes test 628. What generalises
is not the cleanup but the *signatures* — four shapes that are mechanically recognisable, and were
each found in the wild here:

  1. an exact, multi-class assertion (`to_have_class("btn secondary-btn ...")`) — brittle against any
     restyle, and it was sitting next to a `to_have_text("Invite sent")` that already said the
     thing that mattered;
  2. counting calls on a stub (`drive.created === 1`) instead of asserting the outcome those calls
     produced;
  3. identity equality between two object variables (`assert.equal(state, before)`) — that asserts
     "the same object came back", an implementation choice, where `deepEqual` asserts the promise;
  4. a stub counter that is incremented and never asserted — dead weight implying a coupling that
     does not exist.

**Every finding is escapable by writing the reason, and only by writing the reason.** §5.8 has three
legitimate carve-outs (a class name another module keys off, an AVOIDED side effect, a persisted
format that outlives the code). A comment mentioning §5.8 on or just above the line clears it. That
is not an allowlist of unfixed debt (AGENT_RULES §2.A.3 forbids those): the rule's own carve-outs
require a stated reason, so the escape hatch and the rule are the same requirement.

Regex over lines, not a parse tree — unlike complexity.py, which genuinely needs a grammar to count
branches through `?.`/`??`. These four signatures are single-line and syntactically shallow in both
languages the suite is written in, and a parser for Python AND JavaScript would cost more than it
could catch here.

What it deliberately cannot see, so nobody mistakes a green run for a clean suite: a test named after
a function rather than a promise, over-mocking that mirrors the implementation, and an assertion on a
real but irrelevant behaviour. Those need a reader.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TESTS_DIR = REPO_ROOT / "tests"

# A comment naming the rule clears the line — see the module docstring on why this is a stated
# reason rather than an allowlist.
JUSTIFICATION = re.compile(
    r"§5\.8|AGENT_RULES.*5\.8|behaviour carve-out", re.IGNORECASE
)

# 1. `to_have_class("a b c")` / `.to_have_class('a b')` — two or more classes in one string is an
#    exact-markup assertion: any added utility class breaks it, and none of them is what a trainer
#    sees. One class may legitimately BE a contract, so single-class assertions are left alone.
EXACT_CLASS = re.compile(r"""to_have_class\(\s*["']([^"']*\s+[^"']*)["']""")

# 2. Stub interrogation: an assertion whose subject is a call counter rather than an outcome.
CALL_COUNT = re.compile(
    r"""(assert\w*|expect)\s*\(?[^)\n]*\b\w+\.(created|updated|deleted|callCount|calls)\b"""
)

# 3. `assert.equal(a, b)` with a bare identifier on both sides — reference equality standing in for
#    "unchanged". Property reads (`a.name`), literals and calls are excluded: those are ordinary
#    value comparisons.
#
#    An ALL_CAPS name is skipped: by convention it is a scalar constant, and `assert.equal(
#    BACKUP_SCHEMA, STABLE_SCHEMA)` is a value comparison, not an identity check. Without this the
#    tool reported three such lines on its first run — and a gate that cries wolf teaches people to
#    silence it with a justification comment, which would corrupt the one escape hatch it has.
IDENTITY_EQUALITY = re.compile(
    r"""assert\.equal\(\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\)"""
)
IDENTITY_ALLOWED = {"true", "false", "null", "undefined", "NaN"}
NAMED_CONSTANT = re.compile(r"^[A-Z][A-Z0-9_]*$")

# 4. A counter a stub keeps that nothing ever reads. Matched per file, not per line.
#
#    "Read" means referenced anywhere except its own bookkeeping — NOT "appears in an assertion".
#    e2e's dashboard settle-loop increments `__settleStableTicks` and then reads it in a
#    `wait_for_function` predicate; that is a synchronisation device doing real work, and the first
#    version of this check called it dead.
COUNTER_DECLARATION = re.compile(
    r"""(window\.)?(__\w+)\s*=\s*(?:0|\(window\.__\w+\s*\|\|\s*0\))"""
)
COUNTER_BOOKKEEPING = re.compile(r"""=\s*(?:0|\(window\.__\w+\s*\|\|\s*0\))|\+\+|\+=""")


def _is_justified(lines, index):
    """True when the line, or the comment line(s) directly above it, name the rule."""
    if JUSTIFICATION.search(lines[index]):
        return True
    for above in range(index - 1, max(-1, index - 4), -1):
        stripped = lines[above].strip()
        if not stripped.startswith(("#", "//", "*")):
            break
        if JUSTIFICATION.search(stripped):
            return True
    return False


def _findings_for_lines(path, lines):
    findings = []
    for index, line in enumerate(lines):
        if _is_justified(lines, index):
            continue

        match = EXACT_CLASS.search(line)
        if match:
            findings.append(
                (
                    path,
                    index + 1,
                    f'exact class string "{match.group(1)}" — assert what the user sees '
                    "(to_be_visible / to_have_text), or say which class is the contract (§5.8)",
                )
            )

        if CALL_COUNT.search(line):
            findings.append(
                (
                    path,
                    index + 1,
                    "asserts a stub's call count — assert the outcome those calls produced, or "
                    "state that the AVOIDED side effect is the behaviour (§5.8)",
                )
            )

        identity = IDENTITY_EQUALITY.search(line)
        if (
            identity
            and not (set(identity.groups()) & IDENTITY_ALLOWED)
            and not any(NAMED_CONSTANT.match(name) for name in identity.groups())
        ):
            findings.append(
                (
                    path,
                    index + 1,
                    f"assert.equal({identity.group(1)}, {identity.group(2)}) compares references — "
                    "use deepEqual if the promise is 'unchanged' (§5.8)",
                )
            )
    return findings


def _dead_counter_findings(path, lines):
    """Counters a stub maintains that nothing in the file ever reads."""
    findings = []
    for index, line in enumerate(lines):
        match = COUNTER_DECLARATION.search(line)
        if not match or _is_justified(lines, index):
            continue
        name = match.group(2)
        reads = [
            other
            for other in lines
            if name in other and not COUNTER_BOOKKEEPING.search(other)
        ]
        if not reads:
            findings.append(
                (
                    path,
                    index + 1,
                    f"`{name}` is maintained but never asserted — delete it, or assert the "
                    "behaviour it was meant to prove (§5.8)",
                )
            )
    return findings


def collect_findings(tests_dir=TESTS_DIR):
    findings = []
    for path in sorted(tests_dir.rglob("*")):
        if path.suffix not in {".py", ".mjs"} or not path.is_file():
            continue
        # The tool's own fixtures contain deliberate violations; exempting the file that tests the
        # detector is not an exemption from the rule.
        if path.name == "test_test_assertions.py":
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        # Repo-relative for the report, absolute when the caller pointed somewhere else — the unit
        # test scans a tmp_path, and a collector that only works on one directory is a collector
        # whose own tests have to reach into private helpers to say anything.
        relative = (
            path.relative_to(REPO_ROOT) if path.is_relative_to(REPO_ROOT) else path
        )
        findings.extend(_findings_for_lines(relative, lines))
        findings.extend(_dead_counter_findings(relative, lines))
    return sorted(findings, key=lambda finding: (str(finding[0]), finding[1]))


def main():
    findings = collect_findings()
    if findings:
        print(
            f"\n  ✗ Test assertions: {len(findings)} pinned to mechanics rather than behaviour\n"
        )
        for path, line, message in findings:
            print(f"    {path}:{line}  {message}")
        print(
            "\n    Ask of each: if the internals were rewritten and the contract kept, would this\n"
            "    line still hold? See AGENT_RULES §5.8 for the three carve-outs and how to state one."
        )
        return 1

    print(
        "  ✓ Test assertions: every checked assertion is pinned to behaviour, not mechanics."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
