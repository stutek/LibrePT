# tests/medium/test_clipboard_card_design.py
# Every deck card has ONE design (TODO §42.3), and being in focus ADDS to it rather than swapping in
# a second, taller one. Three promises are read here, all of them things a trainer sees:
#
#   1. The card in focus shows the same line it showed before it was tapped, plus what it takes to
#      log against it. It used to throw that line away and say the same numbers again as big tiles.
#   2. The tag — Completed, Upcoming, Past — stays in the title row in every state (§42.5).
#   3. A card that is NOT in focus carries nothing to tap. Live Too Easy / Too Hard / timer buttons
#      on a card the trainer is only reading put a mis-tap one thumb-width from logging against the
#      wrong exercise. They are never drawn rather than drawn and then removed, so what this reads is
#      that the buttons are absent from the DOM.
#
# This file was tests/medium/test_clipboard_expand_all.py until §42.14 removed that setting: once
# every card said everything it had on its own row, "open them all" had nothing left to open. What it
# asserted about SAFETY is what survived, and it is asserted here on the collapsed stack itself.
#
# Medium rather than e2e: no router, no persistence, no lifecycle — the deck renders from an injected
# session, the way production renders it.
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

# What each card is showing: whether it is the card being worked, and whether it carries anything
# the trainer could tap.
CARD_STATES = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  return cards.map((card) => ({
    name: card.querySelector('.deck-card-name-inline')?.textContent.trim() ?? '?',
    inFocus: card.classList.contains('in-focus'),
    // EVERY control, not a list of known ones: the rest card's Start sits in neither of the two
    // containers an earlier version of this probe named, and a circuit carries number FIELDS.
    controls: card.querySelectorAll('button, input, select, textarea, .deck-card-actions').length,
  }));
}"""


def _focus_card(page, name):
    """Bring the named card into focus.

    A DOM click, not a synthesized pointer one: cards in the stack slide up over each other by a
    negative margin, so the card above this one sits over its click point and would swallow the
    event — force=True would not help, since it still dispatches at coordinates.
    """
    page.evaluate(
        """(name) => [...document.querySelectorAll('.exercise-deck-card')]
             .find((el) => el.querySelector('.deck-card-name-inline')?.textContent.trim() === name)
             .click()""",
        name,
    )
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card.in-focus")
    page.wait_for_timeout(400)


def test_only_the_card_in_focus_can_be_acted_on(page, local_server):
    """The safety half. Reading the plan must not become logging against the wrong exercise."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    states = page.evaluate(CARD_STATES)
    live_cards = [card for card in states if card["controls"]]

    assert len(live_cards) == 1, (
        f"exactly one card can be acted on, not {len(live_cards)}: {states}"
    )
    assert live_cards[0]["inFocus"], "that card is the one in focus"


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


def test_the_status_tag_sits_in_the_title_row_in_every_state(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")

    before = page.evaluate(TAG_ROW)
    _focus_card(page, "Romanian Deadlift")
    after = page.evaluate(TAG_ROW)

    for state, cards in (("before", before), ("after focusing one", after)):
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

    _focus_card(page, name)
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


# The client's last session, seeded into `state.history` after the stub has mounted — the harness
# boots with an empty history, and the deck reads it at render time, so pushing a record and
# re-rendering is the whole setup. A fixed date, not one relative to the frozen clock: what is
# asserted is how the date is WRITTEN, which must not move with the day the test runs.
PAST_SESSION_DATE = "2026-07-20"
SEED_PAST_SESSION = """
state.history.push({
  id: 'h1',
  clientId: 'c1a9f0e2',
  clientName: 'Jane Doe',
  routineName: 'Lower Body',
  date: '2026-07-20T17:30:00',
  duration: 3600,
  exercises: [
    {
      id: 'p1',
      type: 'exercise',
      name: 'Barbell Back Squat',
      sets: [{ reps: 8, weight: 60, completed: true }],
      loadUnit: 'kg',
      metric: 'reps',
      modality: 'strength',
    },
  ],
  feedback: [],
});
renderActiveGroupBoard();
"""

PAST_STUB = clipboard_stub(
    active_session_fixture(exercises=PLAN), extra_body=SEED_PAST_SESSION
)


def test_the_past_card_writes_its_date_as_an_iso_day(page, local_server):
    """TODO §54. The badge read "Past: 20. jul." on a Slovenian screen and "Jul 20" on an English
    one: `toLocaleDateString` asked the DEVICE how to write the date, so the same record was
    written two ways and neither said the year. A date is ISO everywhere in this app, in every
    language, and the word beside it comes from the dictionary rather than from the markup."""
    load_with_stub(page, local_server, PAST_STUB)
    page.wait_for_selector(".deck-card-status-past")

    badge = page.locator(".deck-card-status-past").first.evaluate(
        "el => el.textContent.trim()"
    )

    # The stub's `t` reads the real English dictionary (tests/medium/_harness.py), so this is the
    # line a trainer sees, word and date together.
    assert badge == f"Last time: {PAST_SESSION_DATE}", (
        f"the past card says when it was, as an ISO day, in a word from the dictionary: {badge!r}"
    )
