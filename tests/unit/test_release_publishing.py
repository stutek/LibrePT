# tests/unit/test_release_publishing.py
# Publishing the site once per released version (TODO §16.1/§16.2). The app treats the manifest's
# order as the absolute authority on which release is newer, so the ordering guarantee is the thing
# most worth pinning: tags cut in the same second tie under a date sort, and a tie would publish
# releases in the wrong order — presenting a DOWNGRADE to a PT as "a new version is available".
# These run against throwaway git repositories, so they exercise the real deploy code path.

import json
import os
import subprocess

from build.releases import VERSION_MANIFEST_NAME, list_release_tags, publish_releases


def _git(repo, *args):
    subprocess.run(
        ["git", "-c", "user.email=t@t", "-c", "user.name=t", *args],
        cwd=repo,
        check=True,
        capture_output=True,
    )


def _repo_with_tags(tmp_path, tags):
    """A repo whose commits are all made in the same second — the tie that broke date sorting."""
    repo = tmp_path / "repo"
    (repo / "src").mkdir(parents=True)
    _git(repo, "init", "-q", ".")
    for tag in tags:
        (repo / "src" / "index.html").write_text(f'<!doctype html><base href="/">{tag}')
        (repo / "src" / "version.js").write_text(
            'export const BUILD_INFO = { commit: "dev", builtAt: "", release: "dev" };\n'
        )
        _git(repo, "add", "-A")
        _git(repo, "commit", "-qm", tag)
        _git(repo, "tag", tag)
    return repo


def _in(directory, fn):
    previous = os.getcwd()
    os.chdir(directory)
    try:
        return fn()
    finally:
        os.chdir(previous)


def test_releases_are_listed_newest_first_even_when_tag_dates_tie(tmp_path):
    repo = _repo_with_tags(tmp_path, ["v1.0.0", "v1.1.0", "v1.10.0", "v1.2.0"])

    tags = _in(repo, list_release_tags)

    # Version-aware, not lexicographic (v1.10.0 > v1.2.0) and not date-based (all tags tie).
    assert tags == ["v1.10.0", "v1.2.0", "v1.1.0", "v1.0.0"]


def test_each_release_is_published_as_a_self_contained_app(tmp_path):
    repo = _repo_with_tags(tmp_path, ["v1.0.0", "v1.1.0"])
    dist = repo / "dist"
    dist.mkdir()

    published = _in(repo, lambda: publish_releases(str(dist), "/LibrePT/", "abc1234"))

    assert published == ["v1.1.0", "v1.0.0"]
    for tag in published:
        folder = dist / tag
        # Its own base, its own stamp, its own SPA fallback, its own integrity catalog — each copy
        # is served under its own scope and verifies its shell relative to itself.
        assert f'<base href="/LibrePT/{tag}/">' in (folder / "index.html").read_text()
        assert f'release: "{tag}"' in (folder / "version.js").read_text()
        assert (folder / "404.html").exists()
        assert (folder / "integrity.json").exists()

    manifest = json.loads((dist / VERSION_MANIFEST_NAME).read_text())
    assert manifest["current"] == "v1.1.0"
    assert [release["id"] for release in manifest["releases"]] == ["v1.1.0", "v1.0.0"]
    assert [release["path"] for release in manifest["releases"]] == [
        "v1.1.0/",
        "v1.0.0/",
    ]


def test_an_untagged_repo_publishes_no_manifest_at_all(tmp_path):
    """No tags means no versions to host — the feature stays dormant rather than half-on, so the
    app can never advertise a version that would 404."""
    repo = tmp_path / "bare"
    (repo / "src").mkdir(parents=True)
    _git(repo, "init", "-q", ".")
    (repo / "src" / "index.html").write_text('<!doctype html><base href="/">')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "no tags here")
    dist = repo / "dist"
    dist.mkdir()

    published = _in(repo, lambda: publish_releases(str(dist), "/LibrePT/", "abc1234"))

    assert published == []
    assert not (dist / VERSION_MANIFEST_NAME).exists()


def test_only_the_supported_window_of_releases_stays_hosted(tmp_path):
    """Old versions are kept available for rollback, not forever (§16.1's supportability EOL)."""
    repo = _repo_with_tags(tmp_path, ["v1.0.0", "v1.1.0", "v1.2.0"])

    tags = _in(repo, lambda: list_release_tags(limit=2))

    assert tags == ["v1.2.0", "v1.1.0"]
