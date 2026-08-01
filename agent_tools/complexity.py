"""`python -m agent_tools.complexity` — cyclomatic complexity gate for the frontend JS.

Why this exists: LibrePT's frontend has no linter-level complexity check — Biome 1.9.4 (the version
this repo pins) has no cognitive/cyclomatic complexity rule, and ruff's equivalent (mccabe/C901) only
ever sees the Python tooling (`build/`, `deploy/`, `tests/`, `agent_tools/`), never `src/`. A function
that has quietly grown into a dozen nested branches reads fine one `if` at a time in review — the
only thing that catches it is counting the decision points across the whole function at once, which
is exactly what a human reviewer does not do reliably. `activeSessionController.js` and
`formsController.js` both grew past a reasonable single responsibility (AGENT_RULES §5.1) partly
because nothing measured the individual functions inside them as they grew.

Parses with `tree_sitter_javascript` (a real grammar, not a regex heuristic) rather than trying to
approximate branch-counting with text patterns — this codebase leans on optional chaining (`?.`) and
nullish coalescing (`??`) throughout, which a regex-based counter would either miscount or choke on.

McCabe complexity per function: 1 (the function itself) + one for every decision point inside it —
`if`/`else if`, loops, `catch`, ternaries, `switch` cases, and each `&&`/`||`/`??` in a boolean chain
(each is its own branch: `a && b && c` is 3 paths, not 1). Nested functions are scored separately and
do not inherit the outer function's count, matching how a reader actually reasons about each one.
"""

import sys
from pathlib import Path

import tree_sitter_javascript as tsjs
from tree_sitter import Language, Parser

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"

# Above this, a function is doing too much to review or test as one unit — split it. Chosen by
# running the tool against the codebase after the activeSessionController.js/formsController.js
# split (2026-08-01): every remaining function clears this with room to spare, and it still catches
# a function actually worth splitting rather than flagging every render function with a few branches.
MAX_COMPLEXITY = 15

FUNCTION_NODE_TYPES = {
    "function_declaration",
    "function_expression",
    "arrow_function",
    "method_definition",
    "generator_function_declaration",
    "generator_function",
}

# Each occurrence inside a function body adds one path through it.
DECISION_NODE_TYPES = {
    "if_statement",
    "for_statement",
    "for_in_statement",
    "while_statement",
    "do_statement",
    "catch_clause",
    "ternary_expression",
    "switch_case",  # switch_default is a separate node type and is not counted
}

# Pre-existing hotspots outside the 2026-08-01 activeSessionController.js/formsController.js SRP
# split (TODO.md §14) — not silently ignored: each entry needs a reason, same discipline as
# deploy/zap/zap-baseline.conf's per-rule ZAP ignores (AGENT_RULES §2.A.3, "explicitly suppressed
# with a written justification"). Keyed by "path::functionName" (or "path::<anonymous>@<line>" for
# an unnamed function, fixed at the line it had when listed) — DELIBERATELY fragile: a name change
# or a shift in an anonymous function's start line drops it out of the allowlist and fails the gate
# again, loudly, rather than quietly continuing to cover a function that has since moved or grown
# further under a new name. That is a nudge to actually fix the function, not a bug in the matcher.
# Removing an entry without lowering the function's complexity first will fail the build — the
# entry only buys time on functions nobody has touched yet, not a permanent exemption.
PRE_EXISTING_ALLOWLIST = {
    "src/modules/clipboard/circuitCard.js::renderFocused": (
        "In-focus circuit card markup, branching per member/round/quick-signal state; §14 follow-up."
    ),
    "src/modules/common/sessionItemRecord.js::buildProgramSnapshot": (
        "Flattens a live plan (exercises + rests + circuits) into an immutable history record; §14 follow-up."
    ),
    "src/modules/common/versionMessages.js::renderVersionMessages": (
        "Upgrade/rollback/end-of-support card variants, one render; §14 follow-up."
    ),
    "src/modules/plans/planAdjustments.js::renderPendingPlanAdjustmentsComponent": (
        "Pending-adjustment list across every adjustment kind; §14 follow-up."
    ),
    "src/modules/plans/planAdjustments.js::openAdjustmentWizardComponent": (
        "Multi-step apply-adjustment wizard, one function per TODO.md §7; §14 follow-up."
    ),
    "src/modules/sessionList/sessionsView.js::seedDemoActiveSession": (
        "Demo-mode active-session seeding, mirrors real startWorkoutSession's branching; §14 follow-up."
    ),
}

_LANGUAGE = Language(tsjs.language())


def _make_parser():
    return Parser(_LANGUAGE)


def _function_name(node):
    """Best-effort human-readable name for a function-like node, for reporting only."""
    name_field = node.child_by_field_name("name")
    if name_field is not None:
        return name_field.text.decode("utf-8")

    parent = node.parent
    if parent is None:
        return "<anonymous>"
    if parent.type == "variable_declarator":
        name = parent.child_by_field_name("name")
        if name is not None:
            return name.text.decode("utf-8")
    if parent.type == "pair":
        key = parent.child_by_field_name("key")
        if key is not None:
            return key.text.decode("utf-8")
    if parent.type == "assignment_expression":
        left = parent.child_by_field_name("left")
        if left is not None:
            return left.text.decode("utf-8")
    if parent.type == "property_identifier":
        return parent.text.decode("utf-8")
    return "<anonymous>"


