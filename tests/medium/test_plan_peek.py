# tests/medium/test_plan_peek.py — the blanket drag (TODO §52.2 step 3): press-and-hold narrows
# and densifies the current plan; a sideways drag pulls it aside to reveal the previous/next plan
# drawn underneath (planSheet.js, step 2) via controllers/planPeekController.js and
# modules/clipboard/planPeek.js. Step 4: a pull past the threshold opens what it uncovered, Today
# leads back, and a client with no next plan is offered one. There is no router in this tier, so
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

# Neighbours are sourced entirely from state.history — both a FINISHED day before the anchor and
# one after it satisfy clientSessionNeighbours.js's `previous`/`next` without needing state.sessions
# or a routine, which keeps the fixture small.
PREVIOUS_RECORD = """
state.history.push({
  id: 'hprev1', clientId: '%(client)s', routineName: 'Prev Plan', date: '2026-09-10T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(item)s],
});
""" % {
    "client": CLIENT_ID,
    "item": json.dumps(exercise_item("px1", "Prev Exercise One")),
}

NEXT_RECORD = """
state.history.push({
  id: 'hnext1', clientId: '%(client)s', routineName: 'Next Plan', date: '2026-09-18T18:00:00.000Z',
  duration: 1800, feedback: [],
  exercises: [%(item)s],
});
""" % {
    "client": CLIENT_ID,
    "item": json.dumps(exercise_item("nx1", "Next Exercise One")),
}

# No router here: record what the clipboard asks to open instead of opening it.
RECORD_OPENS_IMPORT = (
    "import { mergeAppDeps } from './controllers/activeSessionStore.js';\n"
)
RECORD_OPENS = """
window.__opened = [];
mergeAppDeps({
  navigateToPath: (path) => window.__opened.push(['route', path]),
  openPlanningForClient: (clientId) => window.__opened.push(['plan', clientId]),
});
"""


def _mount(
    page, local_server, *, previous=True, following=True, started=True, extra=""
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
        exercises=[exercise_item(f"ex{n}", f"Live Exercise {n}") for n in range(6)],
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


# ---- Step 4: opening what the pull uncovered -----------------------------------------------------

# 70 % of a 390px phone is 273px of pull; a 300px drag lands past it under the rubber band, a 200px
# drag well short of it. Both start clear of the 24px edge strip.
LEFT_START = 40
RIGHT_START = PHONE["width"] - 40


def _drag(page, start_x, dx, *, release=True):
    page.mouse.move(start_x, CENTER_Y)
    page.mouse.down()
    page.mouse.move(start_x + dx, CENTER_Y, steps=20)
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


def test_a_pull_past_the_threshold_says_release_to_open(page, local_server):
    """Past 70 % of the width the uncovered plan's header swaps to "Release to open" with the plan's
    ISO date; short of it the header keeps saying which plan this is."""
    _mount(page, local_server, started=False)

    _drag(page, LEFT_START, 200, release=False)
    assert _label_shown(page, "past", "rest")
    assert not _label_shown(page, "past", "release")
    assert "Previous plan · 2026-09-10" in page.locator(
        "#plan-peek-under-past .plan-peek-label-rest"
    ).evaluate("el => el.textContent")

    page.mouse.move(LEFT_START + 300, CENTER_Y, steps=10)
    page.wait_for_timeout(50)
    assert _label_shown(page, "past", "release"), "no release label past the threshold"
    assert not _label_shown(page, "past", "rest")
    assert (
        page.locator("#plan-peek-under-past .plan-peek-label-release").evaluate(
            "el => el.textContent"
        )
        == "Release to open · 2026-09-10"
    )
    page.mouse.up()


def test_releasing_past_the_threshold_opens_the_previous_plan_for_the_same_client(
    page, local_server
):
    _mount(page, local_server, started=False)
    _drag(page, LEFT_START, 300)
    assert _opened(page) == [["route", f"/session.client/hprev1/{CLIENT_ID}"]]
    assert _pull(page) == 0, "the blanket was not put back after opening"
    assert not _is_held(page)


def test_releasing_past_the_threshold_to_the_left_opens_the_next_plan(
    page, local_server
):
    _mount(page, local_server, started=False)
    _drag(page, RIGHT_START, -300)
    assert _opened(page) == [["route", f"/session.client/hnext1/{CLIENT_ID}"]]


def test_releasing_short_of_the_threshold_springs_back_and_opens_nothing(
    page, local_server
):
    _mount(page, local_server, started=False)
    _drag(page, LEFT_START, 200)
    assert _opened(page) == []
    assert _pull(page) == 0


def test_a_running_session_is_never_left_by_a_pull(page, local_server):
    """Opening another session replaces the one clipboard slot, so a pull from a STARTED session
    uncovers the plan but offers no release and opens nothing — a sweep between sets cannot throw
    away the session's logs."""
    _mount(page, local_server, started=True)
    _drag(page, LEFT_START, 300, release=False)
    assert not _label_shown(page, "past", "release")
    page.mouse.up()
    page.wait_for_timeout(450)
    assert _opened(page) == []


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

    _drag(page, RIGHT_START, -300, release=False)
    assert _label_shown(page, "future", "release")
    assert (
        page.locator("#plan-peek-under-future .plan-peek-label-release").evaluate(
            "el => el.textContent"
        )
        == "Release to create a plan"
    )
    page.mouse.up()
    page.wait_for_timeout(450)
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
