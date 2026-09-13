# tests/e2e/test_session_deeplink.py
# The active-session view is deep-linkable down to the in-focus card:
#   {base}/session/{sessionId}/client/{clientId}/circuit/{circuitId}
#   {base}/session/{sessionId}/client/{clientId}/exercise/{exerciseId}
#   {base}/session/{sessionId}/client/{clientId}/exercise/{exerciseId}/closed
# where {base} is the app's sub-path (/LibrePT). `/closed` names the ACTIVE card while no card is
# open (TODO §48.1), so a reload brings back a highlighted card without opening it. Opening the session upgrades the URL to the
# focused card; tapping a card or navigating to such a URL moves focus; a stale/unknown card id
# is ignored (URL falls back to the real focus).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re


def _base(page):
    """The app's base path (e.g. '/LibrePT'), read from <base>."""
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _focus_re(base):
    return re.compile(
        "^"
        + re.escape(base)
        + r"/session/([^/]+)/client/([^/]+)/(exercise|circuit|rest)/([^/]+)(?:/closed)?$"
    )


def _nav(page, path):
    """Drive the client-side router to `path` the way an opened/typed deep link would."""
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def test_legacy_superset_deep_link_still_resolves(page, local_server):
    """`/superset/{id}` is the pre-2026-07-26 spelling of `/circuit/{id}`. Links get bookmarked and
    shared, so the old segment must keep resolving — and the address bar is rewritten to the current
    spelling, so an old link upgrades itself on arrival."""
    _open_session(page, local_server)
    base = _base(page)
    session_id, client_id = (
        _focus_re(base).match(page.evaluate("() => location.pathname")).groups()[:2]
    )

    cache = page.evaluate(
        "() => JSON.parse(localStorage.getItem('librept_active_session'))"
    )
    circuit_id = next(
        ex["circuitId"]
        for ex in cache["clientRoutines"][client_id]["exercises"]
        if ex.get("circuitId")
    )

    _nav(page, f"{base}/session/{session_id}/client/{client_id}/superset/{circuit_id}")
    assert page.evaluate("() => location.pathname") == (
        f"{base}/session/{session_id}/client/{client_id}/circuit/{circuit_id}"
    ), "a legacy superset link must resolve to the same card and rewrite to /circuit/"


def test_session_view_deep_links_to_focused_card(page, local_server):
    _open_session(page, local_server)
    base = _base(page)
    focus_re = _focus_re(base)

    # Opening the session upgrades the bare URL to the in-focus card (a seeded circuit).
    url_open = page.evaluate("() => location.pathname")
    m = focus_re.match(url_open)
    assert m, f"session URL did not carry a focused card: {url_open}"
    session_id, client_id, _, _ = m.groups()

    # A seeded circuit id (different from whatever is focused now) resolves on navigation:
    # the app keeps the URL on that card (it would rewrite it away if the id didn't resolve).
    cache = page.evaluate(
        "() => JSON.parse(localStorage.getItem('librept_active_session'))"
    )
    circuits = []
    for ex in cache["clientRoutines"][client_id]["exercises"]:
        if ex.get("circuitId") and ex["circuitId"] not in circuits:
            circuits.append(ex["circuitId"])
    assert len(circuits) >= 2, "expected the seeded routine to have multiple circuits"
    target_circuit = (
        f"{base}/session/{session_id}/client/{client_id}/circuit/{circuits[-1]}"
    )
    _nav(page, target_circuit)
    assert page.evaluate("() => location.pathname") == target_circuit

    # Inject a standalone (non-circuit) exercise: it auto-focuses, so the URL becomes an
    # /exercise/{id} deep link — covering the standalone-card route end to end.
    page.eval_on_selector("#btn-add-exercise-to-session", "el => el.click()")
    page.wait_for_selector("#dialog-add-session-exercise[open]")
    page.fill("#session-add-select-ex", "Deep Link Test Move")
    page.locator("#form-add-session-exercise button[type='submit']").click()
    page.wait_for_selector("#dialog-add-session-exercise", state="hidden")
    page.wait_for_timeout(300)

    url_injected = page.evaluate("() => location.pathname")
    m2 = focus_re.match(url_injected)
    assert m2 and m2.group(3) == "exercise", (
        f"inject did not focus an exercise route: {url_injected}"
    )

    # Navigate away to the circuit, then back to the injected exercise deep link: both resolve.
    _nav(page, target_circuit)
    assert page.evaluate("() => location.pathname") == target_circuit
    _nav(page, url_injected)
    assert page.evaluate("() => location.pathname") == url_injected

    # A stale/unknown card id is ignored: the URL falls back to a real focused-card path
    # rather than sticking on the bogus one.
    bogus = f"{base}/session/{session_id}/client/{client_id}/exercise/nonexistent-id"
    _nav(page, bogus)
    after = page.evaluate("() => location.pathname")
    assert after != bogus and focus_re.match(after), (
        f"stale id was not ignored: {after}"
    )


