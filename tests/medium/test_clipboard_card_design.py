# tests/medium/test_clipboard_expand_all.py
# "Expand all" lays every card in the deck out flat (TODO §42), asked for by a trainer who could not
# see the whole session at a glance: one card is open and the rest are peeking rows, each slid up
# over the one before it.
#
# Three things are asserted. The deck must actually stop being a deck — every card out of the stack
# and fully visible, or the control did nothing. Every card that is not in focus must carry NOTHING
# to tap, because twelve open cards with live Too Easy / Too Hard / timer buttons put a mis-tap one
# thumb-width from logging against the wrong exercise; they are never drawn rather than drawn and
# disabled, and that is what this reads — the buttons are absent from the DOM. And a card must look
# like itself in all three states (§42.3): opening one ADDS its controls to the row the trainer was
# already reading, instead of swapping in a second, taller design that says the same numbers again.
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

# Every card shape the deck renders. The circuit is not decoration: the card in focus carries a
# number field per member (reps taken to failure), which a rule that only kept BUTTONS off a card
# the trainer is merely reading would have left live.
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

# What each card is showing: whether it is out of the stack (nothing of it covered by the card
# after it), and whether it carries anything the trainer could tap.
CARD_STATES = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  return cards.map((card, i) => {
    const next = cards[i + 1];
    const rect = card.getBoundingClientRect();
    return {
      name: card.querySelector('.deck-card-name-inline')?.textContent.trim() ?? '?',
      inFocus: card.classList.contains('in-focus'),
      expanded: card.classList.contains('expanded'),
      // Cards are siblings at one z-index, so DOM order is paint order: the next card is what
      // covers this one. Laid out flat, none of it is covered.
      covered: next
        ? Math.max(0, Math.round(rect.bottom - next.getBoundingClientRect().top))
        : 0,
      // EVERY control, not a list of known ones: the rest card's Start sits in neither of the two
      // containers an earlier version of this probe named, and a circuit carries number FIELDS.
      controls: card.querySelectorAll('button, input, select, textarea, .deck-card-actions').length,
    };
  });
}"""


def _expand(page):
    page.locator("#btn-session-menu").click()
    page.locator("#btn-expand-all").click()


def test_only_the_focused_card_can_be_acted_on_until_expanding_is_asked_for(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    states = page.evaluate(CARD_STATES)
    live_cards = [card for card in states if card["controls"]]

    assert len(live_cards) == 1, (
        f"the deck starts with one card that can be acted on, not {len(live_cards)}"
    )
    assert live_cards[0]["inFocus"], "that card is the one in focus"
    assert any(card["covered"] for card in states), (
        "the deck starts as a stack — cards slid up over each other"
    )


def test_expand_all_lays_every_card_out_flat(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    _expand(page)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.expanded")
    page.wait_for_timeout(
        500
    )  # margin and transform both transition; sample once settled
    states = page.evaluate(CARD_STATES)

    covered = [card for card in states if card["covered"]]
    assert not covered, (
        "every card is fully visible once expanded, none covered by the one after it:\n"
        + "\n".join(f"  {c['name']}: {c['covered']}px covered" for c in covered)
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


# The tag's place is the report that produced §42.5: opening a card moved its status tag from the end
# of the title row onto a line of its own above the name, so one card read as two designs. What is
# asserted is the INVARIANT — the tag is inside the same head row as the name, in every state — not
# the pixel position, which is the stylesheet's to move.
TAG_ROW = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  return cards.map((card) => {
    const tag = card.querySelector('.deck-card-status');
    const name = card.querySelector('.deck-card-name, .deck-card-name-inline');
    return {
      hasTag: !!tag,
      sameRow: !!(tag && name && tag.parentElement === name.parentElement),
    };
  });
}"""


def test_the_status_tag_sits_in_the_title_row_however_open_the_card_is(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    collapsed = page.evaluate(TAG_ROW)
    _expand(page)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.expanded")
    expanded = page.evaluate(TAG_ROW)

    for state, cards in (("collapsed", collapsed), ("expanded", expanded)):
        for card in cards:
            if not card["hasTag"]:
                continue
            assert card["sameRow"], f"{state}: the tag left the title row — {card}"


# A collapsed circuit names its movements (TODO §42.6). Asked for by the maintainer: "Tri-Set
# Metabolic Circuit" alone says three unnamed things are coming, while every other collapsed card
# already says what it is. The rest INSIDE a circuit is a member like any other and has no name or
# reps to show — asking it for them printed a line reading "undefined" under every circuit.
CIRCUIT_SUMMARY = """() => {
  const card = [...document.querySelectorAll('.exercise-deck-card')]
    .find((el) => el.classList.contains('circuit-card') && !el.classList.contains('in-focus'));
  if (!card) return null;
  return {
    names: [...card.querySelectorAll('.circuit-ex-list .circuit-ex-name')].map((el) => el.innerText.trim()),
    text: card.innerText,
    controls: card.querySelectorAll('button, input').length,
  };
}"""


def test_a_collapsed_circuit_names_its_movements(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    summary = page.evaluate(CIRCUIT_SUMMARY)

    assert summary, "the fixture has a circuit that is not in focus"
    assert "Kettlebell Swing" in summary["names"], summary
    assert "Push Press" in summary["names"], summary
    assert "undefined" not in summary["text"], (
        f"a member with no name or reps printed itself as undefined: {summary['text']!r}"
    )
    assert summary["controls"] == 0, "a collapsed card offers nothing to tap"


# A card looks like itself however open it is (TODO §42.3, ruled 2026-09-10): "expanding the card
# should just insert elements into existing exercise design, not load a completely different one".
# The exercise card used to answer a tap by throwing its target line away and saying the same three
# numbers again as a block of big tiles, so the row the trainer had been reading was replaced rather
# than opened.
TARGET_LINE = """(name) => {
  const card = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')]
    .find((el) => el.querySelector('.deck-card-name-inline')?.textContent.trim() === name);
  if (!card) return null;
  return {
    inFocus: card.classList.contains('in-focus'),
    target: card.querySelector('.deck-card-compact-target')?.textContent.trim() ?? null,
    // What focus ADDS, and the proof it was added to the row rather than instead of it.
    hasActions: !!card.querySelector('.deck-card-actions'),
    timerInHeadRow: !!card.querySelector('.deck-card-compact .deck-card-timer'),
  };
}"""


def test_bringing_a_card_into_focus_keeps_the_line_it_was_showing(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    name = "Romanian Deadlift"
    before = page.evaluate(TARGET_LINE, name)
    assert before and not before["inFocus"], (
        f"the fixture starts this card collapsed: {before}"
    )
    assert before["target"], "a collapsed exercise card states its target"

    # A DOM click, not a synthesized pointer one: collapsed cards overlap by a negative margin, so
    # the card above this one sits over its click point and would swallow the event.
    page.evaluate(
        """(name) => [...document.querySelectorAll('.exercise-deck-card')]
             .find((el) => el.querySelector('.deck-card-name-inline')?.textContent.trim() === name)
             .click()""",
        name,
    )
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.in-focus")
    page.wait_for_timeout(400)
    after = page.evaluate(TARGET_LINE, name)

    assert after["inFocus"], f"tapping the card brings it into focus: {after}"
    assert after["target"] == before["target"], (
        f"the card in focus states the same target it did collapsed — "
        f"{before['target']!r} became {after['target']!r}"
    )
    assert after["hasActions"], (
        "the card in focus adds the Too Easy / Too Hard / Feedback row"
    )
    assert after["timerInHeadRow"], "and its timer joins the head row it already had"
