"""Unit tests for agent_tools/doclinks.py — the documentation cross-reference checker.

It gates every commit, so both halves matter equally: it must catch the references that really are
dead, and it must not fail the build over ones that resolve perfectly well. The false-positive tests
below each pin a shape that produced a spurious finding while the tool was being written.
"""

import pytest

from agent_tools import doclinks


@pytest.fixture
def docs(tmp_path):
    """A miniature repo whose files are passed explicitly, so no git checkout is involved."""

    def write(name, text):
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    return write


def findings_for(path, all_files):
    return [message for _, _, message in doclinks.check_file(path, {}, all_files)]


# --- slug rules -------------------------------------------------------------------------------


def test_underscores_survive_slugification():
    """`_` is a word character; stripping it as an emphasis mark broke every file-name anchor."""
    assert "inline_clipboard_editorpatch" in doclinks.slugify(
        "8.3 [ ] Inline Clipboard Editor (Saved Patch: `patches/inline_clipboard_editor.patch`)"
    )


def test_checkbox_state_changes_the_anchor():
    """`[x]` leaves an `x` in the slug and `[ ]` leaves nothing — ticking a box moves the anchor."""
    assert doclinks.slugify("13.3 [x] Conditioning metrics") != doclinks.slugify(
        "13.3 [ ] Conditioning metrics"
    )


def test_hyphen_runs_are_normalized_on_both_sides():
    assert doclinks.normalize_anchor(
        "163--decided-not-built"
    ) == doclinks.normalize_anchor("163---decided-not-built")


# --- what must be caught ----------------------------------------------------------------------


def test_dead_file_link_is_reported(docs, tmp_path):
    todo = docs(
        "TODO.md", "# T\n\n## 1. Section\n\nSee [gone](src/views/historyView.js).\n"
    )
    assert any("dead link" in f for f in findings_for(todo, [todo]))


def test_dead_anchor_is_reported_with_a_suggestion(docs):
    todo = docs(
        "TODO.md",
        "# T\n\n## 13. Taxonomy\n\n### 13.3 [x] Conditioning metrics\n\n[link](#133-conditioning-metrics)\n",
    )
    dead = [f for f in findings_for(todo, [todo]) if "dead anchor" in f]
    assert dead and "did you mean #133-x-conditioning-metrics" in dead[0]


def test_dangling_section_reference_inside_todo_is_reported(docs):
    """The exact failure that motivated the tool: a §-reference outliving its section."""
    todo = docs("TODO.md", "# T\n\n## 16. Storage\n\nSee §16.2 for hosting.\n")
    assert any("dangling ref" in f and "16.2" in f for f in findings_for(todo, [todo]))


def test_qualified_reference_into_another_document_is_checked(docs):
    todo = docs("TODO.md", "# T\n\n## 16. Storage\n")
    other = docs("PRIVACY.md", "# P\n\nSee TODO §16.9.\n")
    assert any("dangling ref" in f for f in findings_for(other, [todo, other]))


# --- what must NOT be flagged -----------------------------------------------------------------


def test_live_reference_and_anchor_are_silent(docs):
    todo = docs(
        "TODO.md",
        "# T\n\n## 16. Storage\n\n### 16.3 [ ] Bucket on the schema\n\n"
        "See [16.3](#163--bucket-on-the-schema) and §16.3.\n",
    )
    assert findings_for(todo, [todo]) == []


def test_unqualified_reference_outside_todo_is_left_alone(docs):
    """Prose naming no document is ambiguous — guessing there produced only false positives."""
    uc = docs(
        "use_cases/uc6.md", "# UC6\n\n## 1. Scope\n\nThe modality field of §17.1.\n"
    )
    assert findings_for(uc, [uc]) == []


def test_reference_to_a_list_item_in_a_doc_without_subheadings_is_left_alone(docs):
    """ROUTING.md numbers its invariants as a list inside `## 5`, so §5.5 is item 5 of section 5."""
    routing = docs("docs/ROUTING.md", "# R\n\n## 5. Invariants\n\n1. one\n5. five\n")
    caller = docs(
        "TODO.md", "# T\n\n## 1. X\n\nsee [docs/ROUTING.md](docs/ROUTING.md) §5.5\n"
    )
    assert findings_for(caller, [routing, caller]) == []


