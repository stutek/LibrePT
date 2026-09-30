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


def test_a_new_file_not_yet_added_to_git_is_checked_too(tmp_path, monkeypatch):
    """A new test file carried "(TODO 1.3)" through the check and the gate, because both read only
    the files git already tracked; the commit that added it then turned main red for everyone. A file
    about to be committed is exactly the one to check, so untracked files count, ignored ones do not."""
    import subprocess

    def run(*args):
        subprocess.run(
            ["git", "-C", str(tmp_path), *args], check=True, capture_output=True
        )

    run("init", "-q")
    (tmp_path / ".gitignore").write_text("scratch/\n", encoding="utf-8")
    (tmp_path / "tracked.py").write_text("x = 1\n", encoding="utf-8")
    run("add", "tracked.py", ".gitignore")
    (tmp_path / "new_test.py").write_text(
        "# Stacked lanes (TODO 1.3).\n", encoding="utf-8"
    )
    (tmp_path / "scratch").mkdir()
    (tmp_path / "scratch" / "notes.py").write_text("# see TODO §4\n", encoding="utf-8")
    monkeypatch.setattr(todo_refs, "REPO_ROOT", tmp_path)

    assert [path for path, _line, _text in todo_refs.find_all()] == ["new_test.py"]


def test_the_repository_holds_no_pointer_into_todo():
    """The check itself, run over the real tree, naming what it found."""
    found = todo_refs.find_all()
    detail = "\n".join(f"  {path}:{line}  {text}" for path, line, text in found)
    assert not found, f"{len(found)} pointer(s) into TODO.md:\n{detail}"
