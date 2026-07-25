# tests/e2e/test_version_catalog.py
# The version catalog (TODO §16.1/§16.2): what the published manifest says exists, and what this
# build should therefore offer the PT — upgrade, rollback, or an end-of-support warning. Nothing
# here forces a switch; the trainer chooses the moment. These tests pin the offer rules, the
# manifest-is-the-authority-on-order decision, and the graceful "no manifest = nothing to offer"
# fallback that describes the deploy as it stands today.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE = "new URL('data/versionCatalog.js', document.baseURI).href"

CATALOG = """{
    current: 'v1.3.0',
    releases: [
        { id: 'v1.3.0', publishedAt: '2026-08-01', eol: null },
        { id: 'v1.2.0', publishedAt: '2026-07-01', eol: '2026-12-01' },
        { id: 'v1.1.0', publishedAt: '2026-06-01', eol: '2026-06-30' },
    ],
}"""


def _evaluate(page, body):
    return page.evaluate(
        "async () => { const m = await import(%s); %s }" % (MODULE, body)
    )


def test_no_manifest_offers_nothing(page, local_server):
    """Today's deploy publishes one version and no manifest — that must be a silent no-op."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const missing = await m.fetchVersionCatalog('./', {
            fetchImpl: async () => ({ ok: false }),
        });
        const broken = await m.fetchVersionCatalog('./', {
            fetchImpl: async () => { throw new Error('offline'); },
        });
        const malformed = await m.fetchVersionCatalog('./', {
            fetchImpl: async () => ({ ok: true, json: async () => ({ nope: true }) }),
        });
        return {
            missing,
            broken,
            malformed,
            offer: m.evaluateVersionOffer(null, { release: 'v1.2.0', installedReleases: [] }),
        };""",
    )

    assert r["missing"] is None
    assert r["broken"] is None, "being offline must never surface as an error"
    assert r["malformed"] is None
    assert r["offer"] == {"upgrade": None, "rollback": None, "eol": None}


def test_an_older_release_is_offered_the_current_one(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const offer = m.evaluateVersionOffer(%s, {
            release: 'v1.2.0',
            installedReleases: ['v1.2.0'],
            now: new Date('2026-08-05'),
        });
        return {
            upgrade: offer.upgrade?.id ?? null,
            rollback: offer.rollback?.id ?? null,
            eol: offer.eol?.id ?? null,
            path: m.releasePath(offer.upgrade),
        };"""
        % CATALOG,
    )

    assert r["upgrade"] == "v1.3.0"
    # Nothing to roll back to: v1.1.0 has no data on this device (and is past its EOL anyway).
    assert r["rollback"] is None
    assert r["eol"] is None
    assert r["path"] == "v1.3.0/", (
        "a release is served from its id as a path segment by default"
    )


def test_rollback_is_only_offered_for_data_that_exists_here(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const onCurrent = { release: 'v1.3.0', now: new Date('2026-08-05') };
        return {
            withData: m.evaluateVersionOffer(%s, { ...onCurrent, installedReleases: ['v1.3.0', 'v1.2.0'] }).rollback?.id ?? null,
            withoutData: m.evaluateVersionOffer(%s, { ...onCurrent, installedReleases: ['v1.3.0'] }).rollback?.id ?? null,
            pastEolOnly: m.evaluateVersionOffer(%s, { ...onCurrent, installedReleases: ['v1.3.0', 'v1.1.0'] }).rollback?.id ?? null,
            upgradeOnCurrent: m.evaluateVersionOffer(%s, { ...onCurrent, installedReleases: ['v1.3.0'] }).upgrade,
        };"""
        % (CATALOG, CATALOG, CATALOG, CATALOG),
    )

    assert r["withData"] == "v1.2.0"
    # No local bucket for a version means there is literally nothing to go back to.
    assert r["withoutData"] is None
    # An out-of-support release is not a rollback target, even with data present.
    assert r["pastEolOnly"] is None
    assert r["upgradeOnCurrent"] is None, (
        "the newest release is not offered an upgrade to itself"
    )


def test_running_a_release_past_its_end_of_support_is_flagged(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const offer = m.evaluateVersionOffer(%s, {
            release: 'v1.1.0',
            installedReleases: ['v1.1.0'],
            now: new Date('2026-08-05'),
        });
        return { eol: offer.eol?.id ?? null, upgrade: offer.upgrade?.id ?? null };"""
        % CATALOG,
    )

    assert r["eol"] == "v1.1.0"
    # An unsupported build is exactly where the upgrade invite matters most.
    assert r["upgrade"] == "v1.3.0"


def test_an_untagged_build_takes_no_part_in_switching(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """return m.evaluateVersionOffer(%s, { release: 'dev', installedReleases: ['v1.2.0'] });"""
        % CATALOG,
    )

    assert r == {"upgrade": None, "rollback": None, "eol": None}
