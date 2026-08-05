# tests/medium/test_history_structured_program.py
# TODO §17.1: a finished session is persisted as the WHOLE structured program — a flat list of typed
# items (exercise | rest) with circuit grouping via circuitId and a completed flag per exercise —
# not just the performed sets. This pins the History RENDER of that structure: circuit groups, rest
# chips, per-modality metrics, and a prescribed-but-skipped movement kept and greyed rather than
# dropped.
#
# Mounted as one view over the same DEFAULT_HISTORY seed the real app boots with, so the structure
# under test is production's, not a fixture that could drift from it. The re-open round-trip (which
# rebuilds a live plan through the real controller) stays in tests/e2e/, and the pure
# buildProgramSnapshot model is in tests/unit_js/modules/common/sessionItemRecord.test.mjs.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { renderHistoryViewShell, renderGlobalHistory } from './modules/history/historyView.js';
import { DEFAULT_HISTORY } from './data/index.js';
""",
    view_id="history",
    body="""
const state = { lang: 'en', history: structuredClone(DEFAULT_HISTORY) };

renderHistoryViewShell();
renderGlobalHistory({ state, t, openSessionFromHistory: noop });
""",
)


def test_history_renders_the_structured_program(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-history.active")

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
