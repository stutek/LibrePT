# tests/medium/test_clients_directory.py
# The Client Directory grid (modules/clients/clientsDirectory.js), its own first-class view/route
# since TODO 4.8: it lists one .client-card per seeded client, filters live as the search box is
# typed (by name or goal), and shows an empty state when nothing matches. Mounted as a single view
# via tests/medium/_harness.py's view_stub — no router, no IndexedDB, no app boot.
#
# The search box's listener lives in clientFormsController (not in the view module), so the stub
# wires it the same way that controller does; without it the input renders but filters nothing,
# which would make the two filter tests below silently vacuous.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { renderClientDirectoryViewShell, renderClientsList } from './modules/clients/clientsView.js';
import { DEFAULT_CLIENTS } from './data/index.js';
""",
    view_id="client-directory",
    body="""
const state = { clients: DEFAULT_CLIENTS, lang: 'en' };
renderClientDirectoryViewShell();
renderClientsList({ state, t, navigateToPath: noop });

document.getElementById('search-clients').addEventListener('input', (e) => {
  renderClientsList({ state, t, navigateToPath: noop, filterQuery: e.target.value });
});
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
