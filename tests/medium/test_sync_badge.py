# tests/medium/test_sync_badge.py
# The header's Sync & Backup control: the ahead/behind change badge in its never-synced state, and
# the backup dialog it opens. Both are pure header surface, so they mount on
# tests/medium/_harness.py's HEADER_STUB.
#
# The two OTHER tests in the e2e original stay there deliberately: they drive real client creation
# through the form and assert the count reflects it, which is the whole point of TODO §3.9 — that
# `onStateSaved` at the stateStore seam catches every writer, including call sites that bypass
# app.js's save wrapper. That claim is only meaningful against the real store, so a mounted
# component with a fake state would assert nothing.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# app.js renders the badge at the end of init() (and re-renders it from the onStateSaved /
# onSyncCountsChanged seams). Neither runs here, so the stub renders it once explicitly.
# `renderSyncBadge` is already imported by HEADER_STUB (it hands the real one to bootDriveSyncUi, so
# a sync starting or failing repaints the cloud). Re-importing it here would be a duplicate binding
# in the same module — a SyntaxError that silently leaves nothing mounted at all.
STUB = HEADER_STUB + "\nrenderSyncBadge();\n"


def test_sync_badge_shows_real_zero_ahead_and_unknown_behind_before_any_sync(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    badge = page.locator("#sync-badge")
    assert badge.is_visible()
    assert "hidden" not in (badge.get_attribute("class") or "")

    # Ahead is 0 here because this store is genuinely EMPTY (clean_start), not because no sync has
    # run. That distinction became load-bearing on 2026-08-12: getAheadCount() used to short-circuit
    # to 0 whenever there was no ancestor, and now counts the whole dataset instead, so "never
    # synced" no longer implies 0 — only "no records" does. A store with content and no ancestor
    # reports all of it (tests/e2e/test_sync_backup.py pins that half, which needs the real store).
    # Behind is still genuinely unknown ("?") rather than a fabricated number.
    assert page.locator("#sync-badge .sync-zero").inner_text().strip() == "0"
    aria = badge.get_attribute("aria-label")
    assert "0 local changes to push" in aria
    assert "cloud status unknown" in aria


def test_counters_are_legible_and_grow_on_desktop(page, local_server):
    """The counts must be readable on both form factors.

    They shipped at 10px with 9px arrows — AGENT_RULES §2.D's own example of what not to do ("9px of
    text is nothing to aim at") — in the surface a trainer checks to know whether their work is safe.

    The desktop half is pinned because its media query is `(min-width: 700px) and (pointer: fine)`,
    and the pointer clause is easy to get silently wrong: a rule that never matches would leave the
    desktop path shipped but unexercised. Width alone would be the wrong test anyway, since a phone
    in landscape clears 700px and is exactly where vertical space is scarcest.
    """
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    def badge_font_px():
        return page.evaluate(
            "parseFloat(getComputedStyle(document.querySelector('#sync-badge')).fontSize)"
        )

    page.set_viewport_size({"width": 390, "height": 844})
    assert badge_font_px() >= 12, "phone counters must clear the 9px anti-pattern"

    page.set_viewport_size({"width": 1440, "height": 900})
    assert badge_font_px() >= 14, (
        "desktop step did not apply — check the pointer media query"
    )
    header_height = page.evaluate(
        "getComputedStyle(document.documentElement).getPropertyValue('--hdr-height').trim()"
    )
    assert header_height == "76px", (
        f"expected the taller desktop header, got {header_height}"
    )


def test_an_unconnected_cloud_is_informational_not_a_warning(page, local_server):
    """With no Drive grant the header shows a muted slashed cloud — never an ✕, never warning
    colour (TODO §3.11).

    PRIVACY.md tells trainers that local-first is the point, so declining cloud sync is a supported
    choice; painting it as a fault would spend the warning vocabulary that TODO §3.8's real hazard
    and a genuine sync failure need. The colour is asserted by comparison — cloud and slash agree,
    and neither is the danger token — rather than against a literal hex, so a theme may restyle both
    and only a warning-coloured regression fails.
    """
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    icon = page.locator("#sync-cloud-icon")
    assert icon.locator(".fa-slash").count() == 1, (
        "expected a slashed cloud when not connected"
    )

    cloud_color, slash_color, danger = page.evaluate(
        """() => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--danger)';
            document.body.appendChild(probe);
            const danger = getComputedStyle(probe).color;
            probe.remove();
            return [
              getComputedStyle(document.querySelector('#sync-cloud-icon .fa-cloud')).color,
              getComputedStyle(document.querySelector('#sync-cloud-overlay')).color,
              danger,
            ];
        }"""
    )
    assert slash_color == cloud_color, (
        "a bright cloud under a grey slash reads as connected — both must mute together"
    )
    assert slash_color != danger, "not-connected must not borrow the warning colour"

    # The meaning is spoken, not left to the shape: on a phone there is no hover to reveal it, and
    # a screen reader gets nothing from an aria-hidden glyph (AGENT_RULES §2.D.1).
    label = page.locator("#backup-btn").get_attribute("aria-label")
    assert "not connected" in label.lower(), (
        f"header cloud says nothing about its state: {label}"
    )


def _load_connected(page, local_server):
    """Mount the header with Drive sync reporting CONNECTED, without an OAuth grant.

    `hasStoredConsent()` is a localStorage flag, so the connected branch — unreachable to every
    browser tier through the real consent flow, since Google fingerprints and blocks automated
    browsers — is reachable by seeding it. Google's script host is aborted so the token request
    fails immediately and offline: this tier must not depend on `accounts.google.com` being up, and
    the failure it produces is exactly the state under test.
    """
    page.route("**/accounts.google.com/**", lambda route: route.abort())
    page.add_init_script("localStorage.setItem('librept_drive_connected', '1')")
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")


def test_a_connected_tap_syncs_instead_of_opening_the_dialog(page, local_server):
    """Connected, the header cloud is "sync now" — the dialog was an extra tap nobody needed
    (TODO §3.11), and it stays reachable from the ☰ menu.

    The sync attempted here cannot succeed (no real grant), which is what makes the second half
    assertable: the failure has to reach the glyph, because the dialog that used to report it is
    the one surface this tap no longer opens.
    """
    _load_connected(page, local_server)

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup").get_attribute("open") is None, (
        "a connected tap opened the dialog instead of syncing"
    )

    page.wait_for_function(
        "() => document.querySelector('#sync-cloud-icon')?.classList.contains('is-failed')"
    )
    label = page.locator("#backup-btn").get_attribute("aria-label")
    assert "failed" in label.lower(), f"the failure is shown but not spoken: {label}"


