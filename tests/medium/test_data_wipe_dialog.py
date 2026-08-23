# tests/medium/test_data_wipe_dialog.py
# The support data-wipe (TODO §31) — the link support sends by SMS when a trainer's install is stuck,
# and the dialog that is the whole of its authority.
#
# What would be erased is planned without a browser in tests/unit_js/data/dataWipe.test.mjs. What
# needs the DOM is the boundary itself: arriving erases nothing, the trainer is shown what is on THIS
# device including stores this build never heard of, they are told what the app cannot reach, and the
# erase only happens on their own second tap.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { initDataWipeDialog, openDataWipeDialog } from './modules/common/dataWipeDialog.js';
""",
    view_id="clients",
    body="""
// A device that has been around: two schema stores, one of them from a build this one has never
// heard of, plus the meta store and this app's own browser keys.
window.__cleared = null;
window.__removed = null;
window.__reloaded = 0;

initDataWipeDialog({
  t,
  storeNames: () => ['schema4', 'schemaFROM_AN_OLDER_BUILD', 'meta'],
  localStorageKeys: () => ['librept_terms_accepted', 'somebody_elses_key'],
  clearStores: (names) => { window.__cleared = names; },
  removeKeys: (keys) => { window.__removed = keys; },
  reload: () => { window.__reloaded += 1; },
});
window.__open = () => openDataWipeDialog();
""",
)


def _open(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.evaluate("() => window.__open()")
    page.wait_for_selector("#dialog-data-wipe[open]")


def test_arriving_at_the_link_erases_nothing(page, local_server):
    """The link carries no authority: support can send it to anyone, and opening it can only ever
    open this dialog."""
    _open(page, local_server)

    assert page.evaluate("() => window.__cleared") is None
    assert page.evaluate("() => window.__reloaded") == 0
    expect(page.locator("#dialog-data-wipe")).to_be_visible()


def test_it_lists_what_is_on_this_device_including_what_this_build_never_made(
    page, local_server
):
    """A long-lived install accumulates stores from earlier builds, and "wipe my data" that left them
    behind would be a lie told to somebody already having a bad day."""
    _open(page, local_server)

    targets = page.locator("#data-wipe-targets .data-wipe-target")
    assert targets.count() == 3
    expect(page.locator("#data-wipe-targets")).to_contain_text(
        "schemaFROM_AN_OLDER_BUILD"
    )


def test_what_it_cannot_reach_is_said_every_time(page, local_server):
    """Downloaded backups, a Drive copy, an export already in somebody's mailbox. Stated
    unconditionally: omitted once "because this device has no Drive", it reads as a promise about the
    copy they emailed last week."""
    _open(page, local_server)

    unreachable = page.locator("#data-wipe-unreachable")
    expect(unreachable).to_contain_text("Drive")
    expect(unreachable).to_contain_text("Backup files")


def test_confirming_erases_what_was_ticked_and_nothing_of_anyone_else_s(
    page, local_server
):
    _open(page, local_server)

    page.click("#data-wipe-confirm")
    page.wait_for_function("() => window.__reloaded === 1")

    cleared = page.evaluate("() => window.__cleared")
    removed = page.evaluate("() => window.__removed")
    assert sorted(cleared) == ["meta", "schema4", "schemaFROM_AN_OLDER_BUILD"]
    # A stranger's key in the same origin is not ours to remove.
    assert removed == ["librept_terms_accepted"]


def test_a_target_the_trainer_unticks_survives(page, local_server):
    """Deselecting is for the rarer case where support wants one store kept to look at — which is
    also why everything starts ticked."""
    _open(page, local_server)

    page.uncheck("[data-wipe-target='schema4']")
    page.click("#data-wipe-confirm")
    page.wait_for_function("() => window.__reloaded === 1")

    assert "schema4" not in page.evaluate("() => window.__cleared")


def test_erasing_nothing_is_not_offered(page, local_server):
    """A button that would do nothing must not look ready to do something."""
    _open(page, local_server)

    for store in ("schema4", "schemaFROM_AN_OLDER_BUILD", "unversioned"):
        page.uncheck(f"[data-wipe-target='{store}']")

    expect(page.locator("#data-wipe-confirm")).to_be_disabled()
