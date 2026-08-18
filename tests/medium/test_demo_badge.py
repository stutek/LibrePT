# tests/medium/test_demo_badge.py
# The header build badge naming the state a trainer is actually in (TODO §28.9,
# renderBuildStateBadge in applicationHeader.js).
#
# WHICH state it names is pure logic and is pinned far more cheaply in
# tests/unit_js/data/demoOnlyStore.test.mjs. What only a browser can answer is the other half:
# whether the word a trainer reads matches that decision, and whether the badge stays a real,
# reachable control in both states rather than a colour swap.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

STUB = (
    HEADER_STUB
    + """
import { renderBuildStateBadge } from './modules/common/applicationHeader.js';
import { DEFAULT_CLIENTS } from './data/index.js';
import { stampAsSeeded } from './data/seedProvenance.js';

window.showBuildState = (which) => {
  const demo = { clients: DEFAULT_CLIENTS.map(stampAsSeeded) };
  const own = { clients: [{ id: 'A'.repeat(22), name: 'Real Person' }] };
  renderBuildStateBadge(which === 'demo' ? demo : own);
};
renderBuildStateBadge({ clients: [] });
"""
)


def test_an_ordinary_store_is_named_a_preview_build(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    badge = page.locator("#preview-badge")
    assert badge.is_visible()
    assert badge.inner_text().strip() == "PREVIEW"
    # Spelled out, and still the route to the data-loss notice — the badge is the only place that
    # warning is reachable without signal.
    assert "preview.html" in (badge.get_attribute("href") or "")


def test_a_demo_store_is_named_a_demo(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBuildState('demo')")

    badge = page.locator("#preview-badge")
    assert badge.is_visible()
    assert badge.inner_text().strip() == "DEMO"
    # The word carries it, not the colour: a trainer who cannot distinguish the two badge colours
    # still reads which state they are in.
    label = page.locator("#preview-badge-label")
    assert label.is_visible()
    aria = badge.get_attribute("aria-label") or ""
    assert "demo" in aria.lower()


def test_the_trainers_own_work_takes_the_slot_back(page, local_server):
    """One real record and the badge returns to the data-loss warning.

    The two claims compete for one slot: DEMO says nothing here is yours, PREVIEW says this build
    may lose what is. Once a trainer has written something of their own, losing it is the more
    urgent fact, so PREVIEW wins — the demo around it is still visible in the data itself.
    """
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBuildState('demo')")
    page.evaluate("window.showBuildState('own')")

    badge = page.locator("#preview-badge")
    assert badge.inner_text().strip() == "PREVIEW"
    assert "preview.html" in (badge.get_attribute("href") or "")
    assert "demo" not in (badge.get_attribute("aria-label") or "").lower()
