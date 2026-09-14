# tests/medium/test_plan_peek.py — the blanket drag (TODO §52.2 step 3): press-and-hold narrows
# and densifies the current plan; a sideways drag pulls it aside to reveal the previous/next plan
# drawn underneath (planSheet.js, step 2) via controllers/planPeekController.js and
# modules/clipboard/planPeek.js.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

PHONE = {"width": 390, "height": 844}
CENTER_X = PHONE["width"] / 2
CENTER_Y = 300  # inside the deck, well clear of either edge zone

CLIENT_ID = (
    "c1a9f0e2"  # active_session_fixture's own default (a real DEFAULT_CLIENTS id)
)
ANCHOR_DATE = "2026-09-14T18:00:00.000Z"

# Neighbours are sourced entirely from state.history — both a FINISHED day before the anchor and
# one after it satisfy clientSessionNeighbours.js's `previous`/`next` without needing state.sessions
# or a routine, which keeps the fixture small.
EXTRA_STATE = """
state.history.push({
  id: 'hprev1', clientId: '%(client)s', routineName: 'Prev Plan', date: '2026-09-10T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(prev_item)s],
});
state.history.push({
  id: 'hnext1', clientId: '%(client)s', routineName: 'Next Plan', date: '2026-09-18T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(next_item)s],
});
renderActiveGroupBoard();
""" % {
    "client": CLIENT_ID,
    "prev_item": json.dumps(exercise_item("px1", "Prev Exercise One")),
    "next_item": json.dumps(exercise_item("nx1", "Next Exercise One")),
}


def _mount(page, local_server):
    page.set_viewport_size(PHONE)
    session = active_session_fixture(
        client_id=CLIENT_ID,
        exercises=[exercise_item(f"ex{n}", f"Live Exercise {n}") for n in range(6)],
        sourceSession={
            "id": "todaySession",
            "titles": ["Today's Plan"],
            "day": "today",
            "location": "",
            "startDate": ANCHOR_DATE,
            "endDate": "2026-09-14T19:00:00.000Z",
            "timeLabel": "18:00 - 19:00",
        },
    )
    load_with_stub(page, local_server, clipboard_stub(session, extra_body=EXTRA_STATE))
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector("#active-session-blanket")
    page.wait_for_timeout(300)


def _pull(page):
    value = page.evaluate(
        "() => document.getElementById('active-session-blanket').style.getPropertyValue('--plan-pull')"
    )
    return float(value.replace("px", "")) if value else 0.0


def _is_held(page):
    return page.evaluate(
        "() => document.getElementById('active-session-blanket').classList.contains('is-held')"
    )


def _active_index(page):
    return page.evaluate(
        "() => { const el = document.querySelector('.exercise-deck-card.is-active'); "
        "return el ? Number(el.dataset.planIndex) : null; }"
    )


def test_a_hold_narrows_and_densifies_the_blanket(page, local_server):
    """250ms with no movement beyond 8px shrinks the blanket by itself, before any drag."""
    _mount(page, local_server)
    assert not _is_held(page)

    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.wait_for_timeout(400)
    assert _is_held(page), "holding for 400ms did not narrow the blanket"

    page.mouse.up()
    page.wait_for_timeout(400)
    assert not _is_held(page), "the blanket stayed narrowed after release"
    assert _pull(page) == 0


def test_a_short_tap_opens_the_card_as_before(page, local_server):
    """A press-release under the hold threshold does nothing new: no held state, and the card
    still opens exactly like a plain tap always has."""
    _mount(page, local_server)
    card = page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card[data-plan-index='2']"
    )
    box = card.bounding_box()

    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 5)
    page.mouse.down()
    page.wait_for_timeout(100)
    page.mouse.up()
    page.wait_for_timeout(150)

    assert not _is_held(page)
    assert "in-focus" in (card.get_attribute("class") or "")


