# build/releases.py — publish the app once per released version, side by side (TODO §16.1/§16.2).
# Single responsibility: turn a git checkout into a site that serves the current build at the root
# AND every supported tagged release under its own subpath, plus the manifest that ties them
# together.
#
# Why rebuild every tag on every deploy: GitHub Pages publishes ONE artifact per run, so a version
# folder that isn't in this run's artifact disappears. Rather than depend on the previous artifact,
# each supported tag is re-materialised from its own commit — which is also why tags were chosen
# over branches or vendored copies (§16.2): "which code is version N" stays a lookup, not a fork.
#
# A release folder is a complete, self-contained app: its own <base>, its own version stamp, its own
# 404 fallback and its own integrity catalog — because each is served under its own scope and the
# service worker verifies its shell relative to itself.

import json
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone

from build import generate_integrity_catalog

# How many tagged releases stay hosted. Old versions are kept available for rollback, not forever —
# §16.1's supportability EOL, expressed as the simplest thing that can enforce it.
SUPPORTED_RELEASE_COUNT = 5
VERSION_MANIFEST_NAME = "versions.json"


def list_release_tags(limit=SUPPORTED_RELEASE_COUNT):
    """Tags newest-first. The manifest inherits this order and the app trusts it absolutely as the
    authority on which release is newer, so it has to be TOTAL and deterministic.

    Sorted by `-v:refname` (git's version-aware sort on the tag name), not by date: two tags cut in
    the same second tie under `-creatordate`, and a tie here silently publishes releases in the
    wrong order — which would present a downgrade to a PT as "a new version is available". Version
    ordering is decided once, here at publish time, so the app itself still needs no version parser.
    """
    try:
        output = subprocess.check_output(
            ["git", "tag", "--sort=-v:refname"], stderr=subprocess.DEVNULL
        ).decode()
    except Exception:
        return []
    tags = [line.strip() for line in output.splitlines() if line.strip()]
    return tags[:limit] if limit else tags


def tag_date(tag):
    """The tag's creation date (YYYY-MM-DD), shown to the PT as when a release was published."""
    try:
        return (
            subprocess.check_output(
                ["git", "log", "-1", "--format=%cs", tag], stderr=subprocess.DEVNULL
            )
            .decode()
            .strip()
        )
    except Exception:
        return ""


def build_version_manifest(tags, current=None):
    """The versions.json the app reads (data/versionCatalog.js). Releases are newest-first; `eol`
    is null because expiry is currently expressed by dropping a tag out of the hosted window."""
    releases = [
        {"id": tag, "path": f"{tag}/", "publishedAt": tag_date(tag), "eol": None}
        for tag in tags
    ]
    return {"current": current or (tags[0] if tags else None), "releases": releases}


def stamp_version_file(target_dir, commit, release, built_at=None):
    """Write version.js for one assembled copy. Mirrors build.stamp_build_version, but takes the
    release explicitly: a version folder is stamped with ITS tag, not the checked-out commit's."""
    built_at = built_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    with open(os.path.join(target_dir, "version.js"), "w", encoding="utf-8") as handle:
        handle.write(
            f'export const BUILD_INFO = {{ commit: "{commit}", builtAt: "{built_at}", release: "{release}" }};\n'
        )


def rewrite_base_href(target_dir, base):
    """GitHub Pages serves a project site under /<repo>/ (and a release under /<repo>/<tag>/), but
    the source assumes the domain root so it also works from localhost. Rewrite it per copy."""
    index_path = os.path.join(target_dir, "index.html")
    with open(index_path, encoding="utf-8") as handle:
        html = handle.read()
    html = html.replace('<base href="/">', f'<base href="{base}">')
    with open(index_path, "w", encoding="utf-8") as handle:
        handle.write(html)


def assemble_site(source_dir, target_dir, base, commit, release):
    """Assemble one complete copy of the app: files, version stamp, <base>, SPA 404 fallback and —
    LAST, so it covers the exact bytes served — the SHA-256 integrity catalog."""
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    shutil.copytree(source_dir, target_dir)
    stamp_version_file(target_dir, commit, release)
    rewrite_base_href(target_dir, base)
    # Pages serves 404.html for any path with no file, so shipping the shell there lets a deep link
    # to a clean route boot the app and resolve the route client-side.
    shutil.copyfile(
        os.path.join(target_dir, "index.html"), os.path.join(target_dir, "404.html")
    )
    generate_integrity_catalog(target_dir)


def export_tag_sources(tag, destination):
    """Materialise `src/` as it was at `tag`. The app is buildless, so a release folder is simply
    that commit's source — no toolchain from the past has to still work."""
    os.makedirs(destination, exist_ok=True)
    archive = subprocess.check_output(
        ["git", "archive", tag, "src"], stderr=subprocess.DEVNULL
    )
    with tempfile.NamedTemporaryFile(suffix=".tar") as tar_file:
        tar_file.write(archive)
        tar_file.flush()
        subprocess.check_call(["tar", "-xf", tar_file.name, "-C", destination])
    return os.path.join(destination, "src")


def publish_releases(dist_dir, base, commit, limit=SUPPORTED_RELEASE_COUNT):
    """Add one folder per supported tag under `dist_dir`, and write the manifest.

    Returns the tags published. With no tags this does nothing at all and writes no manifest —
    an app that advertises versions it does not host would offer a PT a 404, so the whole feature
    stays dormant until the first tag exists.
    """
    tags = list_release_tags(limit)
    if not tags:
        return []

    published = []
    for tag in tags:
        with tempfile.TemporaryDirectory() as workspace:
            try:
                sources = export_tag_sources(tag, workspace)
            except subprocess.CalledProcessError as error:
                print(
                    f"  ! Skipping release {tag}: could not export its sources ({error})"
                )
                continue
            if not os.path.isdir(sources):
                print(f"  ! Skipping release {tag}: it has no src/ directory")
                continue
            assemble_site(
                sources, os.path.join(dist_dir, tag), f"{base}{tag}/", commit, tag
            )
        published.append(tag)
        print(f"  Published release {tag} at {base}{tag}/")

    manifest = build_version_manifest(published)
    with open(
        os.path.join(dist_dir, VERSION_MANIFEST_NAME), "w", encoding="utf-8"
    ) as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print(f"  Wrote {VERSION_MANIFEST_NAME}: current={manifest['current']}")
    return published


def publish_site(dist_dir="dist", base="/", commit=None, limit=SUPPORTED_RELEASE_COUNT):
    """The whole published site: the current build at the root (the stable path a PT's bookmark
    keeps pointing at) plus one folder per supported release. Single entry point for the deploy, so
    the root copy and the versioned copies can never drift apart in how they are assembled."""
    from build import resolve_release_tag

    commit = commit or os.environ.get("GITHUB_SHA", "local")[:7]
    assemble_site("src", dist_dir, base, commit, resolve_release_tag())
    print(f"  Published the current build at {base}")
    return publish_releases(dist_dir, base, commit, limit)
