# tests/e2e/test_session_item_record.py
# TODO §17.1: a finished session is persisted as the WHOLE structured program — a flat list of typed
# items (exercise | rest) with superset grouping via circuitId and a completed flag per exercise —
# not just the performed sets. These tests cover the History render of that structure (superset group,
# rest chips, greyed skips, per-modality metrics), the pure buildProgramSnapshot model (keeps rests +
# skipped work), and the re-open round-trip that rebuilds the live plan from the snapshot.
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


def test_history_renders_the_structured_program(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/history")

    log = page.locator("#global-history-list")
    # The seeded structured record preserves superset grouping and first-class rests…
    assert log.locator(".history-superset").count() >= 1, (
        "a superset group should render in history"
    )
    assert log.locator(".history-rest-row").count() >= 1, (
        "first-class rests should render as chips"
    )
    # …logs cardio against its metric (calories)…
    assert log.locator("text=/\\d+\\s*cal/").count() >= 1, (
        "cardio work should show a calorie metric"
    )
    # …and keeps a prescribed-but-skipped movement, greyed with a Skipped badge.
    assert log.locator(".history-skip-badge").count() >= 1, (
        "a skipped exercise should be marked"
    )
    assert log.locator(".history-ex-skipped").count() >= 1, (
        "a skipped exercise should be greyed"
    )


def test_build_program_snapshot_keeps_rests_and_skips(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    result = page.evaluate(
        """async () => {
            const url = new URL('modules/common/sessionItemRecord.js', document.baseURI).href;
            const m = await import(url);
            const cs = {
                exercises: [
                    { id: 'a', name: 'Squat', loadUnit: 'kg', modality: 'strength', metric: 'reps',
                      setsTargetCount: 3, repsTarget: 5, weightTarget: 100,
                      circuitId: 'c1', circuitTitle: 'SS', circuitSeries: 3 },
                    { id: 'r1', type: 'rest', rest: 60, circuitId: 'c1' },
                    { id: 'b', name: 'Skipped Curl', loadUnit: 'kg', modality: 'strength',
                      metric: 'reps', setsTargetCount: 2, repsTarget: 12, weightTarget: 15 },
                ],
                logs: {
                    a: [ { reps: 5, weight: 100, completed: true },
                         { reps: 5, weight: 100, completed: true },
                         { reps: 5, weight: 100, completed: false } ],
                },
            };
            const items = m.buildProgramSnapshot(cs);
            return {
                len: items.length,
                t0: items[0].type, done0: items[0].completed, sets0: items[0].sets.length,
                circuit0: items[0].circuitId,
                t1: items[1].type, rest1: items[1].rest,
                t2: items[2].type, done2: items[2].completed, sets2: items[2].sets.length,
                skippedSetDone: items[2].sets[0].completed,
                exerciseCount: m.exerciseRecordsOf(items).length,
            };
        }"""
    )
    assert result["len"] == 3
    assert (
        result["t0"] == "exercise" and result["done0"] is True and result["sets0"] == 3
    )
    assert result["circuit0"] == "c1"
    assert result["t1"] == "rest" and result["rest1"] == 60
    # A movement with no logged work is KEPT as its prescription, flagged not-completed.
    assert (
        result["t2"] == "exercise" and result["done2"] is False and result["sets2"] == 2
    )
    assert result["skippedSetDone"] is False
    assert result["exerciseCount"] == 2, "exerciseRecordsOf must filter out rest items"


def test_reopening_a_structured_record_rebuilds_rests_and_modality(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/history")

    # Open the structured record (the one that logged an Assault Bike).
    page.locator(
        "#global-history-list .history-card", has_text="Assault Bike"
    ).first.click()
    page.wait_for_timeout(400)

    plan = page.evaluate(
        """() => {
            const s = JSON.parse(localStorage.getItem('librept_active_session'));
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
    assert plan["hasCircuit"], "the rebuilt live plan should restore superset grouping"
