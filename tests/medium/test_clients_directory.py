# tests/medium/test_clients_directory.py
# The Client Directory grid (modules/clients/clientsDirectory.js), its own first-class view/route
# since TODO 4.8: it lists one .client-card per seeded client, filters live as the search box is
# typed (by name or goal), and shows an empty state when nothing matches. Mounted as a single view
# via tests/medium/_harness.py's view_stub — no router, no IndexedDB, no app boot.
#
# The search box's listener lives in clientFormsController, not in the view module, so the stub
# boots that controller through appBoot.bootClientForms — the exact step app.js calls. It used to
# hand-duplicate the listener instead, which passed navigateToPath on both paths and so could not
# see that the real controller passed it on neither (TODO §22, fixed alongside this change): the
# filtered grid rendered correctly and threw on the first card tap.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { bootClientForms } from './appBoot.js';
import {
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
  renderClientsList,
} from './modules/clients/clientsView.js';
import { DEFAULT_CLIENTS } from './data/index.js';
""",
    view_id="client-directory",
    body="""
const state = { clients: structuredClone(DEFAULT_CLIENTS), lang: 'en' };

// Both shells: setupClientForms wires #btn-add-client (directory) and #btn-edit-client (detail),
// and reaches for the latter unguarded.
renderClientDirectoryViewShell();
renderClientDetailViewShell();

// Recorded rather than acted on — there is no router here, so what a card click must prove is that
// the callback EXISTS and is reached, which is exactly what was broken.
window.__navigated = [];
bootClientForms({
  state,
  t,
  navigateToPath: (path) => window.__navigated.push(path),
  saveToLocalStorage: noop,
  populateDropdownSelectors: noop,
  showErrorView: noop,
  switchView: noop,
  openWorkoutSetupModal: noop,
});
renderClientsList({ state, t, navigateToPath: (path) => window.__navigated.push(path) });
""",
)


def _cards(page):
    return page.locator("#clients-list .client-card")


def test_directory_lists_all_seeded_clients(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    # Eight clients are seeded (src/data/clients.js).
    assert _cards(page).count() == 8


def test_search_filters_clients_live(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#search-clients").fill("jane")
    # expect() rather than count()/inner_text(): .client-card carries `content-visibility: auto`
    # (src/index.css), so the browser is free to skip rendering the card's subtree on the frame
    # this assertion reads — and inner_text() only sees RENDERED text, so it came back empty while
    # count() correctly saw 1 card. expect().to_contain_text() reads textContent and retries, so it
    # is immune to the skipped-rendering window. The full-app boot this test came from was slow
    # enough to hide the race; a bare mounted view is not.
    expect(_cards(page)).to_have_count(1)
    expect(_cards(page).first).to_contain_text("Jane Doe")

    # Clearing the query restores the full directory.
    page.locator("#search-clients").fill("")
    expect(_cards(page)).to_have_count(8)


def test_search_with_no_match_shows_empty_state(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#search-clients").fill("zzzznomatch")
    expect(_cards(page)).to_have_count(0)
    empty = page.locator("#clients-list").inner_text().strip()
    assert empty, "expected a non-empty empty-state message"


def test_a_card_still_opens_after_the_grid_has_been_filtered(page, local_server):
    """TODO §22: the search re-render dropped navigateToPath, so every card in a FILTERED grid threw
    on tap while an unfiltered one worked — the failure only ever appeared after a search."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.locator("#search-clients").fill("jane")
    expect(_cards(page)).to_have_count(1)
    _cards(page).first.click()

    assert not errors, f"clicking a filtered card raised: {errors}"
    assert page.evaluate("() => window.__navigated") == ["/clients/c1a9f0e2"]
