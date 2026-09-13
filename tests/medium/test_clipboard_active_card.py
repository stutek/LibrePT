# tests/medium/test_clipboard_active_card.py
# The ACTIVE card and the OPEN card on the live clipboard (TODO §48.1).
#
# The open card is the one the trainer tapped: it shows its controls. The active card is the one the
# trainer is looking at: a scroll that brings another card to the focus line makes that card active,
# marks it, and closes the open card. A tap makes a card active AND opens it. The active card is what
# a switch of client tabs and a reload come back to, so it must follow the trainer's own scrolling —
# never a scroll the app does by itself after a render.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

PHONE = {"width": 390, "height": 844}

# Enough cards that the deck still scrolls on a phone once every card is closed.
LONG_PLAN = [exercise_item(f"ex{n}", f"Exercise number {n}") for n in range(40)]

CARD_STATE = """() => [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')]
  .filter((c) => c.dataset.planIndex !== undefined)
  .map((c) => ({
    index: Number(c.dataset.planIndex),
    active: c.classList.contains('is-active'),
    open: c.classList.contains('in-focus'),
    buttons: c.querySelectorAll('button').length,
  }))"""


def _mount(page, local_server, exercises=LONG_PLAN):
    page.set_viewport_size(PHONE)
    load_with_stub(
        page,
        local_server,
        clipboard_stub(active_session_fixture(exercises=exercises)),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".exercise-deck-card.is-active")
    page.wait_for_timeout(500)


def _cards(page):
    return page.evaluate(CARD_STATE)


def _active(cards):
    active = [c for c in cards if c["active"]]
    assert len(active) == 1, f"expected exactly one active card, got {active}"
    return active[0]


def _scroll_by_hand(page, dy, settle_ms=600):
    # The middle of the screen, which the deck covers at any scroll position. Aiming at the deck's
    # own box would put the pointer off screen once its top edge has scrolled away.
    page.mouse.move(PHONE["width"] / 2, PHONE["height"] / 2)
    page.mouse.wheel(0, dy)
    page.wait_for_timeout(settle_ms)


def test_the_tapped_card_is_both_open_and_active(page, local_server):
    """A tap is the one gesture that does both: the card opens with its controls, and it becomes
    the card the highlight marks."""
    _mount(page, local_server)
    page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card[data-plan-index='3']"
    ).click()
    page.wait_for_timeout(400)

    active = _active(_cards(page))
    assert active["index"] == 3 and active["open"], active
    assert [c["index"] for c in _cards(page) if c["open"]] == [3]


def test_scrolling_moves_the_highlight_and_closes_the_open_card(page, local_server):
    """The trainer scrolls past the card they had open: it closes, and the card now at the focus
    line is marked as active. Nothing opens by itself."""
    _mount(page, local_server)
    assert _active(_cards(page))["index"] == 0

    _scroll_by_hand(page, 500)

    cards = _cards(page)
    active = _active(cards)
    assert active["index"] > 0, f"the highlight did not follow the scroll: {cards}"
    assert not any(c["open"] for c in cards), (
        f"a card is still open after scrolling: {cards}"
    )


def test_an_active_card_that_is_not_open_has_nothing_to_tap(page, local_server):
    """Controls appear only on a card the trainer opened. The highlight alone adds no button, so a
    session in progress is not cluttered and a scroll cannot put a control under the thumb."""
    _mount(page, local_server)
    _scroll_by_hand(page, 500)

    active = _active(_cards(page))
    assert not active["open"] and active["buttons"] == 0, active


def test_the_highlighted_card_is_still_on_screen_after_the_open_card_closes(
    page, local_server
):
    """Closing the open card makes it shorter, which pulls every card below it upward. The card
    the trainer scrolled to must still be in view afterwards, not jumped off the screen."""
    _mount(page, local_server)
    _scroll_by_hand(page, 500)

    index = _active(_cards(page))["index"]
    box = page.locator(
        f"#active-exercise-scroll-deck .exercise-deck-card[data-plan-index='{index}']"
    ).bounding_box()
    assert 0 <= box["y"] < PHONE["height"], (
        f"active card {index} is off screen at y={box['y']}"
    )


