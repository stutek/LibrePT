# tests/e2e/test_live_record_forms.py
# The client, exercise and routine dialogs write into their record as it is typed (TODO §50.2,
# src/modules/common/liveRecordForm.js), and a record counts as a local change only once its dialog
# is left (src/data/openRecordEdits.js).
#
# E2E because the promises are about the real store: what a reload finds in IndexedDB, and what the
# header's ahead count reads against a synced ancestor. A mounted form with a fake state could prove
# neither.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

from tests.e2e.test_sync_backup import SEED_ANCESTOR_TO_CURRENT_STATE

STORE_HAS_CLIENTS = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    return (s.getState().clients || []).length > 0;
}"""

RECORD_NAMED = """async ([collection, name]) => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    return (s.getState()[collection] || []).find((record) => record.name === name) || null;
}"""


def _open_clients(page, local_server):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(STORE_HAS_CLIENTS)


def _record(page, collection, name):
    return page.evaluate(RECORD_NAMED, [collection, name])


def _ahead_label(page):
    return page.locator("#sync-badge").get_attribute("aria-label") or ""


def test_a_client_typed_but_not_finished_survives_a_reload(page, local_server):
    _open_clients(page, local_server)
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Reload Survivor")
    page.locator("#client-notes").fill("Left knee.")
    # The store is written behind the typing (data/writeQueue.js). A reload in the same instant as the
    # last keystroke loses that keystroke — the window TODO §50.2 records — so this waits it out.
    page.evaluate(
        """async () => {
            const q = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await q.flushWrites();
        }"""
    )

    page.reload()
    page.wait_for_function(STORE_HAS_CLIENTS)

    client = _record(page, "clients", "Reload Survivor")
    assert client is not None, (
        "what was typed before the reload must already be in the store"
    )
    assert client["notes"] == "Left knee."


def test_an_empty_required_field_is_written_as_a_placeholder(page, local_server):
    _open_clients(page, local_server)
    page.locator("#btn-add-client").click()
    page.locator("#client-phone").fill("+386 40 000 111")
    page.locator("#dialog-client button[type='submit']").click()
    expect(page.locator("#dialog-client")).to_be_hidden()

    client = _record(page, "clients", "New client")
    assert client is not None, "a client without a name is kept, under the placeholder"
    assert client["phone"] == "+386 40 000 111"

    page.goto(local_server + "routines/new")
    page.wait_for_selector("#dialog-routine[open]")
    page.locator("#routine-ex-picker .picker-item").first.click()
    page.locator(".routine-builder-row .input-sets").fill("")
    routine = _record(page, "routines", "New routine")
    assert routine is not None
    assert routine["exercises"][0]["sets"] == 3, (
        "an emptied set count is written as the default"
    )


def test_a_client_counts_as_a_local_change_only_once_its_dialog_is_left(
    page, local_server
):
    _open_clients(page, local_server)
    page.evaluate(SEED_ANCESTOR_TO_CURRENT_STATE)

    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Counted Later")
    assert _record(page, "clients", "Counted Later") is not None
    assert _ahead_label(page).startswith("0 local changes"), (
        "a client still being typed is already stored, but must not count yet"
    )

    page.locator("#dialog-client button[type='submit']").click()
    expect(page.locator("#sync-badge .sync-ahead")).to_have_text("1")


def test_cancel_undoes_an_edit_and_removes_a_client_being_added(page, local_server):
    _open_clients(page, local_server)

    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Never Meant")
    assert _record(page, "clients", "Never Meant") is not None
    page.locator("#dialog-client .modal-cancel").click()
    assert _record(page, "clients", "Never Meant") is None

    page.locator(".client-card").first.click()
    page.locator("#btn-edit-client").click()
    name_before = page.locator("#client-name").input_value()
    page.locator("#client-name").fill("Typed Over")
    assert _record(page, "clients", "Typed Over") is not None
    page.locator("#dialog-client .modal-cancel").click()

    assert _record(page, "clients", "Typed Over") is None
    assert _record(page, "clients", name_before) is not None


def test_closing_with_the_cross_keeps_what_was_typed(page, local_server):
    _open_clients(page, local_server)
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Kept By Cross")
    page.locator("#dialog-client .modal-close-btn").click()
    expect(page.locator("#dialog-client")).to_be_hidden()

    assert _record(page, "clients", "Kept By Cross") is not None


def test_a_client_typed_and_erased_again_is_not_kept(page, local_server):
    _open_clients(page, local_server)
    count_before = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return s.getState().clients.length;
        }"""
    )
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("x")
    page.locator("#client-name").fill("")
    page.locator("#dialog-client button[type='submit']").click()

    count_after = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return s.getState().clients.length;
        }"""
    )
    assert count_after == count_before


def test_an_exercise_and_a_routine_are_in_the_store_before_done(page, local_server):
    _open_clients(page, local_server)

    page.goto(local_server + "exercises/new")
    page.wait_for_selector("#dialog-exercise[open]")
    page.locator("#exercise-name").fill("Live Lunge")
    exercise = _record(page, "exercises", "Live Lunge")
    assert exercise is not None
    assert exercise["category"], (
        "the muscle group starts on a value, so it is written too"
    )

    page.goto(local_server + "routines/new")
    page.wait_for_selector("#dialog-routine[open]")
    page.locator("#routine-name").fill("Live Routine")
    page.locator("#routine-ex-picker .picker-item").first.click()
    page.wait_for_selector(".routine-builder-row")

    routine = _record(page, "routines", "Live Routine")
    assert routine is not None
    assert len(routine["exercises"]) == 1, (
        "adding a row types nothing, but it is still written"
    )
