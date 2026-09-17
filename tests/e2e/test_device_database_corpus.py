# tests/e2e/test_device_database_corpus.py
# Frozen DEVICE databases (TODO §63): what an install's IndexedDB and localStorage actually held at a
# given point, restored byte for byte and booted by today's app. The backup corpus
# (tests/fixtures/backups/) proves files; this proves the phone.
#
# Each snapshot in tests/fixtures/devices/ carries its own store layout — names, key paths, indexes,
# the database version — so restoring it never depends on how today's code provisions a database.
# That is what lets a snapshot keep testing the same thing after the code that made it is gone.
# Never edit a snapshot; add one.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json
from pathlib import Path

import pytest

pytestmark = pytest.mark.clean_start

DEVICES = Path(__file__).resolve().parents[1] / "fixtures" / "devices"

# Rebuilds the snapshot's database exactly: same version, same stores, same indexes, same records.
RESTORE = """async ({ database, localStorage: stored }) => {
    await new Promise((resolve, reject) => {
        const request = indexedDB.open(database.name, database.version);
        request.onupgradeneeded = () => {
            const db = request.result;
            for (const store of database.stores) {
                const created = db.createObjectStore(store.name, {
                    keyPath: store.keyPath,
                    autoIncrement: store.autoIncrement,
                });
                for (const index of store.indexes) {
                    created.createIndex(index.name, index.keyPath, {
                        unique: index.unique,
                        multiEntry: index.multiEntry,
                    });
                }
            }
        };
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(database.stores.map((store) => store.name), 'readwrite');
            for (const store of database.stores) {
                for (const record of store.records) tx.objectStore(store.name).put(record);
            }
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
    for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value);
}"""

LOADED = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = s.getState();
    return {
        clients: (state.clients || []).length,
        series: (state.sessionSeries || []).map((rule) => rule.id),
        invites: (state.invites || []).map((invite) => invite.id),
        cancelled: (state.sessions || []).filter((row) => row.cancelled).map((row) => row.id),
    };
}"""


def _boot_snapshot(page, local_server, name, read_schema=None):
    snapshot = json.loads((DEVICES / name).read_text())
    if read_schema is not None:
        # The one thing a test may add: which schema this install reads, as a trainer's choice would.
        snapshot["localStorage"]["librept_read_schema"] = read_schema
    # A same-origin page that is not the app, so the database is in place before the app first opens it.
    page.goto(local_server + "index.css")
    page.evaluate(RESTORE, snapshot)
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).length > 0;
        }"""
    )
    return page.evaluate(LOADED)


def test_every_device_snapshot_is_booted_here():
    """A snapshot added to the folder but not booted below would stop being tested unnoticed."""
    booted = {"p_era_install.json"}
    assert {path.name for path in DEVICES.glob("*.json")} == booted


def test_a_p_era_install_keeps_its_repeating_sessions_invitations_and_cancelled_evenings(
    page, local_server
):
    """An install from before schema 4 became live (TODO §61) holds `sessionSeries` and `invites` in
    its P store alone. Whatever schema the app reads, the trainer's rules of repeating sessions,
    the invitations they sent and the evenings they cancelled must all still be there."""
    loaded = _boot_snapshot(page, local_server, "p_era_install.json")

    assert loaded["clients"] == 8
    assert loaded["series"] == ["ser01f2e3"], "the repeating-session rule was lost"
    assert loaded["invites"] == ["snapInvite01"], "the sent invitation was lost"
    assert "snapCancelled01" in loaded["cancelled"], "the cancelled evening came back"


def test_a_p_era_install_read_at_schema_4_keeps_them_too(page, local_server):
    """Schema 4 is the live schema (TODO §61). Before the P → 4 transfer (src/data/previewTransfer.js)
    an install reading schema 4 found no repeating-session rule and no invitation, because an older
    build had written both into its P store alone — measured on this snapshot 2026-09-17."""
    loaded = _boot_snapshot(page, local_server, "p_era_install.json", read_schema="4")

    assert loaded["series"] == ["ser01f2e3"], (
        "the repeating-session rule did not reach schema 4"
    )
    assert loaded["invites"] == ["snapInvite01"], (
        "the sent invitation did not reach schema 4"
    )
    assert "snapCancelled01" in loaded["cancelled"]
