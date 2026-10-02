# tests/medium/test_plan_peek.py — the blanket drag: press-and-hold narrows
# and densifies the current plan; a sideways drag pulls it aside to reveal the previous/next plan
# drawn underneath (planSheet.js, step 2) via controllers/planPeekController.js and
# modules/clipboard/planPeek.js. Opening is an L (Simon, 2026-09-30): the sideways pull only
# uncovers, and a second, upward stroke opens what it uncovered. Today leads back, and a client with
# no next plan is offered one. There is no router in this tier, so
# those tests assert what the clipboard ASKED to open; tests/e2e/test_plan_peek_open.py opens it.
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

# Neighbours are sourced entirely from the finished programs (state.clientPrograms) — both a FINISHED day before the anchor and
# one after it satisfy clientSessionNeighbours.js's `previous`/`next` without needing state.sessions
# or a routine, which keeps the fixture small.
PREVIOUS_RECORD = """
recordTrainings(state, [{
  id: 'hprev1', clientId: '%(client)s', routineName: 'Prev Plan', date: '2026-09-10T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(item)s],
}]);
""" % {
    "client": CLIENT_ID,
    "item": json.dumps(exercise_item("px1", "Prev Exercise One")),
}

NEXT_RECORD = """
recordTrainings(state, [{
  id: 'hnext1', clientId: '%(client)s', routineName: 'Next Plan', date: '2026-09-18T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(item)s],
}]);
""" % {
    "client": CLIENT_ID,
    "item": json.dumps(exercise_item("nx1", "Next Exercise One")),
}

# No router here: record what the clipboard asks to open instead of opening it.
RECORD_OPENS_IMPORT = (
    "import { mergeAppDeps } from './controllers/activeSessionStore.js';\n"
    "import { recordTrainings } from './data/trainingRecords.js';\n"
)
RECORD_OPENS = """
window.__opened = [];
mergeAppDeps({
  navigateToPath: (path) => window.__opened.push(['route', path]),
  openPlanningForClient: (clientId) => window.__opened.push(['plan', clientId]),
});
"""