def test_the_menu_still_opens_the_dialog_while_connected(page, local_server):
    """The ☰ items must not inherit the header button's state-dependent behaviour.

    Both used to synthesise a click on `#backup-btn`, which was harmless while that button only
    ever opened the dialog. The moment it learned to sync, "Export data as a file" ran a sync and
    opened nothing — a menu item silently doing something else entirely. Only reachable in the
    CONNECTED state, which is why nothing caught it.
    """
    _load_connected(page, local_server)

    page.locator("#btn-app-menu").click()
    page.locator("#menu-export-data").click()

    dialog = page.locator("#dialog-backup")
    assert dialog.get_attribute("open") is not None, (
        "Export data as a file did not open the Sync & Backup dialog"
    )
    assert page.locator("#dialog-backup #btn-export-db").is_visible()


def test_backup_modal_opens_and_closes(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    dialog = page.locator("#dialog-backup")
    assert dialog.get_attribute("open") is None  # closed on load

    page.locator("#backup-btn").click()
    assert dialog.get_attribute("open") is not None
    assert dialog.is_visible()
    # The export/restore affordances are present in the opened modal.
    assert page.locator("#dialog-backup #btn-export-db").is_visible()

    page.locator("#dialog-backup .modal-close-btn").click()
    assert dialog.get_attribute("open") is None
