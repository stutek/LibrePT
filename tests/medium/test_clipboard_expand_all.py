# tests/medium/test_clipboard_expand_all.py
# "Expand all" opens every card in the deck at once (TODO §42), asked for by a trainer who could not
# see the whole session at a glance: one card is open and the rest are peeking rows.
#
# Two things are asserted, and the second is the one that matters on a gym floor. Every card must
# show its expanded body — otherwise the control did nothing — and every card that is not in focus
# must carry NO controls, because twelve open cards with live Too Easy / Too Hard / timer buttons put
# a mis-tap one thumb-width from logging against the wrong exercise. A control that is drawn but
# inert would be worse than either, so they are removed rather than disabled, and that is what this
# reads: the buttons are absent from the DOM.
#
# Medium rather than e2e: no router, no persistence, no lifecycle — the deck renders from an injected
# session and the ⋯ menu is wired exactly as production wires it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
    rest_item,
)

# Every card shape the deck renders. The circuit is not decoration: its expanded body carries a
# number field per member (reps taken to failure), which a rule that only removed buttons would have
# left live on a card the trainer is merely reading.
PLAN = [
    exercise_item("exA", "Barbell Back Squat"),
    exercise_item("exB", "Romanian Deadlift"),
    rest_item("restX", 90),
    exercise_item(
        "exC1",
        "Kettlebell Swing",
        circuit_id="c1",
        circuitTitle="Finisher",
        circuitSeries=1,
    ),
    exercise_item(
        "exC2", "Push Press", circuit_id="c1", circuitTitle="Finisher", circuitSeries=1
    ),
    exercise_item("exD", "Walking Lunge"),
]

STUB = clipboard_stub(active_session_fixture(exercises=PLAN))

# What each card is showing: whether it drew the expanded body (the stats block only the open card
# has), and whether it carries any of the controls a focused card offers.
CARD_STATES = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  return cards.map((card) => ({
    inFocus: card.classList.contains('in-focus'),
    expanded: card.classList.contains('expanded'),
    // Each card shape has its own expanded body: stats for an exercise, a duration for a rest, a
    // member list for a circuit. A probe naming only the first two passed a rest card that had
    // rendered nothing.
    hasBody: !!card.querySelector('.deck-card-stats, .rest-card-duration, .circuit-ex-row'),
    // EVERY button, for the same reason the code strips every button: the rest card's Start sits in
    // neither of the two containers the first version of both named.
    controls: card.querySelectorAll('button, input, select, textarea, .deck-card-actions').length,
  }));
}"""


def _expand(page):
    page.locator("#btn-session-menu").click()
    page.locator("#btn-expand-all").click()


def test_only_the_focused_card_is_open_until_it_is_asked_for(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    states = page.evaluate(CARD_STATES)
    open_cards = [card for card in states if card["hasBody"]]

    assert len(open_cards) == 1, (
        f"the deck starts with one card open, not {len(open_cards)}"
    )
    assert open_cards[0]["inFocus"], "the open card is the one in focus"


def test_expand_all_opens_every_card(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    _expand(page)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.expanded")
    states = page.evaluate(CARD_STATES)

    assert all(card["hasBody"] for card in states), (
        f"every card shows its body once expanded: {states}"
    )
    assert sum(1 for card in states if card["inFocus"]) == 1, (
        "expanding is not focusing — exactly one card still says where the trainer is"
    )


def test_an_expanded_card_that_is_not_in_focus_carries_no_controls(page, local_server):
    """The safety half. Reading the plan must not become logging against the wrong exercise."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    _expand(page)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.expanded")
    states = page.evaluate(CARD_STATES)

    for card in states:
        if card["inFocus"]:
            continue
        assert card["controls"] == 0, (
            f"an expanded card must offer nothing to tap: {card}"
        )


def test_the_menu_item_says_which_direction_it_goes(page, local_server):
    """One control, both ways — so there is no second item to leave behind in the wrong state."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    page.locator("#btn-session-menu").click()
    before = page.locator("#btn-expand-all-text").inner_text()
    page.locator("#btn-expand-all").click()
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.expanded")

    page.locator("#btn-session-menu").click()
    after = page.locator("#btn-expand-all-text").inner_text()

    assert before != after, f"the label stayed {before!r} in both states"
