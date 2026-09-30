# tests/e2e/test_backup_dialog_language.py
# The Sync & Backup dialog (src/modules/common/backupRestore.js) speaks the language the trainer
# chose. E2E because the words reach the markup through the app's own translation
# pass (i18n/domMappings.js), which a mounted dialog does not run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

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
    """Written by code after the trainer keeps what they have."""
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")

    _import(page, LEGACY_BACKUP, confirm=False)

    [nothing_changed] = _slovenian(page, ["restore_nothing_changed"])
    expect(page.locator("#import-status")).to_have_text(nothing_changed)


def test_what_a_restore_would_replace_is_named_in_slovenian(page, local_server):
    """The part of the prompt a trainer decides on — what they lose — was the English collection
    keys of the code: "2 clients, 1 routines, 1 planUpdates"."""
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")
    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[
            {
                "name": "librept_backup.json",
                "mimeType": "application/json",
                "buffer": json.dumps(LEGACY_BACKUP).encode(),
            }
        ],
    )
    detail = page.locator("#restore-confirm-detail")
    detail.wait_for(state="visible")
    text = detail.inner_text()
    for english in ["clients", "routines", "sessions", "planUpdates", "history"]:
        assert english not in text, text
    assert "strank" in text


def _choose_file(page, name, content):
    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[{"name": name, "mimeType": "application/json", "buffer": content}],
    )


def test_a_file_that_is_not_a_backup_is_refused_in_slovenian(page, local_server):
    """It answered "Error: Invalid backup file format." in English, in a Slovenian app."""
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")

    _choose_file(page, "seznam.json", json.dumps({"seznam": ["kruh"]}).encode())

    [refused] = _slovenian(page, ["restore_invalid_file"])
    expect(page.locator("#import-status")).to_have_text(refused)
    assert "Error" not in page.locator("#import-status").inner_text()


def test_a_file_that_is_not_json_is_refused_in_slovenian(page, local_server):
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")

    _choose_file(page, "seznam.json", b"kruh, mleko")

    [refused] = _slovenian(page, ["restore_invalid_file"])
    expect(page.locator("#import-status")).to_have_text(refused)


def test_a_backup_of_a_newer_format_is_refused_in_slovenian(page, local_server):
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card")

    _choose_file(
        page, "nova.json", json.dumps({"formatVersion": 999, "clients": []}).encode()
    )

    status = page.locator("#import-status")
    expect(status).not_to_have_text("")
    text = status.inner_text()
    assert "LibrePT" in text and "cannot open" not in text and "Error" not in text, text
