# tests/e2e/test_demo_cleanup.py
# Clearing demo data in the fully booted app, against the real IndexedDB engine.
#
# The planning rules are pinned as pure logic (tests/unit_js/data/demoDataRemoval.test.mjs) and the
# confirmation screen at the component tier (tests/medium/test_demo_cleanup_dialog.py). What only a
# real boot can show is the half both of those stub out: that a removal actually PERSISTS. The write
# goes through star-write's stale-id reconciliation, which is the only thing that deletes a dropped
# record from every live schema store — an in-memory filter that never reached storage would satisfy
# every assertion at the tiers below and still leave the demo clients back on the next reload.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest


def _state(page):
    return page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const state = store.getState();
            return {
                clients: state.clients.map((c) => c.name),
                exercises: state.exercises.length,
                routines: state.routines.map((r) => r.name),
                sessions: state.sessions.length,
                history: state.history.length,
            };
        }"""
    )


def _boot_with_demo_and_real_work(page, local_server):
    """Demo data loaded, then a real client and a real routine built on a seeded exercise —
    the exact situation a trainer is in when the demo becomes a stain."""
    # The demo dataset arrives via conftest's autouse ?init=demo_data_load injection.
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(400)

    page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const { newRecordId } = await import(new URL('data/recordId.js', document.baseURI).href);
            const state = store.getState();
            const seededExerciseId = state.exercises[0].id;
            state.clients.push({ id: newRecordId(), name: 'Real Client', active: true });
            state.routines.push({
                id: newRecordId(),
                name: 'My Real Programme',
                exercises: [{ id: seededExerciseId, sets: 3, reps: 5 }],
            });
            store.saveToLocalStorage();
        }"""
    )
    page.wait_for_timeout(300)


def test_removal_survives_a_reload(page, local_server):
    _boot_with_demo_and_real_work(page, local_server)

    before = _state(page)
    assert "Real Client" in before["clients"]
    assert len(before["clients"]) > 1, "the demo clients are there to begin with"

    result = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.removeDemoData();
        }"""
    )
    assert result["ok"] is True
    page.wait_for_timeout(400)

    page.reload()
    page.wait_for_timeout(700)
    after = _state(page)

    # The whole point: the demo clients are gone from STORAGE, not just from the page that ran it.
    assert after["clients"] == ["Real Client"], (
        f"only the trainer's own client survives a reload, got {after['clients']}"
    )
    assert "My Real Programme" in after["routines"]
    assert after["exercises"] == before["exercises"], (
        "the movement catalog is kept — the real routine is built out of it"
    )
    assert after["history"] == 0 and after["sessions"] == 0, (
        "the fake training records and fake sessions go"
    )


@pytest.mark.clean_start
def test_a_database_with_no_demo_data_has_nothing_to_remove(page, local_server):
    """The affordance must not offer to delete something on a clean install — a trainer who never
    loaded the demo pressing 'clear demo data' should be a no-op, not a scare."""
    page.goto(local_server)
    page.wait_for_timeout(500)

    removable = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const { hasRemovableDemoData } = await import(
                new URL('data/demoDataRemoval.js', document.baseURI).href
            );
            return hasRemovableDemoData(store.getState());
        }"""
    )
    assert removable is False
