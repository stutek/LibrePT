# tests/unit/test_release_identity.py
# The release identity (TODO §16) is the git tag a build was cut from. THREE writers must agree on
# the BUILD_INFO shape — the checked-in src/version.js, the local build (build.stamp_build_version),
# and the Pages deploy (.github/workflows/deploy.yml) — or a deployed build silently loses its
# release and drops out of version switching. These checks pin all three together, and pin the
# --exact-match rule that stops an untagged commit claiming the previous release's identity.

import re
import subprocess
from pathlib import Path

from build import resolve_release_tag, stamp_build_version

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


def test_deploy_workflow_stamps_the_same_fields(src_dir):
    workflow = (REPO_ROOT / ".github" / "workflows" / "deploy.yml").read_text(
        encoding="utf-8"
    )
    printf_line = next(
        line
        for line in workflow.splitlines()
        if "BUILD_INFO" in line and "printf" in line
    )
    assert _build_info_fields(printf_line) == BUILD_INFO_FIELDS
    # Only an exact tag counts as a release, and an untagged commit must fall back to "dev".
    assert "git describe --tags --exact-match" in workflow
    assert "|| echo dev" in workflow
    # Tags are not in a default shallow checkout — without this the release is always "dev".
    assert "fetch-tags: true" in workflow


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
