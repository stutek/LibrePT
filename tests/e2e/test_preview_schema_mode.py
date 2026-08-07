# tests/e2e/test_preview_schema_mode.py
#
# !!! SPEC-FIRST: THE FEATURE THIS TESTS DOES NOT EXIST YET. THIS FILE IS RED. !!!
# Do not commit it until src/data/previewSchema.js lands — the gate requires green (AGENT_RULES
# §2.A.3), so a red file on `main` blocks every other commit, not just this work.
#
# A trainer opts into a preview build's data shape, works normally, and opts back out. NO SEQUENCE
# OF TOGGLES MAY LOSE A RECORD. That rests on three decisions, each pinned separately below because
# each fails differently:
#
#   * reads are pinned to a DECLARED schema (READ_SCHEMA), never derived from registry membership
#     — so preview can never become canonical by accident;
#   * writes star-fan-out to every provisioned store and compare no versions — so data written in
#     preview is ALREADY in the canonical store, and switching back needs no migration at all;
#   * the preview store is its own IndexedDB database keyed by BUILD_INFO.commit — so dropping it
#     is atomic, costs the real database nothing, and is never data loss.
#
# The consequence worth stating plainly: SWITCHING BACK TO STABLE IS NOT A MIGRATION. It is a read
# re-point plus a database delete. Only switching TO preview projects anything.
#
# Why e2e and not the medium tier this was first asked for: the subject IS IndexedDB persistence
# across a mode switch and a reload. tests/medium/ mounts one component with no IndexedDB, no
# persistence and no router (tests/medium/_harness.py) — there is no version of this test that fits
# that tier. It belongs beside test_indexed_db_engine.py, which pins the same layer.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

# The API these tests fix, none of which exists yet:
#
#   src/data/previewSchema.js
#     PREVIEW_DB_NAME       = "librept-preview"
#     PRODUCED_BY_META_KEY  = "producedBy"  — the BUILD_INFO.commit that projected the store
#     COMPLETE_META_KEY     = "complete"    — written in the SAME transaction as the records, so an
#                                             interrupted projection cannot leave it set
#     enablePreview()   — provision, project from the READ_SCHEMA store, re-point reads
#     disablePreview()  — re-point reads back, then deleteDatabase(PREVIEW_DB_NAME)
#     isPreviewEnabled()
PREVIEW_DB_NAME = "librept-preview"

COLLECTIONS = (
    "clients",
    "exercises",
    "routines",
    "history",
    "planUpdates",
    "sessions",
    "notifications",
)

pytestmark = pytest.mark.clean_start


def _import_preview(page):
    """Every evaluate below needs both modules; kept in one place so the import path is stated once."""
    return """
        const store = await import(new URL('data/stateStore.js', document.baseURI).href);
        const preview = await import(new URL('data/previewSchema.js', document.baseURI).href);
        const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
    """


def _seed_one_record_per_collection(page):
    """One record in every collection, so a loss in any single bucket fails the test rather than
    only being caught for whichever collection a narrower fixture happened to cover."""
    page.evaluate(
        """async () => {
            %s
            const state = store.getState();
            state.clients.push({ id: 'p-client', name: 'Preview Client', active: true });
            state.exercises.push({ id: 'p-exercise', name: 'Preview Lift', category: 'Custom' });
            state.routines.push({ id: 'p-routine', name: 'Preview Plan', exercises: [] });
            state.history.push({ id: 'p-history', clientId: 'p-client', clientName: 'Preview Client',
                                 date: new Date().toISOString(), duration: 60, exercises: [] });
            state.planUpdates.push({ id: 'p-update', clientId: 'p-client', status: 'pending' });
            state.sessions.push({ id: 'p-session', title: 'Preview Session', time: '09:00 - 10:00',
                                  startDate: new Date().toISOString(), participants: [],
                                  maxCapacity: 1, day: 'today' });
            state.notifications.push({ id: 'p-notification', titleKey: 'preview', read: false });
            store.setState(state);
            store.saveToLocalStorage();
            await queue.flushWrites();
        }"""
        % _import_preview(page)
    )


def _ids_present(page):
    """The id set per collection, read through the app's own canonical path — never the preview
    store, which is exactly the thing under suspicion."""
    return page.evaluate(
        """async () => {
            %s
            const state = store.getState();
            const out = {};
            for (const key of %s) out[key] = (state[key] || []).map((r) => r.id);
            return out;
        }"""
        % (_import_preview(page), list(COLLECTIONS))
    )


def _preview_db_exists(page):
    """Open-probe rather than indexedDB.databases(): that API is not available everywhere, and a
    probe answers the question the test actually asks — is there a store still holding data."""
    return page.evaluate(
        """async () => {
            const existing = await new Promise((resolve) => {
                let found = true;
                const req = indexedDB.open('%s');
                req.onupgradeneeded = () => { found = false; };  // created by this very probe
                req.onsuccess = () => { req.result.close(); resolve(found); };
                req.onerror = () => resolve(false);
            });
            if (!existing) {
                await new Promise((r) => { const d = indexedDB.deleteDatabase('%s'); d.onsuccess = d.onerror = () => r(); });
            }
            return existing;
        }"""
        % (PREVIEW_DB_NAME, PREVIEW_DB_NAME)
    )


