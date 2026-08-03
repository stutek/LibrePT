# tests/e2e/test_session_item_record.py
# TODO §17.1: a finished session is persisted as the WHOLE structured program — a flat list of typed
# items (exercise | rest) with circuit grouping via circuitId and a completed flag per exercise —
# not just the performed sets. What stays here needs the real, live-booted app: the History render
# of that structure (circuit group, rest chips, greyed skips, per-modality metrics) and the re-open
# round-trip that rebuilds the live plan from the snapshot. The pure buildProgramSnapshot model
# moved to tests/unit_js/modules/common/sessionItemRecord.test.mjs.
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
    # The seeded structured record preserves circuit grouping and first-class rests…
    assert log.locator(".history-circuit").count() >= 1, (
        "a circuit group should render in history"
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
    assert plan["hasCircuit"], "the rebuilt live plan should restore circuit grouping"
