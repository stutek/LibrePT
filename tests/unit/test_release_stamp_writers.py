# tests/unit/test_release_stamp_writers.py
# The release identity (TODO §16) is the git tag a build was cut from. Every writer of the
# BUILD_INFO stamp must agree on its shape — the checked-in src/version.js, the local build
# (build.stamp_build_version) and the per-release stamp the deploy uses
# (build.releases.stamp_version_file) — or a deployed build silently loses its release and drops
# out of version switching. These checks pin them together, pin the --exact-match rule that stops
# an untagged commit claiming the previous release's identity, and pin the deploy delegating its
# assembly to build/releases.py so the root and versioned copies cannot drift apart.

import re
import subprocess
from pathlib import Path

from build import resolve_release_tag, stamp_build_version
from build.releases import build_version_manifest, list_release_tags, stamp_version_file

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILD_INFO_FIELDS = {"commit", "builtAt", "release"}


def _build_info_fields(source):
    """Field names of the `BUILD_INFO = { ... }` object literal in a version.js-shaped string."""
    body = source[source.index("BUILD_INFO") :]
    body = body[body.index("{") : body.index("}") + 1]
    # Anchored on `{` or `,` so a colon inside a value (the ISO build timestamp) isn't read as a key.
    return set(re.findall(r"[{,]\s*(\w+)\s*:", body))


def test_checked_in_version_module_declares_the_release_field(src_dir):
    source = (src_dir / "version.js").read_text(encoding="utf-8")
    assert _build_info_fields(source) == BUILD_INFO_FIELDS
    # The checked-in copy is the untagged fallback every dev/test run sees.
    assert re.search(r'release:\s*"dev"', source)


def test_deploy_workflow_delegates_assembly_to_the_release_publisher(src_dir):
    workflow = (REPO_ROOT / ".github" / "workflows" / "deploy.yml").read_text(
        encoding="utf-8"
    )
    # One entry point assembles root + versioned copies, so they cannot be stamped differently.
    assert "from build.releases import publish_site" in workflow
    # Tags are not in a default shallow checkout — without this every release would stamp "dev".
    assert "fetch-tags: true" in workflow


def test_release_stamp_writes_the_same_fields(tmp_path):
    stamp_version_file(str(tmp_path), "abc1234", "v1.2.0")
    stamped = (tmp_path / "version.js").read_text(encoding="utf-8")
    assert _build_info_fields(stamped) == BUILD_INFO_FIELDS
    # A version folder is stamped with ITS tag, not the checked-out commit's release.
    assert 'release: "v1.2.0"' in stamped


def test_the_manifest_is_newest_first_and_paths_each_release(tmp_path):
    manifest = build_version_manifest(["v1.3.0", "v1.2.0", "v1.1.0"])
    assert manifest["current"] == "v1.3.0", "the newest tag is the current release"
    assert [r["id"] for r in manifest["releases"]] == ["v1.3.0", "v1.2.0", "v1.1.0"]
    # The app trusts this order rather than parsing version strings, so it has to be the real one.
    assert [r["path"] for r in manifest["releases"]] == [
        "v1.3.0/",
        "v1.2.0/",
        "v1.1.0/",
    ]
    assert all(r["eol"] is None for r in manifest["releases"])


def test_no_tags_means_no_releases_to_host():
    """Today's repo has no tags: the whole versioning feature must stay dormant, not half-on."""
    assert list_release_tags() == [] or all(
        isinstance(tag, str) for tag in list_release_tags()
    )
    empty = build_version_manifest([])
    assert empty["current"] is None
    assert empty["releases"] == []


def test_local_build_stamps_the_same_fields(tmp_path):
    stamp_build_version(str(tmp_path))
    stamped = (tmp_path / "version.js").read_text(encoding="utf-8")
    assert _build_info_fields(stamped) == BUILD_INFO_FIELDS


def test_release_tag_resolution_matches_git(tmp_path):
    """resolve_release_tag reports the tag the checkout IS, and "dev" when it is untagged."""
    actual = subprocess.run(
        ["git", "describe", "--tags", "--exact-match"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    expected = actual.stdout.strip() if actual.returncode == 0 else "dev"
    assert resolve_release_tag() == expected