def test_a_round_trip_through_preview_loses_no_record_in_any_collection(
    page, local_server
):
    """Opt in, work (create AND delete), opt out — every collection intact. The delete matters as
    much as the create: a fan-out that only ever puts would leave a deleted record alive in the
    canonical store and resurrect it on the way back."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )
    _seed_one_record_per_collection(page)

    page.evaluate(
        """async () => {
            %s
            const state = store.getState();
            state.clients = state.clients.filter((c) => c.id !== 'p-client');
            store.setState(state);
            store.saveToLocalStorage();
            await queue.flushWrites();
        }"""
        % _import_preview(page)
    )

    page.evaluate(
        "async () => { %s; await preview.disablePreview(); }" % _import_preview(page)
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    ids = _ids_present(page)
    assert "p-client" not in ids["clients"], (
        "a record deleted while in preview must stay deleted after opting out"
    )
    assert "p-exercise" in ids["exercises"]
    assert "p-routine" in ids["routines"]
    assert "p-history" in ids["history"]
    assert "p-update" in ids["planUpdates"]
    assert "p-session" in ids["sessions"]
    assert "p-notification" in ids["notifications"]


def test_opting_out_wipes_the_preview_database(page, local_server):
    """Not merely unreferenced — GONE. A preview store left behind by one build must never be
    readable by a later one, which is the whole reason it is keyed by BUILD_INFO.commit."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )
    assert _preview_db_exists(page) is True, (
        "opting in must provision the preview database"
    )

    page.evaluate(
        "async () => { %s; await preview.disablePreview(); }" % _import_preview(page)
    )
    assert _preview_db_exists(page) is False, (
        "opting out must delete the preview database, not just stop reading it"
    )


def test_re_opting_in_rebuilds_from_canonical_including_data_created_while_off(
    page, local_server
):
    """The second opt-in is a fresh projection, not a resumption of the first — so it must contain
    records that only ever existed while preview was off."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )
    page.evaluate(
        "async () => { %s; await preview.disablePreview(); }" % _import_preview(page)
    )

    _seed_one_record_per_collection(page)  # created with preview OFF

    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )

    # Read the PREVIEW store itself, not in-memory state: state still holds these records from
    # having just written them, so asserting against it would pass on an empty preview store —
    # i.e. it would assert nothing about the rebuild this test exists for.
    preview_ids = page.evaluate(
        """async () => {
            %s
            const records = await preview.readPreviewRecords();
            return records.map((r) => r.id);
        }"""
        % _import_preview(page)
    )
    assert "p-client" in preview_ids, (
        "re-opting in must re-project records created while preview was off"
    )
    assert "p-session" in preview_ids
    assert "p-exercise" in preview_ids


def test_a_preview_store_from_another_build_is_dropped_and_re_projected(
    page, local_server
):
    """Keyed by BUILD_INFO.commit: a store this build did not produce is rebuilt, never reused."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")
    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )

    page.evaluate(
        """async () => {
            %s
            await preview.__setProducedByForTest('some-other-sha');
        }"""
        % _import_preview(page)
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    produced_by = page.evaluate(
        """async () => { %s; return preview.__producedByForTest(); }"""
        % _import_preview(page)
    )
    assert produced_by != "some-other-sha", (
        "a preview store built by a different build must be re-projected, not adopted"
    )


def test_an_interrupted_projection_is_discarded_and_redone_on_next_start(
    page, local_server
):
    """RESTARTABLE, NOT RESUMABLE. The projection is one transaction, so an interruption leaves
    nothing behind to resume from — the correct recovery is to rebuild from the canonical store,
    which is intact by construction. This is why there is no progress state to persist, and why
    chunking it behind an 'X of Y' progress bar would REMOVE this property rather than report on it.
    """
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")
    page.evaluate(
        "async () => { %s; await preview.enablePreview(); }" % _import_preview(page)
    )

    # A preview database that exists but was never marked complete — exactly what a kill mid-write
    # leaves behind, since `complete` is written in the same transaction as the records.
    page.evaluate(
        """async () => { %s; await preview.__clearCompleteMarkerForTest(); }"""
        % _import_preview(page)
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    state_after = page.evaluate(
        """async () => {
            %s
            return { complete: await preview.__isCompleteForTest(), clients: store.getState().clients.length };
        }"""
        % _import_preview(page)
    )
    assert state_after["complete"] is True, (
        "an incomplete preview store must be rebuilt on the next start"
    )
    assert state_after["clients"] > 0, (
        "canonical data must be untouched by the interruption"
    )
