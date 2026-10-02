# tests/e2e/test_session_item_record.py
# A finished session is persisted as the WHOLE structured program — a flat list of typed
# items (exercise | rest) with circuit grouping via circuitId and a completed flag per exercise —
# not just the performed sets. What stays here needs the real, live-booted app: the re-open
# round-trip that rebuilds a live plan from the stored snapshot, through the real
# openSessionFromHistory controller. The History RENDER of that structure moved to
# tests/medium/test_history_structured_program.py, and the pure buildProgramSnapshot model to
# tests/unit_js/domain/sessionItemRecord.test.mjs.
# Fixtures (page, local_server) come from tests/conftest.py; the demo dataset is auto-seeded.


def _base(page):
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def test_reopening_a_structured_record_rebuilds_rests_and_modality(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    # History is shown on the client's page; c1a9f0e2's seeded record logged an Assault Bike.
    _nav(page, f"{_base(page)}/clients/c1a9f0e2")

    # Open the structured record (the one that logged an Assault Bike).
    page.locator(
        "#client-history-list .history-card", has_text="Assault Bike"
    ).first.click()
    page.wait_for_timeout(400)

    plan = page.evaluate(
        """async () => {
            const store = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            const s = store.getActiveSession();
            const cr = s.clientRoutines[s.activeClientId];
            return {
                hasRest: cr.exercises.some(e => e.type === 'rest'),
                hasCardio: cr.exercises.some(e => e.modality === 'cardio'),
                hasCircuit: cr.exercises.some(e => e.circuitId),
            };
        }"""
    )
    assert plan["hasRest"], (
        "the rebuilt live plan should restore first-class rest items"
    )
    assert plan["hasCardio"], "the rebuilt live plan should restore the cardio modality"
    assert plan["hasCircuit"], "the rebuilt live plan should restore circuit grouping"