def test_whole_section_reference_is_satisfied_by_its_subitems(docs):
    todo = docs("TODO.md", "# T\n\n### 18.6 [ ] Engine\n\nSee §18 for the design.\n")
    assert findings_for(todo, [todo]) == []


def test_external_links_and_code_samples_are_ignored(docs):
    todo = docs(
        "TODO.md",
        "# T\n\n## 1. X\n\n[site](https://example.com/missing) and `[a](nope.js)`\n\n"
        "```\n[b](also-nope.js)\nSee §99.9\n```\n",
    )
    assert findings_for(todo, [todo]) == []


# --- the real repository ----------------------------------------------------------------------


def test_repository_documentation_graph_is_intact():
    """The gate itself, as a test: every tracked .md link and §-reference resolves.

    Reports the findings IN the assertion message rather than asserting on `main()`'s exit code.
    `assert doclinks.main() == 0` fails as a bare `assert 1 == 0`, and the file:line of the dead
    link reached the screen only because pytest happened to echo main()'s captured stdout — which
    is a display setting, not a guarantee. A gate failure has to name what broke without anyone
    re-running the tool by hand.
    """
    files = doclinks.tracked_markdown_files()
    cache = {}
    findings = []
    for path in files:
        findings.extend(doclinks.check_file(path, cache, files))

    detail = "\n".join(
        f"  {rel}:{line}  {message}"
        for rel, line, message in sorted(findings, key=lambda f: (str(f[0]), f[1]))
    )
    assert not findings, (
        f"{len(findings)} unresolved documentation reference(s):\n{detail}"
    )


def test_a_render_time_placeholder_is_not_a_dead_link(docs):
    """`{{PUBLIC_SITE_URL}}/?init=demo_data_load` resolves to an absolute URL when render_docs.py
    builds the page (TODO §28.2). Treating it as a relative path here would report the mechanism
    working as a broken link — and the fix would be to write the address out again, which is the
    duplication the placeholder exists to remove."""
    page = docs(
        "docs/LANDING.md",
        "# Landing\n\n[Watch the demo]({{PUBLIC_SITE_URL}}/?init=demo_data_load)\n",
    )

    assert findings_for(page, [page]) == []


# --- rule citations must not point at a number --------------------------------------------------


def test_a_rule_cited_by_number_is_a_finding(docs):
    """A rule's number is a position in a list that gets reordered whenever a lesson lands. Any file
    that cites one turns "put the important rule first" into an edit across the repository — which is
    what happened on 2026-08-19, when reordering the rules touched 87 files."""
    path = docs("TODO.md", "Gated because AGENT_RULES §2.1 requires it.\n")

    findings = findings_for(path, [path])

    assert findings, "a numbered rule citation must not pass"
    assert "by name" in findings[0]


def test_the_rules_file_may_not_cite_its_own_numbers_either(docs):
    """Anti-fragility has to hold inside the file too: a rule that says "see §4.2" breaks the moment
    §4.2 moves, and it is the one document guaranteed to be reordered."""
    path = docs("AGENT_RULES.md", "Test it in the tier AGENT_RULES §4.2 names.\n")

    assert findings_for(path, [path])


def test_a_rule_cited_by_name_passes(docs):
    """The whole point: naming the rule survives any reordering, and reads without a second file."""
    path = docs(
        "TODO.md", "Gated because AGENT_RULES: run the gate in full requires it.\n"
    )

    assert findings_for(path, [path]) == []


def test_another_document_may_still_use_section_numbers(docs):
    """Only RULE citations are numberless. TODO.md's own §-numbering is how its sections are
    addressed, and doclinks still resolves those normally."""
    todo = docs("TODO.md", "## 12. A thing\n\nSee TODO §12 for the plan.\n")

    assert findings_for(todo, [todo]) == []


def test_the_rules_file_may_still_cite_another_documents_sections(docs):
    """Only RULE numbers are forbidden. `[TODO §6.4](TODO.md)` inside AGENT_RULES.md addresses
    another document's own numbering, which nothing about reordering the rules can break."""
    rules = docs(
        "AGENT_RULES.md", "CI reproduces the four stages ([TODO §6.4](TODO.md)).\n"
    )
    todo = docs("TODO.md", "## 6. CI\n\n### 6.4 Stages\n")

    assert findings_for(rules, [rules, todo]) == []
