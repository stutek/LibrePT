# tests/unit/test_build_snapshot.py — the gate on a snapshot, and a commit of exactly what it proved
# (build/snapshot.py). The promises a session relies on: the commit holds the named paths and nothing
# another session staged, the shared index keeps that session's work, and a path or HEAD that moved
# after the run is refused. Runs git in a throwaway repository; no browser, no gate.

import os
import subprocess

import pytest

from build import snapshot
from build.__main__ import snapshot_command


def git(*args, cwd):
    return subprocess.run(
        ["git", *args], cwd=cwd, check=True, capture_output=True, text=True
    ).stdout


@pytest.fixture
def repo(tmp_path, monkeypatch):
    git("init", "-q", cwd=tmp_path)
    git("config", "user.email", "t@example.invalid", cwd=tmp_path)
    git("config", "user.name", "T", cwd=tmp_path)
    for name in ("mine.js", "theirs.js", "notes.md"):
        (tmp_path / name).write_text("base\n")
    git("add", ".", cwd=tmp_path)
    git("commit", "-qm", "base", cwd=tmp_path)
    (tmp_path / ".build-reports").mkdir()
    monkeypatch.chdir(tmp_path)
    return tmp_path


def prove(repo, paths):
    head = git("rev-parse", "HEAD", cwd=repo).strip()
    snapshot.write_proof(head, {p: snapshot.digest(p) for p in paths})


def message(repo):
    path = repo / "msg.txt"
    path.write_text("fix: mine\n\nCo-Authored-By: T <t@example.invalid>\n")
    return str(path)


def test_the_commit_holds_the_proved_paths_and_leaves_another_sessions_staging(repo):
    (repo / "mine.js").write_text("mine\n")
    (repo / "new.js").write_text("new\n")
    (repo / "theirs.js").write_text("theirs\n")
    git("add", "theirs.js", cwd=repo)  # another session's staged work
    prove(repo, ["mine.js", "new.js"])

    assert snapshot.run_commit(message(repo), ["mine.js", "new.js"]) == 0

    committed = git("show", "--name-only", "--format=", "HEAD", cwd=repo).split()
    assert sorted(committed) == ["mine.js", "new.js"]
    assert git("diff", "--cached", "--name-only", cwd=repo).split() == ["theirs.js"]


def test_another_sessions_run_leaves_this_sessions_proof(repo):
    # A run clears only the proof of its own path set. With one shared proof file, a run started a
    # second after another ended deleted that session's proof before it could commit.
    (repo / "mine.js").write_text("mine\n")
    (repo / "theirs.js").write_text("theirs\n")
    prove(repo, ["mine.js"])
    prove(repo, ["theirs.js"])
    os.remove(
        snapshot.proof_path(["theirs.js"])
    )  # what the other session's next run does first

    assert snapshot.run_commit(message(repo), ["mine.js"]) == 0


def test_one_run_yields_one_commit_per_change_and_no_path_twice(repo):
    (repo / "mine.js").write_text("mine\n")
    (repo / "theirs.js").write_text("second change\n")
    prove(repo, ["mine.js", "theirs.js"])

    assert snapshot.run_commit(message(repo), ["mine.js"]) == 0
    assert snapshot.run_commit(message(repo), ["mine.js"]) == 1
    assert snapshot.run_commit(message(repo), ["theirs.js"]) == 0

    subjects = git("log", "--format=%s", cwd=repo).split("\n")[:3]
    assert subjects == ["fix: mine", "fix: mine", "base"]
    assert snapshot.find_proof(["mine.js"]) is None
    assert snapshot.find_proof(["theirs.js"]) is None


def test_a_path_changed_after_the_run_is_refused(repo):
    (repo / "mine.js").write_text("mine\n")
    prove(repo, ["mine.js"])
    (repo / "mine.js").write_text("changed after the gate\n")

    assert snapshot.run_commit(message(repo), ["mine.js"]) == 1
    assert git("log", "--format=%s", cwd=repo).split("\n")[0] == "base"


def test_head_moved_by_markdown_only_is_accepted_and_by_code_is_refused(repo):
    (repo / "mine.js").write_text("mine\n")
    prove(repo, ["mine.js"])
    (repo / "notes.md").write_text("another session's note\n")
    git("commit", "-qm", "docs", "--", "notes.md", cwd=repo)
    _, proof = snapshot.find_proof(["mine.js"])
    head = git("rev-parse", "HEAD", cwd=repo).strip()

    assert snapshot.stale_reasons(proof, ["mine.js"], head, ["notes.md"]) == []
    reasons = snapshot.stale_reasons(proof, ["mine.js"], head, ["theirs.js"])
    assert reasons and "theirs.js" in reasons[0]


def test_a_deleted_file_is_committed_as_a_deletion(repo):
    os.remove(repo / "mine.js")
    prove(repo, ["mine.js"])

    assert snapshot.run_commit(message(repo), ["mine.js"]) == 0
    assert "mine.js" not in git("ls-tree", "--name-only", "HEAD", cwd=repo).split()


def test_a_directory_is_refused_rather_than_expanded(repo):
    (repo / "dir").mkdir()
    assert "a directory" in snapshot.check_paths(["dir"], set())
    assert snapshot.check_paths([], set())


def test_the_snapshot_is_head_plus_the_named_paths_only(repo, tmp_path_factory):
    (repo / "mine.js").write_text("mine\n")
    (repo / "theirs.js").write_text("half-written by another session\n")
    (repo / ".venv").mkdir()
    target = str(tmp_path_factory.mktemp("cache") / "snap")

    snapshot.prepare(["mine.js"], snapshot=target)

    assert open(os.path.join(target, "mine.js")).read() == "mine\n"
    assert open(os.path.join(target, "theirs.js")).read() == "base\n"
    git("worktree", "remove", "--force", target, cwd=repo)


def test_the_command_line_reaches_the_snapshot_only_with_paths():
    assert snapshot_command(["check"]) is None
    assert snapshot_command(["check", "--", "a.js"]) is not None
    assert snapshot_command(["commit", "-F", "m.txt", "--", "a.js"]) is not None
    assert snapshot_command(["commit", "--", "a.js"]) is None
