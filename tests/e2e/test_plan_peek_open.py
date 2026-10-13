# tests/e2e/test_plan_peek_open.py — the sideways deck of a client's plans, opened for real.
# tests/medium/test_plan_peek.py covers the gesture and what the clipboard ASKS to
# open; this file needs the router, because the promise is where the trainer lands: the previous
# plan's clipboard for the same client, a Today control that leads back, and the planning form when
# there is no next plan. Demo data, frozen clock (tests/conftest.py).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re
import time

import pytest

PHONE = {"width": 390, "height": 844}
Y = 420  # inside the deck, below the title bar and tabs
LEFT_START = 40
RIGHT_START = PHONE["width"] - 40
SESSION_URL = re.compile(r"/session/([^/]+)/client/([^/]+)")


def _open(page, local_server, title, phone=PHONE):
    page.set_viewport_size(phone)
    page.goto(local_server)
    card = page.locator(f".session-card:has-text('{title}')").first
    card.wait_for()
    card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(500)


def _where(page):
    return SESSION_URL.search(page.evaluate("() => location.pathname")).groups()


UP = 90  # past planPeek.js's OPEN_UP_PX of 64


def _pull_then_up(page, start_x, dx):
    """The L: pull the plan aside, then up without lifting the finger. The upward stroke is what
    opens (Simon, 2026-09-30) — a release on its own only springs the plan back."""
    page.mouse.move(start_x, Y)
    page.mouse.down()
    page.mouse.move(start_x + dx, Y, steps=20)
    page.wait_for_timeout(50)
    page.mouse.move(start_x + dx, Y - UP, steps=10)
    page.wait_for_timeout(50)
    page.mouse.up()
    page.wait_for_timeout(800)


def _text(page, selector):
    return page.locator(selector).first.evaluate("el => el.textContent")


def test_an_upward_stroke_opens_the_previous_plan_and_today_leads_back(
    page, local_server
):
    _open(page, local_server, "Group Strength & Conditioning")
    today_id, client_id = _where(page)
    assert not page.locator("#btn-plan-today").is_visible()
    previous_exercise = _text(page, "#plan-peek-under-past .plan-sheet-name")

    _pull_then_up(page, LEFT_START, 200)

    session_id, same_client = _where(page)
    assert session_id != today_id, "the upward stroke did not open another session"
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


def test_the_mirrored_stroke_walks_forward_again_through_both_kinds_of_session(
    page, local_server
):
    """Walking back through a client's sessions must not be one-way. Back from today opens a
    finished record; forward from there opens the series' stored evening, a scheduled row; forward
    from that opens the next scheduled session. Each forward step lands on the plan the layer under
    the deck named."""
    _open(page, local_server, "Group Strength & Conditioning")
    _pull_then_up(page, LEFT_START, 200)
    seen = [_where(page)]

    for _ in range(2):
        next_exercise = _text(page, "#plan-peek-under-future .plan-sheet-name")
        _pull_then_up(page, RIGHT_START, -200)
        session_id, client_id = _where(page)
        assert session_id not in [s for s, _ in seen], (
            f"the forward stroke did not open another session: {seen}"
        )
        assert client_id == seen[0][1], "the next plan opened for another client"
        deck_names = page.locator(
            "#active-exercise-scroll-deck .exercise-deck-card"
        ).evaluate_all("els => els.map((el) => el.textContent)")
        assert any(next_exercise in name for name in deck_names), (
            f"the deck does not show the next plan's {next_exercise!r}"
        )
        seen.append((session_id, client_id))


def test_with_no_next_plan_the_gesture_opens_the_clients_planning_form(
    page, local_server
):
    # The demo's 1:1 client has no history, no later session and no draft.
    _open(page, local_server, "1:1 Personal Training")
    _, client_id = _where(page)
    assert page.locator("#plan-peek-under-future.has-create-card").count() == 1
    assert page.locator("#plan-peek-under-past .plan-peek-under-empty").count() == 1

    _pull_then_up(page, LEFT_START, 200)
    assert page.locator("#active-session-overlay").is_visible(), (
        "with no previous plan the gesture still left the clipboard"
    )

    _pull_then_up(page, RIGHT_START, -200)
    page.wait_for_selector("#view-workout-setup.active")
    assert page.locator("#active-session-overlay").is_hidden()
    assert _text(page, "#workout-setup-view-title") == "Plan upcoming programme"
    chosen = page.locator("#setup-participants-assignment-list .participant-setup-row")
    assert chosen.evaluate_all("rows => rows.map((row) => row.dataset.clientId)") == [
        client_id
    ], "the planning form did not open for this client"


