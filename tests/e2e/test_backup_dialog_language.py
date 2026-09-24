# tests/e2e/test_backup_dialog_language.py
# The Sync & Backup dialog (src/modules/common/backupRestore.js) speaks the language the trainer
# chose (TODO §38.20). E2E because the words reach the markup through the app's own translation
# pass (i18n/domMappings.js), which a mounted dialog does not run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

from tests.e2e.test_backup_restore import LEGACY_BACKUP, _import
from tests.e2e.test_client_views_language import _expect_slovenian, _slovenian

# Each control, and the key whose words it must show.
BACKUP_DIALOG = {
    "#dialog-backup .modal-header h3": "backup_center",
    "#drive-sync-title": "drive_sync_title",
    "#btn-export-db": "btn_export_json",
    "#backup-import-title": "backup_import_title",
    "#btn-restore-cancel": "restore_keep",
    "#btn-restore-confirm": "restore_replace",
}


def test_the_backup_dialog_is_in_slovenian_when_slovenian_is_chosen(page, local_server):
    page.goto(local_server + "?lang=sl")
    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")

    _expect_slovenian(page, BACKUP_DIALOG)


def test_a_declined_restore_says_so_in_slovenian(page, local_server):
    """Written by code after the trainer keeps what they have (TODO §38.20)."""
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")

    _import(page, LEGACY_BACKUP, confirm=False)

    [nothing_changed] = _slovenian(page, ["restore_nothing_changed"])
    expect(page.locator("#import-status")).to_have_text(nothing_changed)
