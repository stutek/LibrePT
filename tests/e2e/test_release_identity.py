# tests/e2e/test_release_identity.py
# The release identity (TODO §16) — the git tag a build was cut from — is what versioned hosting,
# per-version storage namespacing and the upgrade/rollback flow key off. These tests cover the pure
# model (normalisation, the untagged fallback, the label the header shows) plus the header stamp
# that renders it. Exercised through the served module so it runs against the real app, not a copy.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_release_normalisation_rejects_unusable_tags(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/releaseIdentity.js', document.baseURI).href;
            const m = await import(url);
            return {
                tag: m.normalizeRelease('v1.2.0'),
                trimmed: m.normalizeRelease('  v1.2.0  '),
                empty: m.normalizeRelease(''),
                missing: m.normalizeRelease(undefined),
                traversal: m.normalizeRelease('../evil'),
                slashed: m.normalizeRelease('release/1.0'),
                spaced: m.normalizeRelease('v1 0'),
                unreleased: m.UNRELEASED,
            };
        }"""
    )

    assert r["tag"] == "v1.2.0"
    assert r["trimmed"] == "v1.2.0", (
        "surrounding whitespace in a tag is not a different release"
    )
    # A release id becomes a storage-key suffix and a URL path segment, so anything that could
    # escape either is refused outright rather than escaped — it falls back to the untagged bucket.
    assert r["empty"] == r["unreleased"]
    assert r["missing"] == r["unreleased"]
    assert r["traversal"] == r["unreleased"]
    assert r["slashed"] == r["unreleased"]
    assert r["spaced"] == r["unreleased"]


def test_untagged_build_opts_out_of_version_switching(page, local_server):
    """The checked-in version.js ships release "dev": it runs, but takes no part in switching."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/releaseIdentity.js', document.baseURI).href;
            const m = await import(url);
            return { current: m.currentRelease(), released: m.isReleasedBuild(), label: m.releaseLabel() };
        }"""
    )

    assert r["current"] == "dev"
    assert r["released"] is False
    assert r["label"] == "dev"


def test_header_stamp_shows_the_release_label(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-version")
    page.wait_for_timeout(300)

    stamp = page.locator("#app-version")
    assert stamp.inner_text().strip() == "dev", (
        "the header stamp always names the build the PT is on"
    )