def _mount(
    page,
    local_server,
    *,
    previous=True,
    following=True,
    started=True,
    extra="",
    live_exercises=None,
):
    """`started` defaults to the fixture's own True (a running session), which is what the step 3
    tests were written against; the step 4 tests that open something pass False."""
    page.set_viewport_size(PHONE)
    body = (
        (PREVIOUS_RECORD if previous else "")
        + (NEXT_RECORD if following else "")
        + extra
        + RECORD_OPENS
        + "renderActiveGroupBoard();\n"
    )
    session = active_session_fixture(
        client_id=CLIENT_ID,
        exercises=live_exercises
        or [exercise_item(f"ex{n}", f"Live Exercise {n}") for n in range(6)],
        started=started,
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
    load_with_stub(
        page,
        local_server,
        clipboard_stub(session, extra_imports=RECORD_OPENS_IMPORT, extra_body=body),
    )
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
    drawn from the finished programs by clientSessionNeighbours.js + planSheet.js."""
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
    trainer's scrolling, so the active-card rule would pick another active card. It must not: the trainer
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


# ---- Aligned to the exercise in focus -------------------------------------------------------------


def _begin_a_peek(page):
    """Press and hold until the plan narrows and the neighbours show. Alignment is measured as the
    peek BEGINS, not when the sheets were drawn, so nothing is lined up before this."""
    page.mouse.move(CENTER_X, CENTER_Y)
    page.mouse.down()
    page.wait_for_timeout(400)


def _row_and_card_tops(page, name):
    """Where last time's row for this movement sits, and where the card in focus sits — both in
    screen coordinates, which is the only place the two can be compared."""
    return page.evaluate(
        """(name) => {
          const key = name.trim().replace(/\\s+/g, ' ').toLowerCase();
          const row = document.querySelector(
            `#plan-peek-under-past .plan-sheet-row[data-exercise-name="${key}"]`);
          const card = document.querySelector(
            '#active-exercise-scroll-deck .exercise-deck-card.is-active, ' +
            '#active-exercise-scroll-deck .exercise-deck-card.in-focus');
          return row && card
            ? [row.getBoundingClientRect().top, card.getBoundingClientRect().top]
            : null;
        }""",
        name,
    )


# The live plan and the previous one share ONE movement name, in different positions: the shared
# row is the whole basis of the alignment, and a plan that shared every name would not show whether
# the right row was chosen.
SHARED_MOVEMENT = "Barbell Back Squat"
PREVIOUS_WITH_SHARED_MOVEMENT = """
recordTrainings(state, [{
  id: 'hprev1', clientId: '%(client)s', routineName: 'Prev Plan', date: '2026-09-10T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(first)s, %(second)s, %(third)s],
}]);
""" % {
    "client": CLIENT_ID,
    "first": json.dumps(exercise_item("px1", "Prev Exercise One")),
    "second": json.dumps(exercise_item("px2", "Prev Exercise Two")),
    "third": json.dumps(exercise_item("px3", SHARED_MOVEMENT)),
}


def test_the_previous_plan_is_aligned_to_the_movement_in_focus(page, local_server):
    """ "What did they lift last time" is the number read most often on the gym floor, and it is now
    read beside the card that asks it: the uncovered plan slides until the row naming the same
    movement sits level with the exercise in focus. Here that movement is LAST in the previous plan
    and FIRST in the live one, so an unaligned sheet would put them far apart."""
    _mount(
        page,
        local_server,
        previous=False,
        started=False,
        live_exercises=[exercise_item("ex0", SHARED_MOVEMENT)]
        + [exercise_item(f"ex{n}", f"Live Exercise {n}") for n in range(1, 6)],
        extra=PREVIOUS_WITH_SHARED_MOVEMENT,
    )
    _begin_a_peek(page)

    tops = _row_and_card_tops(page, SHARED_MOVEMENT)
    assert tops is not None, (
        "the shared movement is not in both the plan sheet and the deck"
    )
    row_top, card_top = tops
    assert abs(row_top - card_top) <= 1, (
        f"last time's {SHARED_MOVEMENT} is {abs(row_top - card_top):.0f}px from the card in focus"
    )


def test_a_plan_with_no_movement_in_common_is_not_moved(page, local_server):
    """No shared row, nothing to line up: the plan shows from its top, as it did before any of this."""
    _mount(page, local_server, started=False)
    _begin_a_peek(page)

    offset = page.evaluate(
        "() => document.querySelector('#plan-peek-under-past .plan-sheet')"
        ".style.getPropertyValue('--peek-align')"
    )
    assert offset == "", f"a plan sharing no movement was shifted by {offset!r}"


# ---- Opening what the pull uncovered: the L ------------------------------------------------------

# A quarter of a 390px phone is 98px of pull, so a 200px drag arms the gesture and a 60px one does
# not. Both start clear of the 24px edge strip. The upward stroke is 64px (planPeek.js OPEN_UP_PX),
# so 90px is clearly past it and 30px clearly short.
LEFT_START = 40
RIGHT_START = PHONE["width"] - 40
UP_ENOUGH = 90
UP_TOO_LITTLE = 30


def _drag(page, start_x, dx, *, release=True):
    """The sideways stroke on its own: the look. It opens nothing, however far it goes."""
    page.mouse.move(start_x, CENTER_Y)
    page.mouse.down()
    page.mouse.move(start_x + dx, CENTER_Y, steps=20)
    page.wait_for_timeout(50)
    if release:
        page.mouse.up()
        page.wait_for_timeout(450)


def _drag_then_up(page, start_x, dx, up=UP_ENOUGH, *, release=True):
    """The whole L: pull aside, then up without lifting the finger."""
    page.mouse.move(start_x, CENTER_Y)
    page.mouse.down()
    page.mouse.move(start_x + dx, CENTER_Y, steps=20)
    page.wait_for_timeout(50)
    page.mouse.move(start_x + dx, CENTER_Y - up, steps=10)
    page.wait_for_timeout(50)
    if release:
        page.mouse.up()
        page.wait_for_timeout(450)


def _opened(page):
    return page.evaluate("() => window.__opened")


def _label_shown(page, layer, part):
    return page.locator(f"#plan-peek-under-{layer} .plan-peek-label-{part}").evaluate(
        "el => getComputedStyle(el).display !== 'none'"
    )


def test_a_pull_that_uncovers_enough_says_slide_up_to_open(page, local_server):
    """Once a quarter of the width is uncovered, the plan's header swaps to "Slide up to open" with
    its ISO date; short of that the header keeps saying which plan this is."""
    _mount(page, local_server, started=False)

    _drag(page, LEFT_START, 60, release=False)
    assert _label_shown(page, "past", "rest")
    assert not _label_shown(page, "past", "open")
    assert "Previous plan · 2026-09-10" in page.locator(
        "#plan-peek-under-past .plan-peek-label-rest"
    ).evaluate("el => el.textContent")

    page.mouse.move(LEFT_START + 200, CENTER_Y, steps=10)
    page.wait_for_timeout(50)
    assert _label_shown(page, "past", "open"), "the gesture was not armed by the pull"
    assert not _label_shown(page, "past", "rest")
    assert (
        page.locator("#plan-peek-under-past .plan-peek-label-open").evaluate(
            "el => el.textContent"
        )
        == "Slide up to open · 2026-09-10"
    )
    page.mouse.up()


def test_an_upward_stroke_opens_the_previous_plan_for_the_same_client(
    page, local_server
):
    """The L: pulled aside, then up. The second stroke is what opens."""
    _mount(page, local_server, started=False)
    _drag_then_up(page, LEFT_START, 200)
    assert _opened(page) == [["route", f"/session.client/hprev1/{CLIENT_ID}"]]
    assert _pull(page) == 0, "the blanket was not put back after opening"
    assert not _is_held(page)


def test_an_upward_stroke_to_the_left_opens_the_next_plan(page, local_server):
    _mount(page, local_server, started=False)
    _drag_then_up(page, RIGHT_START, -200)
    assert _opened(page) == [["route", f"/session.client/hnext1/{CLIENT_ID}"]]


def test_a_release_never_opens_however_far_the_pull_went(page, local_server):
    """The whole point of the change (Simon, 2026-09-30): looking is free at every distance. A pull
    of 300px on a 390px phone is as far as the gesture goes, and letting go there still opens
    nothing — before, that release navigated."""
    _mount(page, local_server, started=False)
    _drag(page, LEFT_START, 300)
    assert _opened(page) == []
    assert _pull(page) == 0


def test_an_upward_stroke_after_too_little_pull_opens_nothing(page, local_server):
    """Up alone is not the gesture: with almost nothing uncovered there is nothing to open, so a
    thumb flicking up off a barely-moved plan leaves the session where it is."""
    _mount(page, local_server, started=False)
    _drag_then_up(page, LEFT_START, 60)
    assert _opened(page) == []
    assert _pull(page) == 0


def test_an_upward_stroke_that_is_too_short_opens_nothing(page, local_server):
    """The rise has to be deliberate. 30px is the thumb drifting as it lets go of a long pull, not
    a second stroke."""
    _mount(page, local_server, started=False)
    _drag_then_up(page, LEFT_START, 200, up=UP_TOO_LITTLE)
    assert _opened(page) == []


def test_the_plan_stays_where_it_was_pulled_while_the_finger_travels_up(
    page, local_server
):
    """The finger leaves the horizontal line it pulled along, and a plan that followed it back would
    close over the very rows the trainer is reading. It stays where it was pulled to."""
    _mount(page, local_server, started=False)
    page.mouse.move(LEFT_START, CENTER_Y)
    page.mouse.down()
    page.mouse.move(LEFT_START + 200, CENTER_Y, steps=20)
    page.wait_for_timeout(50)
    assert _pull(page) == 200

    # Up and sideways at once — the thumb's own arc. Only the rise counts.
    page.mouse.move(LEFT_START + 140, CENTER_Y - 40, steps=10)
    page.wait_for_timeout(50)
    assert _pull(page) == 200, (
        "the plan slid back while the second stroke was being made"
    )
    assert _opened(page) == [], "40px of rise is not the stroke"
    page.mouse.up()


def test_a_running_session_is_never_left_by_a_pull(page, local_server):
    """Opening another session replaces the one clipboard slot, so a pull from a STARTED session
    uncovers the plan but is never armed and opens nothing — a sweep between sets cannot throw away
    the session's logs."""
    _mount(page, local_server, started=True)
    _drag(page, LEFT_START, 200, release=False)
    assert not _label_shown(page, "past", "open")
    page.mouse.up()
    page.wait_for_timeout(450)
    assert _opened(page) == []

    _drag_then_up(page, LEFT_START, 200)
    assert _opened(page) == [], "an upward stroke left a running session"


def test_with_no_next_plan_the_future_layer_offers_to_create_one(page, local_server):
    _mount(page, local_server, started=False, following=False)
    card = page.locator("#plan-peek-under-future .plan-peek-create-card")
    assert card.evaluate("el => el.textContent").startswith(
        "Jane Doe has no next plan yet."
    )
    assert (
        card.locator(".plan-peek-create-cell").evaluate("el => el.textContent")
        == "Create a plan"
    )

    _drag(page, RIGHT_START, -200, release=False)
    assert _label_shown(page, "future", "open")
    assert (
        page.locator("#plan-peek-under-future .plan-peek-label-open").evaluate(
            "el => el.textContent"
        )
        == "Slide up to create a plan"
    )
    page.mouse.up()
    page.wait_for_timeout(450)
    assert _opened(page) == [], "letting go of the pull opened the planning form"

    _drag_then_up(page, RIGHT_START, -200)
    assert _opened(page) == [["plan", CLIENT_ID]]


def test_with_no_previous_plan_the_past_layer_says_so_and_nothing_opens(
    page, local_server
):
    _mount(page, local_server, started=False, previous=False)
    assert (
        page.locator("#plan-peek-under-past .plan-peek-under-empty").evaluate(
            "el => el.textContent"
        )
        == "No previous plan."
    )
    _drag(page, LEFT_START, 300, release=False)
    assert _pull(page) < 300 * 0.3, "with nothing behind it the pull did not resist"
    page.mouse.up()
    page.wait_for_timeout(450)
    assert _opened(page) == []

    _drag_then_up(page, LEFT_START, 300)
    assert _opened(page) == [], "an upward stroke opened a side with no plan on it"


# The frozen clock's day (tests/conftest.py FROZEN_NOW) — the fixture's own session is 2026-09-14,
# so a client session on this date is "today" and the clipboard is showing another one.
TODAY_SESSION = (
    """
state.sessions.push({
  id: 'sToday', title: 'Today Group', participants: ['%s'], routineId: 'r1',
  startDate: '2026-08-19T17:00:00.000Z', time: '17:00 - 18:00',
});
"""
    % CLIENT_ID
)


def test_today_leads_back_to_the_clients_session_today(page, local_server):
    _mount(page, local_server, started=False, extra=TODAY_SESSION)
    today = page.locator("#btn-plan-today")
    assert today.is_visible(), "Today is not offered while another session is shown"
    box = today.bounding_box()
    assert box["height"] >= 44 and box["width"] >= 44
    assert today.get_attribute("aria-label") == "Back to today's session"
    assert "Today" in today.inner_text()

    today.click()
    assert _opened(page) == [["route", f"/session.client/sToday/{CLIENT_ID}"]]


def test_today_is_not_offered_with_no_session_today(page, local_server):
    _mount(page, local_server, started=False)
    assert not page.locator("#btn-plan-today").is_visible()


def test_today_is_not_offered_on_todays_own_session(page, local_server):
    """The clipboard's own session (sourceSession id `todaySession`) is the client's session today."""
    _mount(
        page,
        local_server,
        started=False,
        extra=TODAY_SESSION.replace("'sToday'", "'todaySession'"),
    )
    assert not page.locator("#btn-plan-today").is_visible()