def test_tapping_a_card_updates_the_deep_link(page, local_server):
    _open_session(page, local_server)
    focus_re = _focus_re(_base(page))

    before = page.evaluate("() => location.pathname")
    # Tap a non-past, non-rest card that is NOT the one the URL already names (an exercise or
    # circuit) — deliberately excludes .rest-card so this test's outcome doesn't depend on seed-data
    # ordering: a rest card focusing correctly is covered explicitly by test_rest_card_focus.py, not
    # implicitly by whichever card this selector happens to land on. The deck starts fully collapsed
    # on open (deckAllCollapsed), so `.in-focus` can't be used to find "the other" card — the URL
    # (still derived straight from activeExerciseIndex, unaffected by the collapsed render) is.
    tapped = page.evaluate(
        """(before) => {
          const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
          const candidates = cards.filter(c =>
            !c.classList.contains('rest-card') &&
            !c.querySelector('.deck-card-status-past')
          );
          // Click each candidate in turn until the URL actually moves. A click that lands on
          // whatever the URL already names is a no-op (same index re-focused) and safely falls
          // through to the next candidate.
          return candidates.some((c) => {
            c.click();
            return location.pathname !== before;
          });
        }""",
        before,
    )
    assert tapped, "no tappable upcoming exercise/circuit card found in the deck"
    page.wait_for_timeout(300)
    after = page.evaluate("() => location.pathname")
    assert after != before and focus_re.match(after), (
        f"tap did not update the deep link: {after}"
    )