def _walk(node, contexts, findings, path):
    """Depth-first walk. `contexts` is a stack of [complexity] cells, one per enclosing function —
    a decision point found anywhere in the walk is credited to the innermost one currently open."""
    is_function = node.type in FUNCTION_NODE_TYPES
    if is_function:
        contexts.append({"complexity": 1, "line": node.start_point[0] + 1})

    if node.type in DECISION_NODE_TYPES and contexts:
        contexts[-1]["complexity"] += 1
    if node.type == "binary_expression":
        operator_node = node.child_by_field_name("operator")
        if (
            operator_node is not None
            and operator_node.text.decode("utf-8")
            in (
                "&&",
                "||",
                "??",
            )
            and contexts
        ):
            contexts[-1]["complexity"] += 1

    for child in node.children:
        _walk(child, contexts, findings, path)

    if is_function:
        ctx = contexts.pop()
        findings.append((path, ctx["line"], _function_name(node), ctx["complexity"]))


def analyze_source(source, label=""):
    """[(label, line, function_name, complexity), ...] for EVERY function, regardless of
    MAX_COMPLEXITY — filtering to over-limit is the caller's job (see over_limit()). Split from
    analyze_file so a unit test can feed a JS snippet directly, without needing a real file under
    REPO_ROOT for the path-relativization below to succeed against.
    """
    parser = _make_parser()
    tree = parser.parse(source if isinstance(source, bytes) else source.encode("utf-8"))
    findings = []
    _walk(tree.root_node, [], findings, label)
    return findings


def analyze_file(path):
    """[(path, line, function_name, complexity), ...] for every function in the file."""
    return analyze_source(path.read_bytes(), str(path.relative_to(REPO_ROOT)))


def over_limit(findings):
    """The subset of analyze_*() findings actually over MAX_COMPLEXITY."""
    return [f for f in findings if f[3] > MAX_COMPLEXITY]


def _allowlist_key(path, line, name):
    if name == "<anonymous>":
        return f"{path}::<anonymous>@{line}"
    return f"{path}::{name}"


def classify_findings(all_findings):
    """Split over-limit findings into (findings, allowlisted, stale_entries):
    - findings: over-limit and NOT in PRE_EXISTING_ALLOWLIST — these fail the build.
    - allowlisted: over-limit and covered by a PRE_EXISTING_ALLOWLIST entry — reported, don't fail.
    - stale_entries: PRE_EXISTING_ALLOWLIST keys that matched nothing — the function moved, was
      renamed, or is no longer over the limit; a dead exemption, and itself fails the build.
    """
    findings = []
    allowlisted = []
    for path, line, name, complexity in all_findings:
        key = _allowlist_key(path, line, name)
        if key in PRE_EXISTING_ALLOWLIST:
            allowlisted.append((path, line, name, complexity, key))
        else:
            findings.append((path, line, name, complexity))

    stale_entries = sorted(
        set(PRE_EXISTING_ALLOWLIST) - {key for *_, key in allowlisted}
    )
    return findings, allowlisted, stale_entries


def main():
    all_findings = []
    for path in sorted(SRC_DIR.rglob("*.js")):
        all_findings.extend(over_limit(analyze_file(path)))

    findings, allowlisted, stale_entries = classify_findings(all_findings)

    if allowlisted:
        print(
            f"\n  ⚠ Cyclomatic complexity: {len(allowlisted)} pre-existing function(s) allowlisted\n"
        )
        for path, line, name, complexity, key in allowlisted:
            print(
                f"    {path}:{line}  {name}() — complexity {complexity}  ({PRE_EXISTING_ALLOWLIST[key]})"
            )

    if findings:
        print(
            f"\n  ✗ Cyclomatic complexity: {len(findings)} function(s) over {MAX_COMPLEXITY}\n"
        )
        for path, line, name, complexity in findings:
            print(f"    {path}:{line}  {name}() — complexity {complexity}")
        print(
            "\n    Split the function, or extract a branch — see agent_tools/complexity.py "
            "for what counts. New over-limit functions cannot be allowlisted — only pre-existing"
            "\n    ones (agent_tools/complexity.py's PRE_EXISTING_ALLOWLIST) can, each with its own"
            "\n    written justification."
        )
        return 1

    if stale_entries:
        print(
            f"\n  ✗ Cyclomatic complexity: {len(stale_entries)} stale allowlist entr(y/ies)\n"
        )
        for key in stale_entries:
            print(
                f"    {key}  — no longer over {MAX_COMPLEXITY}; remove from PRE_EXISTING_ALLOWLIST"
            )
        print(
            "\n    An allowlist entry for a function that's no longer over the limit is a dead"
            "\n    exemption — remove it so the list stays a reliable map of real, current debt."
        )
        return 1

    checked = sum(1 for _ in SRC_DIR.rglob("*.js"))
    print(
        f"  ✓ Cyclomatic complexity: {checked} file(s), every function ≤ {MAX_COMPLEXITY} "
        f"or a justified pre-existing exception."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