def test_the_deck_comes_back_to_the_active_card_when_nothing_is_open(
    page, local_server
):
    """Simon, 2026-09-13: the mark is there "so it can quickly be returned to when switching client
    views". A client's deck drawn again with no card open still scrolls to that client's active card
    — here card 30 of 40, far below the first screen."""
    page.set_viewport_size(PHONE)
    session = active_session_fixture(exercises=LONG_PLAN).replace(
        '"activeExerciseIndex": 0, "deckAllCollapsed": false',
        '"activeExerciseIndex": 30, "deckAllCollapsed": true',
    )
    assert '"activeExerciseIndex": 30' in session
    load_with_stub(page, local_server, clipboard_stub(session))
    page.wait_for_selector(".exercise-deck-card.is-active")
    page.wait_for_timeout(800)

    box = page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card[data-plan-index='30']"
    ).bounding_box()
    assert 0 <= box["y"] < PHONE["height"], (
        f"active card 30 is off screen at y={box['y']}"
    )


def test_a_scroll_the_app_makes_itself_moves_nothing(page, local_server):
    """After a render the app scrolls the open card into view. Only the trainer's own scrolling may
    move the highlight, or opening a card low on the screen would close it again at once."""
    _mount(page, local_server)
    page.evaluate(
        """() => {
          let el = document.getElementById('active-exercise-scroll-deck');
          while (el && !(el.scrollHeight > el.clientHeight
                 && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
          (el || document.scrollingElement).scrollTop += 500;
        }"""
    )
    page.wait_for_timeout(600)

    active = _active(_cards(page))
    assert active["index"] == 0 and active["open"], active


def test_scrolling_to_either_end_reaches_the_first_and_the_last_card(
    page, local_server
):
    """Reported 2026-09-13 (Simon): the cards at the start and at the end could not be activated,
    because the list cannot scroll far enough to bring them to a fixed line a third of the way down.
    At the end of the list the last card is active; back at the start, the first."""
    _mount(page, local_server)
    last = max(c["index"] for c in _cards(page))

    _scroll_by_hand(page, 20000)
    assert _active(_cards(page))["index"] == last

    _scroll_by_hand(page, -20000)
    assert _active(_cards(page))["index"] == 0


SHORT_PLAN = [exercise_item(f"sx{n}", f"Short plan exercise {n}") for n in range(4)]

ACTIVE_CARD_TOP = """() => document.querySelector(
  '#active-exercise-scroll-deck .exercise-deck-card.is-active').getBoundingClientRect().top"""


def test_a_short_list_scrolls_through_every_card(page, local_server):
    """Asked 2026-09-13 (Simon): a list short enough to fit on the screen must also move the active
    card by scrolling alone. The deck makes room to scroll, so short steps down walk through every
    card to the last and back up to the first, and the active card stays on the screen throughout."""
    _mount(page, local_server, exercises=SHORT_PLAN)

    # Closed cards on a phone stand about 30px apart, so a step of 15px cannot jump over one.
    seen = [_active(_cards(page))["index"]]
    for _ in range(40):
        _scroll_by_hand(page, 15, settle_ms=150)
        seen.append(_active(_cards(page))["index"])
        assert 0 <= page.evaluate(ACTIVE_CARD_TOP) < PHONE["height"], seen
    assert sorted(set(seen)) == [0, 1, 2, 3], f"scrolling down skipped a card: {seen}"
    assert seen[-1] == 3

    _scroll_by_hand(page, -2000)
    assert _active(_cards(page))["index"] == 0


def test_a_pull_on_the_clipboard_does_not_reload_the_page(page, local_server):
    """Asked 2026-09-13 (Simon). On a phone, a pull down at the top of the page reloads it, and a
    short list reaches its top at once. While the clipboard is open, the page and the clipboard's
    scrolling area keep a pull to themselves. A desktop browser has no pull-to-reload to trigger, so
    what is checked is the setting the phone's browser obeys."""
    _mount(page, local_server, exercises=SHORT_PLAN)

    behaviour = page.evaluate(
        """() => [document.documentElement, document.querySelector('.clipboard-body')]
             .map((el) => getComputedStyle(el).overscrollBehaviorY)"""
    )
    assert behaviour == ["contain", "contain"], behaviour
