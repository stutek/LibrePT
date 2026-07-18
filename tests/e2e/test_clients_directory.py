# tests/e2e/test_clients_directory.py
# End-to-end coverage of the dashboard Client Directory grid (components/clientsDirectory.js):
# it lists one .client-card per seeded client, filters live as the search box is typed (by name
# or goal), and shows an empty state when nothing matches.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _cards(page):
    return page.locator("#clients-list .client-card")


def test_directory_lists_all_seeded_clients(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    # Eight clients are seeded (src/data/clients.js).
    assert _cards(page).count() == 8


def test_search_filters_clients_live(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#search-clients").fill("jane")
    assert _cards(page).count() == 1
    assert "Jane Doe" in _cards(page).first.inner_text()

    # Clearing the query restores the full directory.
    page.locator("#search-clients").fill("")
    assert _cards(page).count() == 8


def test_search_with_no_match_shows_empty_state(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#search-clients").fill("zzzznomatch")
    assert _cards(page).count() == 0
    empty = page.locator("#clients-list").inner_text().strip()
    assert empty, "expected a non-empty empty-state message"
