# tests/medium/test_clipboard_deck_legibility.py
# The collapsed deck stack has one job: every card that is not in focus still tells the trainer what
# it is. Cards slide up over each other by a negative margin, so the only thing keeping that peeking
# row readable is the overlap being smaller than the row is tall — and nothing about the CSS says so
# out loud. It was wrong for a while: at desktop width a ~37px card showed 11px, and since the name
# renders at y=8-25 inside the card, roughly three pixels of every glyph survived.
#
# Geometry rather than semantics, like tests/e2e/test_layout_overflow.py — but this is occlusion by a
# sibling rather than overflow past a boundary, and it belongs to the deck alone (no router, no
# persistence), so it sits in medium/ rather than e2e/.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
    rest_item,
)

DESKTOP = {"width": 1280, "height": 800}
PHONE = {"width": 390, "height": 844}

# Every card shape the deck renders, so a fix that only clears exercise cards fails on circuits.
# Long names on purpose: the row ellipsises horizontally, and a short name would hide a clip.
MIXED_PLAN = [
    exercise_item("exA", "Single-Arm Dumbbell Row"),
    exercise_item(
        "exC1",
        "Kettlebell Swing",
        circuit_id="c1",
        circuitTitle="Tri-Set Metabolic Circuit",
        circuitSeries=1,
    ),
    exercise_item(
        "exC2",
        "Push Press",
        circuit_id="c1",
        circuitTitle="Tri-Set Metabolic Circuit",
        circuitSeries=1,
    ),
    rest_item("restX", 90),
    exercise_item("exB", "Hamstring & Hip Stretch"),
    exercise_item("exD", "Assault Bike"),
    exercise_item("exE", "Single-Leg Balance"),
    exercise_item("exF", "Farmer's Carry"),
]

# Reads the painted geometry of the stack: for each collapsed card, how much of it the NEXT card
# leaves uncovered, against how much of it the first line needs. Cards are siblings at the same
# z-index, so DOM order is paint order — the next card is what covers this one.
COLLAPSED_CARD_GEOMETRY = """() => {
  const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
  return cards.map((card, i) => {
    const next = cards[i + 1];
    if (!next || card.classList.contains('in-focus')) return null;
    const cardRect = card.getBoundingClientRect();
    const line = card.querySelector('.deck-card-compact');
    if (!line) return null;
    const lineRect = line.getBoundingClientRect();
    return {
      name: card.querySelector('.deck-card-name-inline')?.textContent.trim() ?? '?',
      cardHeight: Math.round(cardRect.height),
      uncovered: Math.round(next.getBoundingClientRect().top - cardRect.top),
      lineNeeds: Math.round(lineRect.bottom - cardRect.top),
    };
  }).filter(Boolean);
}"""


def _mount(page, local_server, viewport):
    page.set_viewport_size(viewport)
    load_with_stub(
        page, local_server, clipboard_stub(active_session_fixture(exercises=MIXED_PLAN))
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".exercise-deck-card")
    # The focus card animates in (cardFocusIn, 0.34s) and every card transitions its margin, so
    # sample after the stack has settled — mid-transition geometry is nobody's layout.
    page.wait_for_timeout(500)
    return page.evaluate(COLLAPSED_CARD_GEOMETRY)


def test_a_collapsed_cards_first_line_is_fully_visible_on_desktop(page, local_server):
    """A trainer scanning the deck on a laptop can read what every upcoming card is. Exercise,
    circuit and rest cards alike: the card stacked on top must not cut into the peeking row."""
    cards = _mount(page, local_server, DESKTOP)
    assert len(cards) >= 4, f"expected a stack of collapsed cards, got {cards}"

    clipped = [c for c in cards if c["uncovered"] < c["lineNeeds"]]
    assert not clipped, (
        "collapsed cards whose first line is cut off by the card above them:\n"
        + (
            "\n".join(
                f"  {c['name']}: {c['uncovered']}px visible, first line needs {c['lineNeeds']}px"
                for c in clipped
            )
        )
    )


def test_the_deck_stays_a_stack_on_a_phone(page, local_server):
    """The overlap is the point on a gym-floor phone, where vertical space is the scarce resource —
    widening it for desktop legibility must not flatten the deck into a plain list everywhere."""
    cards = _mount(page, local_server, PHONE)
    assert len(cards) >= 4, f"expected a stack of collapsed cards, got {cards}"

    assert all(c["uncovered"] < c["cardHeight"] for c in cards), (
        "collapsed cards must still overlap on a phone, not lay out end to end:\n"
        + "\n".join(
            f"  {c['name']}: {c['uncovered']}px of {c['cardHeight']}px" for c in cards
        )
    )