def test_a_finger_makes_the_L_as_a_mouse_does(page, local_server):
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

    def touch(kind, x=None, y=Y):
        points = [] if x is None else [{"x": x, "y": y}]
        cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

    touch("touchStart", LEFT_START)
    for x in range(LEFT_START + 10, LEFT_START + 201, 10):
        touch("touchMove", x)
    page.wait_for_timeout(50)
    assert page.locator("#plan-peek-under-past.is-open-ready").count() == 1, (
        "a finger could not pull the plan far enough to arm the gesture"
    )
    # The second stroke, with the same finger still down.
    for y in range(Y - 10, Y - UP - 1, -10):
        touch("touchMove", LEFT_START + 200, y)
    touch("touchEnd")
    page.wait_for_timeout(800)

    session_id, same_client = _where(page)
    assert session_id != today_id
    assert same_client == client_id


# A thumb's L, as a phone reports it: events 16ms apart (a slow, deliberate thumb), the sideways part
# wobbling a pixel or two, a bend rather than a corner, and the upward part drifting on outward as
# the thumb pivots at its base. The clean straight lines above never drift, so they never showed that
# a pull still deepening as the finger rose moved the point the rise was measured from along with
# it: the rise stayed near zero and nothing opened.
def _finger_l(page, cdp, start_x, direction, outward_drift_per_step):
    page.evaluate(
        "() => { window.__cancels = 0; window.addEventListener('pointercancel', "
        "() => { window.__cancels += 1; }); }"
    )

    def touch(kind, x=None, y=Y):
        points = [] if x is None else [{"x": x, "y": y}]
        cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})
        time.sleep(0.016)

    x, y = start_x, Y
    touch("touchStart", x, y)
    for step in range(12):
        x += direction * 10
        y = Y + (1, 0, 2, 1, 0)[step % 5]
        touch("touchMove", x, y)
    for dx, dy in ((8, -1), (6, -2), (5, -4), (4, -5), (3, -6)):
        x += direction * dx
        y += dy
        touch("touchMove", x, y)
    for _ in range(15):
        x += direction * outward_drift_per_step
        y -= 6
        touch("touchMove", x, y)
    touch("touchEnd")
    page.wait_for_timeout(800)
    return page.evaluate("() => window.__cancels")


# Simon's phone (2026-10-13): a Samsung Galaxy S23 Ultra with Chrome on Android, default zoom. His
# screenshot is 1080 device px wide and the page saw about 326 CSS px of it, so 3.3 device px to a
# CSS px. The height is a guess (the screenshot includes the status bar and Chrome's own toolbar);
# the test only needs Y inside the deck. The user agent is the reduced one Chrome on Android sends,
# which names no model.
GALAXY_S23_ULTRA = {
    "viewport": {"width": 326, "height": 600},
    "device_scale_factor": 3.3,
    "is_mobile": True,
    "has_touch": True,
    "user_agent": (
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/129.0.0.0 Mobile Safari/537.36"
    ),
}
PHONES = [
    pytest.param(PHONE, id="390x844"),
    pytest.param(
        GALAXY_S23_ULTRA["viewport"],
        id="galaxy-s23-ultra",
        marks=pytest.mark.browser_context_args(**GALAXY_S23_ULTRA),
    ),
]


def _touch_page(page, local_server, phone):
    cdp = page.context.new_cdp_session(page)
    cdp.send(
        "Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 1}
    )
    _open(page, local_server, "Group Strength & Conditioning", phone)
    assert page.evaluate("() => innerWidth") == phone["width"], (
        "the phone's width is not emulated"
    )
    return cdp


@pytest.mark.parametrize("phone", PHONES)
def test_a_thumb_that_drifts_outward_as_it_rises_still_opens(page, local_server, phone):
    cdp = _touch_page(page, local_server, phone)
    today_id, client_id = _where(page)

    cancels = _finger_l(page, cdp, LEFT_START + 20, 1, outward_drift_per_step=2)

    assert cancels == 0, "the browser took the touch back (pointercancel) mid-gesture"
    session_id, same_client = _where(page)
    assert session_id != today_id, (
        "an upward stroke drifting 2px outward per 6px of rise did not open the previous plan"
    )
    assert same_client == client_id


@pytest.mark.parametrize("phone", PHONES)
def test_a_thumb_drifting_outward_opens_the_next_plan_too(page, local_server, phone):
    cdp = _touch_page(page, local_server, phone)
    today_id, _ = _where(page)

    _finger_l(page, cdp, phone["width"] - 60, -1, outward_drift_per_step=3)

    assert _where(page)[0] != today_id, (
        "an upward stroke drifting 3px outward per 6px of rise did not open the next plan"
    )