def test_a_cold_deep_link_names_the_session_it_opened(page, local_server):
    """Reported 2026-08-31 (Simon), with the link he was on: "still no title visible".

    Opening a session by tapping it writes the title bar; arriving at the same address from cold
    does not. `renderSessionTitle` runs before the overlay's markup exists, takes its `if (!el)
    return`, and nothing calls it again — so the bar keeps the placeholder word that ships in the
    static HTML, on a screen that knows perfectly well which session it is showing.

    A deep link is how a reload, a bookmark and a shared link all arrive, so this is the common
    case, not the exotic one."""
    _open_session(page, local_server)
    deep_link = page.evaluate("() => location.pathname")
    when = page.evaluate(
        "() => JSON.parse(localStorage.getItem('librept_active_session'))"
        "        .sourceSession.timeLabel.slice(0, 5)"
    )

    page.goto(f"{page.evaluate('() => location.origin')}{deep_link}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(600)

    title = page.locator("#session-title-text").inner_text().strip()
    assert title != "Clipboard", (
        "the deep-linked clipboard is still showing the placeholder from index.html"
    )
    assert when in title, (
        f"the bar does not say which session this is: {title!r} (session starts {when})"
    )


def test_leaving_the_editor_puts_the_session_back_not_the_placeholder(
    page, local_server
):
    """The other half of deriving rather than stashing (§39.6's neighbour, 2026-08-31).

    Edit mode repurposes the title bar. It used to keep the bar's HTML in a variable and put it back
    verbatim on the way out — which faithfully restored whatever was there, including the
    `Clipboard` placeholder a cold deep link leaves behind. Now the way out re-derives the title
    from the session, so it cannot restore something that was never right."""
    _open_session(page, local_server)
    deep_link = page.evaluate("() => location.pathname")
    when = page.evaluate(
        "() => JSON.parse(localStorage.getItem('librept_active_session'))"
        "        .sourceSession.timeLabel.slice(0, 5)"
    )
    page.goto(f"{page.evaluate('() => location.origin')}{deep_link}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    page.click("#btn-session-menu")
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.click("#btn-done-edit")
    page.wait_for_timeout(600)

    title = page.locator("#session-title-text").inner_text().strip()
    assert title != "Clipboard", "leaving the editor restored the placeholder"
    assert when in title, f"leaving the editor lost the session: {title!r}"


def test_the_clipboard_names_the_session_without_truncating_it(page, local_server):
    """Reported 2026-08-31 (Simon) at desktop width: "this one clips on desktop" (§39.6).

    The bar read `2026-09-01 11:30 playground outside` and lost 90px to an ellipsis — one 22px line
    led by an ISO date, carrying date, time and gym. The repo's own sweep passes it, correctly: an
    ellipsis is visible truncation, not the silent clipping `overflow_scan`'s invariant B hunts for.

    So the claim is not "nothing is ever cut" — a long enough gym name will always be. It is that
    the SESSION'S NAME survives, because that is what says which screen you are on, and that what
    gets cut first is the least identifying thing on the line."""
    page.set_viewport_size({"width": 1280, "height": 800})
    _open_session(page, local_server)

    name = page.evaluate(
        "() => JSON.parse(localStorage.getItem('librept_active_session'))"
        "        .sourceSession.titles[0]"
    )
    bar = page.locator("#session-title-text")
    assert name in bar.inner_text(), (
        f"the clipboard does not say which session it is: {bar.inner_text()!r}"
    )
    lost = page.evaluate(
        "() => { const el = document.querySelector('.clipboard-title-name');"
        "        return el ? el.scrollWidth - el.clientWidth : null; }"
    )
    assert lost is not None, "the title bar has no line carrying the session's name"
    assert lost <= 1, f"the session's own name is truncated by {lost}px"


DECK_STATE = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  const pick = (cls) => cards.filter((c) => c.classList.contains(cls))
                             .map((c) => c.dataset.planIndex);
  return { active: pick('is-active'), open: pick('in-focus') };
}"""


def _reload(page):
    page.reload()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".exercise-deck-card.is-active")
    page.wait_for_timeout(600)


def test_a_reload_keeps_the_active_card_closed_when_it_was_closed(page, local_server):
    """Simon, 2026-09-13: a reload returns to the same state as before (TODO §48.1). The trainer
    scrolled, so the highlight moved and no card is open. After a reload the same card is marked,
    and it has not opened by itself."""
    page.set_viewport_size({"width": 390, "height": 844})
    _open_session(page, local_server)
    page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card[data-plan-index]"
    ).first.click()
    page.wait_for_timeout(400)
    box = page.locator("#active-exercise-scroll-deck").bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 150)
    page.mouse.wheel(0, 400)
    page.wait_for_timeout(600)

    before = page.evaluate(DECK_STATE)
    assert len(before["active"]) == 1 and before["open"] == [], before
    assert page.evaluate("() => location.pathname").endswith("/closed")

    _reload(page)
    assert page.evaluate(DECK_STATE) == before


def test_a_reload_keeps_the_open_card_open(page, local_server):
    """The other half of the same promise: a card the trainer opened is still open after a
    reload, and it is still the active one."""
    page.set_viewport_size({"width": 390, "height": 844})
    _open_session(page, local_server)
    page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card[data-plan-index]"
    ).nth(1).click()
    page.wait_for_timeout(400)

    before = page.evaluate(DECK_STATE)
    assert len(before["open"]) == 1 and before["open"] == before["active"], before

    _reload(page)
    assert page.evaluate(DECK_STATE) == before
