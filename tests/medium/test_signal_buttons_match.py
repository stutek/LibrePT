# tests/medium/test_signal_buttons_match.py
# The same three actions look the same wherever they are (reported 2026-08-22: "comparing the Assault
# Bike card with the Leg & Hinge circuit shows 2 incompatible button styles").
#
# Too Easy / Too Hard / Notes appear on a standalone exercise card and on every row inside a circuit.
# They mean the same thing and are tapped with the same thumb, and they had drifted into two looks —
# grey and 32px tall in a circuit, coloured and 40px on a card. A trainer learns one vocabulary at
# the start of a session and meets another halfway through it (TODO §7.2 says so in words; this says
# it in a way that fails).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

pytestmark = pytest.mark.clean_start

# One standalone exercise and one circuit, so both surfaces are on screen at once.
PLAN = [
    exercise_item("solo", "Assault Bike"),
    exercise_item("c1a", "Back Squat", circuit_id="circ"),
    exercise_item("c1b", "Romanian Deadlift", circuit_id="circ"),
]


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(
        page, local_server, clipboard_stub(active_session_fixture(exercises=PLAN))
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _focus(page, index):
    """Bring one deck card into focus — the actions only render on the focused card, and the deck is
    its own scroll container, so the card has to be scrolled to before it can be tapped."""
    card = page.locator(".exercise-deck-card").nth(index)
    card.scroll_into_view_if_needed()
    card.click(force=True)
    page.wait_for_timeout(300)


def _look_of(page, selector):
    return page.evaluate(
        """(selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const style = getComputedStyle(el);
          return {
            height: Math.round(el.getBoundingClientRect().height),
            radius: style.borderRadius,
            colour: style.color,
            border: style.borderColor,
          };
        }""",
        selector,
    )


def _both_looks(page, local_server):
    """What Too Easy looks like on a standalone card, and on a row inside a circuit.

    Captured one after the other rather than side by side: only the focused card renders its
    actions, which is the deck's own rule and not something this test should work around.
    """
    _mount(page, local_server)
    _focus(page, 0)
    card = _look_of(page, ".deck-action-easy")
    _focus(page, 1)
    circuit = _look_of(page, ".circuit-sig.easy")
    assert card and circuit, (
        "both surfaces must render their own Too Easy for this to mean anything"
    )
    return card, circuit


def test_too_easy_looks_the_same_on_a_card_and_in_a_circuit(page, local_server):
    card, circuit = _both_looks(page, local_server)

    assert card["colour"] == circuit["colour"], (
        f"Too Easy is {card['colour']} on a card and {circuit['colour']} in a circuit"
    )
    assert card["radius"] == circuit["radius"]
    assert card["border"] == circuit["border"]


def test_neither_surface_shrinks_the_target_below_a_thumb(page, local_server):
    """The circuit rows were 32px tall — under what this app promises everywhere else (§7.1)."""
    card, circuit = _both_looks(page, local_server)

    assert card["height"] >= 36, f"the card's button is {card['height']}px tall"
    assert circuit["height"] >= 36, (
        f"the circuit row's button is {circuit['height']}px tall"
    )
