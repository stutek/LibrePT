# tests/e2e/test_version_messages.py
# The upgrade / rollback / end-of-support messages in the notification area (TODO §16.1), and the
# switch they perform. Two things these tests exist to hold: the invitations are NON-DISMISSABLE
# (no unread dot, no mark-as-read — a PT cannot make "you are on an unsupported build" go away by
# tapping it), and a switch COPIES the running release's data into the target's bucket before
# navigating, leaving the source untouched so a rollback still has something to return to.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE = "new URL('modules/common/versionMessages.js', document.baseURI).href"

CATALOG = """{
    current: 'v2.0.0',
    releases: [
        { id: 'v2.0.0', publishedAt: '2026-08-01', eol: null },
        { id: 'v1.0.0', publishedAt: '2026-06-01', eol: null },
    ],
}"""

# Renders into a detached container with an injected catalog and an explicit running release, so
# the UI is exercised without needing a genuinely tagged build. `basePath` is what a build served
# from /LibrePT/v1.0.0/ would see, which is what makes the sibling-path navigation meaningful.
SETUP = """
const m = await import(%s);
const container = document.createElement('div');
document.body.appendChild(container);
window.__navigated = null;
window.__confirmed = null;
m.initVersionMessages({
    t: (k) => ({
        version_upgrade_title: 'A new version is available',
        version_upgrade_desc: 'Version {version} is ready.',
        version_upgrade_btn: 'Switch to {version}',
        version_rollback_title: 'Go back to {version}',
        version_rollback_desc: 'Anything recorded since stays on {current}.',
        version_rollback_btn: 'Switch back',
        version_rollback_confirm: 'Switch back to {version}?',
        version_eol_title: 'This version is no longer supported',
        version_eol_desc: 'Fixes only land on {version}.',
    })[k] || k,
    escapeHTML: (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]),
    basePath: '%s',
    getCatalog: () => (%s),
    confirm: (msg) => { window.__confirmed = msg; return %s; },
    navigate: (url) => { window.__navigated = url; },
});
"""


def _setup(catalog=CATALOG, confirm="true", base_path="/LibrePT/v1.0.0/"):
    """`base_path` is where the RUNNING release is served from — the segment hostingRoot strips."""
    return SETUP % (MODULE, base_path, catalog, confirm)


def test_no_offer_renders_nothing(page, local_server):
    """The untagged build every install runs today must show no version chrome at all."""
    page.goto(local_server)
    page.wait_for_selector("#notification-list-container")
    page.wait_for_timeout(400)

    assert page.locator(".notification-card.version-offer").count() == 0


def test_the_upgrade_invitation_is_not_dismissable(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            %s
            m.renderVersionMessages(container, { release: 'v1.0.0' });
            const upgrade = container.querySelector('[data-version-message="version-upgrade"]');
            return {
                cards: container.querySelectorAll('.notification-card.version-offer').length,
                title: upgrade?.querySelector('.notification-card-title')?.textContent.trim(),
                action: upgrade?.querySelector('button[data-version-action]')?.textContent.trim(),
                unreadDots: container.querySelectorAll('.unread-dot').length,
                markable: container.querySelectorAll('[data-notification-id]').length,
            };
        }"""
        % _setup()
    )

    assert r["cards"] == 1
    assert r["title"] == "A new version is available"
    assert r["action"] == "Switch to v2.0.0"
    # Non-dismissable: no unread dot and no id the mark-as-read machinery could act on.
    assert r["unreadDots"] == 0
    assert r["markable"] == 0


def test_rollback_warns_about_what_stays_behind_before_switching(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            %s
            // On the current release, with data still present for the older one.
            localStorage.setItem('librept_db@v1.0.0', '{"clients":["old"]}');
            localStorage.setItem('librept_db@v2.0.0', '{"clients":["old","new"]}');
            m.renderVersionMessages(container, { release: 'v2.0.0' });

            const rollback = container.querySelector('[data-version-message="version-rollback"]');
            rollback?.querySelector('button[data-version-action]')?.click();
            return {
                title: rollback?.querySelector('.notification-card-title')?.textContent.trim(),
                confirmed: window.__confirmed,
                navigated: window.__navigated,
                oldBucket: localStorage.getItem('librept_db@v1.0.0'),
            };
        }"""
        % _setup(base_path="/LibrePT/v2.0.0/")
    )

    assert r["title"] == "Go back to v1.0.0"
    # The warning is shown BEFORE the switch, not discovered afterwards.
    assert r["confirmed"] == "Switch back to v1.0.0?"
    assert r["navigated"] == "/LibrePT/v1.0.0/"
    # v1.0.0 already holds data, so the copy is refused rather than overwriting the snapshot.
    assert r["oldBucket"] == '{"clients":["old"]}'


def test_a_declined_rollback_changes_nothing(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            %s
            localStorage.setItem('librept_db@v1.0.0', '{"clients":["old"]}');
            m.renderVersionMessages(container, { release: 'v2.0.0' });
            container
                .querySelector('[data-version-message="version-rollback"] button[data-version-action]')
                ?.click();
            return { navigated: window.__navigated, confirmed: window.__confirmed };
        }"""
        % _setup(confirm="false", base_path="/LibrePT/v2.0.0/")
    )

    assert r["confirmed"] is not None, "the PT was asked"
    assert r["navigated"] is None, "and declining leaves them exactly where they were"


def test_switching_copies_this_release_data_then_navigates(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            %s
            localStorage.setItem('librept_db@v1.0.0', '{"clients":["mine"]}');
            localStorage.removeItem('librept_db@v2.0.0');
            m.renderVersionMessages(container, { release: 'v1.0.0' });
            container
                .querySelector('[data-version-message="version-upgrade"] button[data-version-action]')
                ?.click();
            return {
                target: localStorage.getItem('librept_db@v2.0.0'),
                source: localStorage.getItem('librept_db@v1.0.0'),
                navigated: window.__navigated,
                confirmed: window.__confirmed,
            };
        }"""
        % _setup()
    )

    assert r["target"] == '{"clients":["mine"]}', (
        "the new release starts from the PT's real data"
    )
    # The bucket being left is untouched — that is what a later rollback returns to.
    assert r["source"] == '{"clients":["mine"]}'
    # A release is addressed as a sibling of the running one under the shared hosting root.
    assert r["navigated"] == "/LibrePT/v2.0.0/"
    assert r["confirmed"] is None, "an upgrade is not gated behind a data-loss warning"


def test_an_unsupported_build_says_so(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            %s
            m.renderVersionMessages(container, { release: 'v1.0.0' });
            const eol = container.querySelector('[data-version-message="version-eol"]');
            return {
                title: eol?.querySelector('.notification-card-title')?.textContent.trim(),
                action: eol?.querySelector('button[data-version-action]')?.textContent.trim(),
            };
        }"""
        % _setup(
            catalog="""{
                current: 'v2.0.0',
                releases: [
                    { id: 'v2.0.0', publishedAt: '2026-08-01', eol: null },
                    { id: 'v1.0.0', publishedAt: '2026-06-01', eol: '2020-01-01' },
                ],
            }"""
        )
    )

    assert r["title"] == "This version is no longer supported"
    # The way out is offered in the same breath as the warning.
    assert r["action"] == "Switch to v2.0.0"
