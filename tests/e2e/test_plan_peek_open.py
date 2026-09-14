# tests/e2e/test_plan_peek_open.py — the sideways deck of a client's plans, opened for real (TODO
# §52.2 step 4). tests/medium/test_plan_peek.py covers the gesture and what the clipboard ASKS to
# open; this file needs the router, because the promise is where the trainer lands: the previous
# plan's clipboard for the same client, a Today control that leads back, and the planning form when
# there is no next plan. Demo data, frozen clock (tests/conftest.py).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

PHONE = {"width": 390, "height": 844}
Y = 420  # inside the deck, below the title bar and tabs
LEFT_START = 40
RIGHT_START = PHONE["width"] - 40
SESSION_URL = re.compile(r"/session/([^/]+)/client/([^/]+)")


def _open(page, local_server, title):
    page.set_viewport_size(PHONE)
    page.goto(local_server)
    card = page.locator(f".session-card:has-text('{title}')").first
    card.wait_for()
    card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(500)


def _where(page):
    return SESSION_URL.search(page.evaluate("() => location.pathname")).groups()


def _pull_and_release(page, start_x, dx):
    page.mouse.move(start_x, Y)
    page.mouse.down()
    page.mouse.move(start_x + dx, Y, steps=20)
    page.wait_for_timeout(50)
    page.mouse.up()
    page.wait_for_timeout(800)


def _text(page, selector):
    return page.locator(selector).first.evaluate("el => el.textContent")


def test_a_pull_opens_the_previous_plan_and_today_leads_back(page, local_server):
    _open(page, local_server, "Group Strength & Conditioning")
    today_id, client_id = _where(page)
    assert not page.locator("#btn-plan-today").is_visible()
    previous_exercise = _text(page, "#plan-peek-under-past .plan-sheet-name")

    _pull_and_release(page, LEFT_START, 300)

    session_id, same_client = _where(page)
    assert session_id != today_id, "the pull did not open another session"
    assert same_client == client_id, "the previous plan opened for another client"
    deck_names = page.locator(
        "#active-exercise-scroll-deck .exercise-deck-card"
    ).evaluate_all("els => els.map((el) => el.textContent)")
    assert any(previous_exercise in name for name in deck_names), (
        f"the deck does not show the previous plan's {previous_exercise!r}"
    )
    assert page.locator("#active-session-overlay").is_visible()
    blanket_pull = page.evaluate(
        "() => document.getElementById('active-session-blanket').style.getPropertyValue('--plan-pull')"
    )
    assert blanket_pull in ("", "0px"), "the blanket stayed off screen after opening"

    today = page.locator("#btn-plan-today")
    assert today.is_visible(), "no way back to today after opening the previous plan"
    today.click()
    page.wait_for_timeout(800)
    assert _where(page) == (today_id, client_id)
    assert not today.is_visible()


def test_with_no_next_plan_the_pull_opens_the_clients_planning_form(page, local_server):
    # The demo's 1:1 client has no history, no later session and no draft.
    _open(page, local_server, "1:1 Personal Training")
    _, client_id = _where(page)
    assert page.locator("#plan-peek-under-future.has-create-card").count() == 1
    assert page.locator("#plan-peek-under-past .plan-peek-under-empty").count() == 1

    _pull_and_release(page, LEFT_START, 300)
    assert page.locator("#active-session-overlay").is_visible(), (
        "with no previous plan a pull still left the clipboard"
    )

    _pull_and_release(page, RIGHT_START, -300)
    page.wait_for_selector("#view-workout-setup.active")
    assert page.locator("#active-session-overlay").is_hidden()
    assert _text(page, "#workout-setup-view-title") == "Plan Upcoming Program"
    chosen = page.locator("#setup-participants-assignment-list .participant-setup-row")
    assert chosen.evaluate_all("rows => rows.map((row) => row.dataset.clientId)") == [
        client_id
    ], "the planning form did not open for this client"


def test_a_finger_pulls_the_plan_as_a_mouse_does(page, local_server):
    """On a phone the press lands on a deck card inside .clipboard-body, a scroll container, and
    touch-action is only read up to the nearest one: without pan-y on the body itself the browser
    took the sideways move as its own pan, cancelled the pointer at 20px, and the plan never moved.
    Every other test here drives a mouse, which has no touch-action at all."""
    page.set_viewport_size(PHONE)
    cdp = page.context.new_cdp_session(page)
    cdp.send(
        "Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 1}
    )
    _open(page, local_server, "Group Strength & Conditioning")
    today_id, client_id = _where(page)

    def touch(kind, x=None):
        points = [] if x is None else [{"x": x, "y": Y}]
        cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

    touch("touchStart", LEFT_START)
    for x in range(LEFT_START + 10, LEFT_START + 301, 10):
        touch("touchMove", x)
    page.wait_for_timeout(50)
    assert page.locator("#plan-peek-under-past.is-release-ready").count() == 1, (
        "a finger could not pull the plan past the threshold"
    )
    touch("touchEnd")
    page.wait_for_timeout(800)

    session_id, same_client = _where(page)
    assert session_id != today_id
    assert same_client == client_id
