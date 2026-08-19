"""Unit tests for agent_tools/constant_copies.py — a declared constant is written once.

The failure it prevents is silent by construction: every copy of a value is correct on the day it is
written, and the repository keeps working after the declaration changes. Nothing fails until somebody
reads a stale number and believes it.
"""

import pytest

from agent_tools import constant_copies


@pytest.fixture
def repo(tmp_path, monkeypatch):
    """A throwaway tree the checker treats as the repository.

    The fixtures use a port the repository does not actually declare, so these tests neither depend
    on the real value nor become findings of the very check they cover.
    """
    monkeypatch.setattr(constant_copies, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(constant_copies, "generated_pages", lambda: set())

    def write(relative, text):
        path = tmp_path / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    return write


def _files():
    return list(constant_copies.scanned_files())


def test_a_second_copy_of_a_declared_value_is_reported(repo):
    repo("deploy/local_http_server.py", "DEV_SERVER_PORT = 9099\n")
    repo("build/thing.py", "# the dev server listens on :9099\n")

    found = constant_copies.copies_of(
        "DEV_SERVER_PORT", "deploy/local_http_server.py", "9099", _files()
    )

    assert [(str(path), number) for path, number, _ in found] == [("build/thing.py", 1)]


def test_a_line_naming_the_constant_is_the_right_answer_not_a_finding(repo):
    # Both the declaration itself and prose that says the NAME rather than the number — which is
    # exactly the fix the tool asks for, so flagging either would make it unsatisfiable.
    repo("deploy/local_http_server.py", "DEV_SERVER_PORT = 9099\n")
    repo(
        "build/thing.py",
        "# the dev server listens on DEV_SERVER_PORT (currently 9099)\n",
    )

    assert (
        constant_copies.copies_of(
            "DEV_SERVER_PORT", "deploy/local_http_server.py", "9099", _files()
        )
        == []
    )


def test_history_is_not_rewritten(repo):
    """TODO.md and CHANGELOG.md record what happened. "the port was written out six times" is a true
    statement about the past, and a checker that demanded it be reworded would falsify the record."""
    repo("deploy/local_http_server.py", "DEV_SERVER_PORT = 9099\n")
    repo("TODO.md", "the literal 9099 appeared in six places\n")
    repo("CHANGELOG.md", "centralised 9099 into one declaration\n")

    assert (
        constant_copies.copies_of(
            "DEV_SERVER_PORT", "deploy/local_http_server.py", "9099", _files()
        )
        == []
    )


def test_generated_output_is_not_a_copy(repo, monkeypatch):
    """A value substituted INTO a generated page is the mechanism working. The copy, if there is
    one, lives in the Markdown source — which is scanned."""
    import pathlib

    repo("deploy/local_http_server.py", "DEV_SERVER_PORT = 9099\n")
    repo("src/generated.html", "<p>http://localhost:9099</p>\n")
    monkeypatch.setattr(
        constant_copies, "generated_pages", lambda: {pathlib.Path("src/generated.html")}
    )

    assert (
        constant_copies.copies_of(
            "DEV_SERVER_PORT", "deploy/local_http_server.py", "9099", _files()
        )
        == []
    )


def test_a_declaration_that_vanished_fails_loudly(repo):
    """A row naming a constant the repository no longer declares means the tool is protecting
    nothing — which must be a failure, not a silent skip."""
    repo("deploy/local_http_server.py", "# the port moved somewhere else\n")
    repo(
        "src/data/publicUrls.js",
        'export const PUBLIC_SITE_URL = "https://example.test";\n',
    )

    with pytest.raises(SystemExit, match="no declaration of DEV_SERVER_PORT"):
        constant_copies.declared_values()


def test_the_tool_runs_against_the_real_tree():
    """Deliberately asserts that it RUNS, not that the tree is clean.

    Asserting `main() == 0` here would quietly make this a gate — Stage 1 runs the unit tests — and
    TODO §28.3 rules the opposite: an agent tool first, wired into the pipeline only once it has
    caught something more than once. What this does prevent is the other failure
    mode of a hand-run tool: rotting until it cannot run at all.
    """
    assert constant_copies.main() in (0, 1)
