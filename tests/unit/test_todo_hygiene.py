"""Unit tests for agent_tools/todo_hygiene.py — the gate that keeps TODO.md to open work.

What this gate is for is invisible to review: nothing breaks when a closed section keeps its body,
it just costs every agent that reads the backlog, on every read, forever. TODO.md reached 5,406
lines that way. These tests pin the three judgements the check makes — a closed section may keep a
pointer but not a body, an open subsection under a closed parent stays put, and a section that moved
to the archive must leave a heading behind so `§N.M` references still land.
"""

import pytest

from agent_tools import todo_hygiene

STUB = "Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#38-x-a-thing).\n"


@pytest.fixture
def fake_backlog(tmp_path, monkeypatch):
    """A miniature TODO.md / TODO_ARCHIVE.md pair the check can be pointed at."""

    def write(todo, archive=""):
        (tmp_path / "TODO.md").write_text(todo)
        (tmp_path / "TODO_ARCHIVE.md").write_text(archive)
        monkeypatch.setattr(todo_hygiene, "TODO", tmp_path / "TODO.md")
        monkeypatch.setattr(todo_hygiene, "ARCHIVE", tmp_path / "TODO_ARCHIVE.md")

    return write


def test_a_closed_section_reduced_to_a_pointer_passes(fake_backlog):
    fake_backlog(
        f"## 38. [x] A thing\n\n{STUB}", "## 38. [x] A thing\n\nThe whole story.\n"
    )

    assert todo_hygiene.check() == []


def test_a_closed_section_that_kept_its_body_fails(fake_backlog):
    body = "\n".join(
        f"Line {n} of reasoning nobody needs in the backlog." for n in range(9)
    )
    fake_backlog(f"## 38. [x] A thing\n\n{body}\n", f"## 38. [x] A thing\n\n{body}\n")

    findings = todo_hygiene.check()

    assert len(findings) == 1
    assert "keeps 9 lines of body" in findings[0]


def test_a_stub_that_names_no_archive_entry_fails(fake_backlog):
    fake_backlog(
        "## 38. [x] A thing\n\nShipped, see the changelog.\n",
        "## 38. [x] A thing\n\nx\n",
    )

    assert "names no archive entry" in todo_hygiene.check()[0]


def test_an_open_subsection_stays_under_its_closed_parent(fake_backlog):
    """Open work filed under a done heading is still open work — it does not move to the archive."""
    fake_backlog(
        f"## 38. [x] A thing\n\n{STUB}\n### 38.11 [ ] The bit still open\n\n"
        + "\n".join(f"Reason {n}." for n in range(9))
        + "\n",
        "## 38. [x] A thing\n\nThe whole story.\n",
    )

    assert todo_hygiene.check() == []


def test_a_closed_subsection_left_behind_fails(fake_backlog):
    fake_backlog(
        f"## 38. [x] A thing\n\n{STUB}\n### 38.4 [x] Also done\n\nAnd its whole story.\n",
        "## 38. [x] A thing\n\nThe whole story.\n",
    )

    assert "keeps a closed subsection" in todo_hygiene.check()[0]


def test_an_archived_section_with_no_stub_fails(fake_backlog):
    """The stub is what keeps `§38` alive for the code and tests that cite it."""
    fake_backlog(
        "## 39. Something open\n\nWork.\n", "## 38. [x] A thing\n\nThe whole story.\n"
    )

    assert "no stub in TODO.md" in todo_hygiene.check()[0]


def test_an_archived_subsection_needs_no_stub_of_its_own(fake_backlog):
    """Its parent's stub covers it; ninety child pointers would refill the file this check empties."""
    fake_backlog(
        f"## 38. [x] A thing\n\n{STUB}",
        "## 38. [x] A thing\n\nStory.\n\n### 38.4 [x] A detail\n\nIts story.\n",
    )

    assert todo_hygiene.check() == []