def test_dragging_right_reveals_the_previous_plan(page, local_server):
    """A left-to-right drag pulls the blanket aside and uncovers the client's previous plan,
    drawn from state.history by clientSessionNeighbours.js + planSheet.js."""
    _mount(page, local_server)
    title_before = page.locator(".session-title-bar").bounding_box()["x"]
    body_before = page.locator(".clipboard-body").bounding_box()["x"]

    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.mouse.move(CENTER_X + 150, CENTER_Y, steps=15)
    page.wait_for_timeout(50)

    assert _pull(page) == 150, (
        "the blanket did not follow the finger 1:1 under the rubber-band limit"
    )
    assert _is_held(page)

    under_past = page.locator("#plan-peek-under-past")
    assert under_past.evaluate("el => getComputedStyle(el).visibility") == "visible"
    assert (
        "Prev Exercise One" in under_past.locator(".plan-sheet-name").first.inner_text()
    )

    # The session title bar and client tabs move WITH the blanket, not separately.
    title_after = page.locator(".session-title-bar").bounding_box()["x"]
    body_after = page.locator(".clipboard-body").bounding_box()["x"]
    title_shift = title_after - title_before
    body_shift = body_after - body_before
    assert title_shift > 100, f"title bar did not move with the blanket: {title_shift}"
    assert abs(title_shift - body_shift) < 1, (
        "title bar and clipboard body moved by different amounts"
    )

    page.mouse.up()
    page.wait_for_timeout(400)
    assert _pull(page) == 0
    assert not _is_held(page)


def test_dragging_left_reveals_the_next_plan(page, local_server):
    """Right-to-left uncovers the NEXT plan instead — the mirror of the previous-plan drag."""
    _mount(page, local_server)

    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.mouse.move(CENTER_X - 150, CENTER_Y, steps=15)
    page.wait_for_timeout(50)

    assert _pull(page) == -150
    under_future = page.locator("#plan-peek-under-future")
    assert under_future.evaluate("el => getComputedStyle(el).visibility") == "visible"
    assert (
        "Next Exercise One"
        in under_future.locator(".plan-sheet-name").first.inner_text()
    )
    assert (
        page.locator("#plan-peek-under-past").evaluate(
            "el => getComputedStyle(el).visibility"
        )
        == "hidden"
    )

    page.mouse.up()
    page.wait_for_timeout(400)


def test_a_press_near_the_screen_edge_is_ignored(page, local_server):
    """The phone's own back gesture owns the outer 24px — a press starting there never becomes a
    peek, however far it then moves."""
    _mount(page, local_server)

    page.mouse.move(10, CENTER_Y)
    page.mouse.down()
    page.wait_for_timeout(400)
    assert not _is_held(page), "a hold starting on the edge strip narrowed the blanket"

    page.mouse.move(160, CENTER_Y, steps=10)
    page.wait_for_timeout(50)
    assert _pull(page) == 0, "a drag starting on the edge strip still moved the blanket"

    page.mouse.up()


_SCROLL_THE_DECK_AS_THE_BROWSER_WOULD = """(dy) => {
  // A finger on a phone fires touchmove, which opens deckScrollFocus.js's "the trainer scrolled"
  // window; the rows then shrink or grow and the browser moves the scroll position on its own.
  window.dispatchEvent(new Event('touchmove'));
  const body = document.querySelector('#active-session-overlay .clipboard-body');
  body.scrollTop += dy;
}"""


def test_holding_and_releasing_the_plan_leaves_the_active_card_where_it_was(
    page, local_server
):
    """The rows get denser while the plan is held and grow back on release, and the browser answers
    both with a scroll of its own. On a phone a touchmove has just marked that window as the
    trainer's scrolling, so §48.1's rule would pick another active card. It must not: the trainer
    did not scroll, the plan changed shape under the finger."""
    _mount(page, local_server)
    before = _active_index(page)
    assert before is not None

    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.wait_for_timeout(400)
    assert _is_held(page)
    page.evaluate(_SCROLL_THE_DECK_AS_THE_BROWSER_WOULD, 220)
    page.wait_for_timeout(300)
    assert _active_index(page) == before, (
        "the held plan's own reflow moved the active card"
    )

    page.evaluate("() => window.dispatchEvent(new Event('touchmove'))")
    page.mouse.up()
    page.evaluate(_SCROLL_THE_DECK_AS_THE_BROWSER_WOULD, -120)
    page.wait_for_timeout(300)
    assert _active_index(page) == before, (
        "the plan growing back on release moved the active card"
    )


def test_a_vertical_drag_is_left_as_a_scroll(page, local_server):
    """Movement that is mostly vertical is a normal scroll, not a peek: no offset, and the active
    card is undisturbed."""
    _mount(page, local_server)
    before = _active_index(page)

    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.mouse.move(CENTER_X + 3, CENTER_Y + 150, steps=10)
    page.wait_for_timeout(50)

    assert _pull(page) == 0, "a vertical drag moved the blanket sideways"
    assert not _is_held(page)
    assert _active_index(page) == before

    page.mouse.up()
