# tests/unit/test_test_assertions.py
# The §5.8 assertion gate (agent_tools/test_assertions.py).
#
# A detector is only worth what its NEGATIVE tests prove: this one shipped with three false
# positives on its first run (named scalar constants read as identity checks, a synchronisation
# counter read as dead), and a gate that cries wolf teaches people to silence it with the very
# justification comment that is supposed to mean something. So every "does not flag" case below is a
# real shape from this repo, not a hypothetical.

from agent_tools import test_assertions


def _findings(tmp_path, name, source):
    (tmp_path / name).write_text(source, encoding="utf-8")
    return test_assertions.collect_findings(tmp_path)


def test_an_exact_multi_class_string_is_flagged(tmp_path):
    findings = _findings(
        tmp_path,
        "test_x.py",
        'expect(btn).to_have_class("btn secondary-btn sent")\n',
    )

    assert len(findings) == 1
    assert "exact class string" in findings[0][2]


def test_a_single_class_assertion_is_left_alone(tmp_path):
    # One class may legitimately BE the contract another module keys off; two or more is markup.
    assert (
        _findings(tmp_path, "test_x.py", 'expect(el).to_have_class("hidden")\n') == []
    )


def test_counting_a_stubs_calls_is_flagged(tmp_path):
    findings = _findings(tmp_path, "x.test.mjs", "assert.equal(drive.created, 1);\n")

    assert len(findings) == 1
    assert "call count" in findings[0][2]


def test_identity_equality_between_two_variables_is_flagged(tmp_path):
    findings = _findings(tmp_path, "x.test.mjs", "assert.equal(state, before);\n")

    assert len(findings) == 1
    assert "compares references" in findings[0][2]


def test_two_named_constants_are_a_value_comparison_not_an_identity_check(tmp_path):
    # The false positive that shipped: `assert.equal(BACKUP_SCHEMA, STABLE_SCHEMA)` compares two
    # scalar constants and is exactly right as written.
    assert (
        _findings(
            tmp_path, "x.test.mjs", "assert.equal(BACKUP_SCHEMA, STABLE_SCHEMA);\n"
        )
        == []
    )


def test_property_comparisons_are_not_identity_checks(tmp_path):
    assert (
        _findings(
            tmp_path, "x.test.mjs", "assert.equal(direct.name, viaImport.name);\n"
        )
        == []
    )


def test_a_counter_nothing_reads_is_flagged(tmp_path):
    findings = _findings(
        tmp_path,
        "test_x.py",
        "window.__saved = 0;\nsaveToLocalStorage: () => { window.__saved += 1; },\n",
    )

    assert len(findings) == 1
    assert "never asserted" in findings[0][2]


def test_a_counter_read_by_a_wait_predicate_is_not_dead(tmp_path):
    # The other false positive: e2e's settle loop increments a tick counter and then READS it in a
    # wait_for_function predicate. That is a synchronisation device doing real work.
    source = (
        "window.__settleStableTicks = 0;\n"
        "window.__settleStableTicks++;\n"
        "return window.__settleStableTicks >= 5;\n"
    )

    assert _findings(tmp_path, "test_x.py", source) == []


def test_naming_the_rule_clears_a_finding(tmp_path):
    # The one escape hatch, and it costs a written reason — §5.8's carve-outs require exactly that.
    source = (
        "// An avoided side effect IS behaviour here (AGENT_RULES §5.8): a second sync must not\n"
        "// spend a Drive request on an unchanged file.\n"
        "assert.equal(drive.created + drive.updated, writesAfterFirst);\n"
    )

    assert _findings(tmp_path, "x.test.mjs", source) == []


def test_a_bare_comment_above_does_not_clear_a_finding(tmp_path):
    # Silence must not be purchasable with any old comment — only one that names the rule.
    source = "// this is fine honestly\nassert.equal(state, before);\n"

    assert len(_findings(tmp_path, "x.test.mjs", source)) == 1


def test_the_live_suite_is_clean(tmp_path):
    # The gate's real job. Kept here as well as in build/ so a violation fails the unit tier with a
    # readable name rather than only as a stage-1 task exit code.
    assert test_assertions.collect_findings() == []
