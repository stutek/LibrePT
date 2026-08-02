"""Unit tests for agent_tools/complexity.py — the frontend cyclomatic-complexity gate.

Covers the counting rules (what pushes a function over MAX_COMPLEXITY, what doesn't) and the
nested-function boundary (an inner function is scored on its own, not folded into its parent).
There is no allowlist mechanism (AGENT_RULES §2.A.3: no gate may carry one) — an over-limit
function fails the build unconditionally, every time.
"""

from agent_tools import complexity


def _names(source):
    return {
        name
        for _, _, name, _ in complexity.over_limit(complexity.analyze_source(source))
    }


def test_a_simple_function_is_not_flagged():
    src = "function greet(name) { return `hi ${name}`; }"
    assert _names(src) == set()


def test_enough_branches_push_a_function_over_the_limit():
    # 16 independent `if` statements: complexity 1 + 16 = 17 > MAX_COMPLEXITY (15).
    body = "\n".join(f"if (a === {i}) return {i};" for i in range(16))
    src = f"function classify(a) {{\n{body}\n}}"
    assert _names(src) == {"classify"}


def test_each_operand_in_a_boolean_chain_counts_as_its_own_branch():
    # `a && b && c && d` is 3 `&&` operators — 3 extra paths, not 1, matching how many distinct
    # ways the expression can short-circuit.
    src = "function f(a,b,c,d) { return a && b && c && d; }"
    findings = complexity.analyze_source(src)
    assert findings == [("", 1, "f", 4)]  # 1 (base) + 3 (&&)


def test_nested_functions_are_scored_independently():
    """A complex inner function must not inflate the outer function's own count, and vice versa."""
    inner_branches = "\n".join(f"if (x === {i}) return {i};" for i in range(16))
    src = f"""
    function outer(x) {{
      const inner = (x) => {{
        {inner_branches}
      }};
      return inner(x);
    }}
    """
    names = _names(src)
    assert "inner" in names
    assert "outer" not in names


def test_optional_chaining_and_nullish_coalescing_parse_cleanly():
    """The reason this tool uses a real grammar instead of a regex: `?.` and `??` are everywhere in
    this codebase, and esprima-style ES2017 parsers choke on them outright."""
    src = "function f(a) { return a?.b?.c ?? 'default'; }"
    findings = complexity.analyze_source(src)
    assert findings == [("", 1, "f", 2)]  # 1 (base) + 1 (??); ?. is not a branch


def test_anonymous_function_reports_as_anonymous():
    src = (
        "el.addEventListener('click', function () {\n"
        + "\n".join(f"if (x === {i}) return;" for i in range(16))
        + "\n});"
    )
    findings = complexity.analyze_source(src)
    assert findings and findings[0][2] == "<anonymous>"


def test_variable_assigned_arrow_function_is_named_after_the_variable():
    body = "\n".join(f"if (x === {i}) return {i};" for i in range(16))
    src = f"const computeThing = (x) => {{\n{body}\n}};"
    assert _names(src) == {"computeThing"}


# --- the real repository -------------------------------------------------------------------------


def test_repository_complexity_is_within_the_gate():
    """The gate itself, as a test: every src/**/*.js function is under MAX_COMPLEXITY, no exceptions."""
    assert complexity.main() == 0
