# tests/e2e/test_clipboard_session_dots.py
# Two same-day sessions that overlap open as ONE clipboard (the seed pairs "Group Strength &
# Conditioning" with "Return-to-Play Rehab"). The title bar names each session on its own line, and
# each line carries a colour dot. The same dot sits on the tab of every client who belongs to that
# session, so the trainer sees whose programme is whose without reading. The pairing is also in
# text, for a reader who does not see colour: the dot's own line is the session's name, and the tab
# holds the session's name as screen-reader text.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

TITLES = ["Group Strength & Conditioning", "Return-to-Play Rehab"]


def _open_merged_clipboard(page, local_server):
    page.goto(local_server)
    card = page.locator(".session-card", has_text="Group Strength").first
    card.wait_for()
    card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".client-tab-participant")


def _read(page):
    """What is on screen: each title line's dot, and each tab's dot with its screen-reader text."""
    return page.evaluate(
        """() => ({
          lines: [...document.querySelectorAll('.clipboard-title-line')].map((l) => ({
            text: l.querySelector('.clipboard-title-name').textContent.trim(),
            dot: l.querySelector('.session-dot')?.dataset.sessionSlot ?? null,
          })),
          tabs: [...document.querySelectorAll('.client-tab-participant')].map((tab) => ({
            dot: tab.querySelector('.session-dot')?.dataset.sessionSlot ?? null,
            hidden: tab.querySelector('.sr-only')?.textContent.trim() ?? null,
          })),
        })"""
    )


def _expected_tab_titles(page):
    """Per participant, the title of the session the record says the client belongs to."""
    return page.evaluate(
        """async () => {
          const store = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
          const c = store.getActiveSession();
          const ss = c.sourceSession;
          return c.participants.map((id) => ss.sessionTitles[ss.clientSessions[id]]);
        }"""
    )


def _assert_paired(page):
    seen = _read(page)
    assert [line["text"] for line in seen["lines"]] == TITLES, seen
    slots = [line["dot"] for line in seen["lines"]]
    assert None not in slots and len(set(slots)) == 2, (
        f"two distinct dots expected: {seen}"
    )
    slot_of = dict(zip(TITLES, slots))
    expected = _expected_tab_titles(page)
    assert set(expected) == set(TITLES), (
        "both sessions must have a client on the clipboard"
    )
    for tab, title in zip(seen["tabs"], expected):
        assert tab["dot"] == slot_of[title], (tab, title, seen)
        assert tab["hidden"] == title, (tab, title)


def test_merged_clipboard_pairs_each_tab_with_its_session_line(page, local_server):
    _open_merged_clipboard(page, local_server)
    _assert_paired(page)


def test_the_pairing_survives_a_reload(page, local_server):
    _open_merged_clipboard(page, local_server)
    page.reload()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".client-tab-participant")
    _assert_paired(page)


def test_a_single_session_clipboard_shows_no_dots(page, local_server):
    page.goto(local_server)
    card = page.locator(".session-card", has_text="Early Bird").first
    card.wait_for()
    card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".client-tab-participant")
    assert page.locator(".session-dot").count() == 0