# Held, the plan narrows by 30px on each side (planPeek.css `.is-held`; Simon halved it from 60px
# on 2026-10-13, because it shrank more than he expected). On the narrowest phones and in each
# language, every status badge must still be whole and on one line inside its card: at 60px,
# "Upcoming" was cut at 330px and narrower. Long exercise names are not asserted: they end in an
# ellipsis on phones narrower than 390px whether the plan is held or not. The demo is loaded in the
# language under test, so the badges and names are that language's.
GROUP_SESSION = {
    "en": "Group Strength & Conditioning",
    "sl": "Skupinska moč in kondicija",
    "de": "Kraft & Kondition (Gruppe)",
}
CUT_OR_WRAPPED = """() => {
  const lines = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
  };
  return [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')]
    .flatMap((card) => {
      const right = card.getBoundingClientRect().right;
      return [...card.querySelectorAll('.deck-card-status')]
        .map((el) => ({
          text: el.textContent.trim(),
          cut: el.scrollWidth > el.clientWidth + 1,
          lines: lines(el),
          outside: el.getBoundingClientRect().right > right + 0.5,
        }))
        .filter((badge) => badge.cut || badge.lines > 1 || badge.outside);
    });
}"""


# A card moving or narrowing mid-measurement is not the layout the trainer reads.
SETTLED = "() => document.getAnimations().every((a) => a.playState !== 'running')"


@pytest.mark.parametrize("lang", ["sl", "en", "de"])
@pytest.mark.parametrize("width", [320, 326, 360, 390])
def test_a_held_plan_keeps_every_status_badge_whole(page, local_server, width, lang):
    page.set_viewport_size({"width": width, "height": 844})
    page.goto(f"{local_server}?init=demo_data_load&lang={lang}")
    card = page.locator(f".session-card:has-text('{GROUP_SESSION[lang]}')").first
    card.wait_for()
    card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(500)

    page.mouse.move(width / 2, Y)
    page.mouse.down()
    page.wait_for_timeout(500)
    assert page.locator("#active-session-blanket.is-held").count() == 1
    page.wait_for_function(SETTLED)
    cut = page.evaluate(CUT_OR_WRAPPED)
    page.mouse.up()

    assert cut == [], (
        f"held at {width}px in {lang}, these badges are cut or wrapped: {cut}"
    )


# Chrome sets :hover on the element a finger presses (Blink's gesture_manager.cc, ShowPress and
# TapDown) and on a phone leaves it there after the finger lifts. The collapsed card's hover lift
# (exerciseDeckOfCards.css) then stayed on the card a pull began from after the plan sprang back:
# 5px wider than its neighbours and tilted differently (Simon, 2026-10-13, walkthrough step 2 of 6).
# Emulated touch does not leave :hover behind, so the test sets it through DevTools, as the phone
# would, on a phone profile whose pointer cannot hover.
CARD_LOOKS = """() => {
  const look = (card) => {
    const style = getComputedStyle(card);
    return { transform: style.transform, border: style.borderTopColor, opacity: style.opacity };
  };
  const cards = [...document.querySelectorAll(
    '#active-exercise-scroll-deck .exercise-deck-card:not(.in-focus):not(.completed):not(.rest-card)')];
  return cards.map(look);
}"""


@pytest.mark.browser_context_args(**GALAXY_S23_ULTRA)
def test_a_card_left_in_hover_by_a_finger_looks_like_its_neighbours(page, local_server):
    _touch_page(page, local_server, GALAXY_S23_ULTRA["viewport"])
    assert page.evaluate("() => matchMedia('(hover: none)').matches"), (
        "this phone can hover"
    )
    # The click that opened the session leaves the mouse, and its :hover, over the deck.
    page.mouse.move(0, 0)
    page.wait_for_timeout(500)
    looks = page.evaluate(CARD_LOOKS)
    assert len(looks) >= 2 and looks[0] == looks[1], (
        "the collapsed cards differ before any press"
    )

    cdp = page.context.new_cdp_session(page)
    cdp.send("DOM.enable")
    cdp.send("CSS.enable")
    root = cdp.send("DOM.getDocument")["root"]["nodeId"]
    card = cdp.send(
        "DOM.querySelector",
        {
            "nodeId": root,
            "selector": "#active-exercise-scroll-deck .exercise-deck-card:not(.in-focus)"
            ":not(.completed):not(.rest-card)",
        },
    )["nodeId"]
    cdp.send("CSS.forcePseudoState", {"nodeId": card, "forcedPseudoClasses": ["hover"]})
    page.wait_for_timeout(500)

    hovered, neighbour = page.evaluate(CARD_LOOKS)[:2]
    assert hovered == neighbour, (
        f"a card left in :hover by a finger looks different from its neighbour: {hovered}"
    )
