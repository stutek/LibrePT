# tests/unit/test_todo_refs.py
# No file outside TODO.md and its archive points at a section of them (agent_tools/todo_refs.py).

from agent_tools import todo_refs


def findings(path, text):
    return todo_refs.findings_in(path, text)


def test_a_pointer_into_todo_is_a_finding_in_any_file():
    for line in [
        "// Keeps running underneath (TODO §40.11).",
        "# see TODO.md §29 for why",
        "the reasoning is in TODO_ARCHIVE.md, §49.2.",
        "[the ruling](../TODO.md#45-reported-2026-09-11)",
        "(see the runbook, or TODO.md section 1.5.1)",
        "# Closes the loop for TODO 2.3.",
    ]:
        assert findings("src/app.js", line), line
        assert findings("docs/NOTES.md", line), line


def test_a_bare_section_sign_in_code_is_a_finding():
    """In source, tests and tools an unqualified § always meant TODO."""
    assert findings("src/app.js", "// the defect (§45.16) came back")
    assert findings("tests/unit/test_x.py", "# what §23.5 chose")


def test_a_section_of_another_document_passes():
    for line in [
        "// the logical model, docs/DATA_MODEL.md §3",
        "// DATA_MODEL §1 says so",
        "// UC6 §6: the crosswalk",
        "// RFC 6350 §3.2: lines fold at 75 octets",
        "// RFC 6350 §3.2/§3.4, both",
    ]:
        assert findings("src/data/x.js", line) == [], line


def test_a_markdown_document_may_number_its_own_sections():
    doc = "# Model\n\n## 4. Star writes\n\nAs §4 describes, the backfill is one transaction.\n"
    assert findings("docs/DATA_MODEL.md", doc) == []


def test_a_bare_section_a_markdown_document_does_not_have_points_away():
    doc = "# Landing\n\nAimed at trainers (the exact defect §3.12 fixed).\n"
    assert findings("docs/LANDING.md", doc)


def test_naming_todo_as_the_home_of_open_work_passes():
    assert (
        findings("README.md", "Open work and decisions live in [TODO.md](TODO.md).")
        == []
    )
    assert findings("src/app.js", "// The public part is in TODO.md.") == []


def test_the_repository_holds_no_pointer_into_todo():
    """The check itself, run over the real tree, naming what it found."""
    found = todo_refs.find_all()
    detail = "\n".join(f"  {path}:{line}  {text}" for path, line, text in found)
    assert not found, f"{len(found)} pointer(s) into TODO.md:\n{detail}"
