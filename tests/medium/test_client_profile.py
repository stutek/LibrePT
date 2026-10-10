# tests/medium/test_client_profile.py
# What the client's profile shows of what the trainer wrote. Mounted with the client-detail view of
# tests/medium/test_client_data_rights.py, which already seeds a client and opens the profile.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import load_with_stub
from tests.medium.test_client_data_rights import STUB, _open_detail


def test_a_note_typed_on_several_lines_is_read_on_several_lines(page, local_server):
    """A trainer kept a debt and its instalments as three lines of notes; the profile ran them into
    one line, so "Dolg 120 €" read into the next sentence (trainer weeks, 2026-10-10)."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")
    page.evaluate(
        "() => { window.__clientOf('c-jane-a').notes = 'Dolg 120 €\\nPlača v dveh obrokih'; }"
    )
    _open_detail(page, "c-jane-a")

    assert (
        page.locator("#profile-notes").inner_text()
        == "Dolg 120 €\nPlača v dveh obrokih"
    )
