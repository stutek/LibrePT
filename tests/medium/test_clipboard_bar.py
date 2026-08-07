# tests/medium/test_clipboard_bar.py
# The live-clipboard bar: the strip in the notification handle bar that says a clipboard is running
# and takes one tap back into it.
#
# Why it exists at all: the clipboard is an overlay dismissed by a swipe-down or the grab handle, so
# leaving it by accident is ordinary on a phone. Without this bar the way back is home → scroll →
# find the right card, which is a SEARCH task on the gym floor, and overtime is invisible until you
# navigate back to look.
#
# The rule this file guards hardest: THE BAR NAMES THE CLIPBOARD, NEVER "THE SESSION". A clipboard
# can be several overlapping booked slots merged into one (`buildSessionMeta` collapses them, so
# `titles` and `ids` are lists), so a label built from one title would be wrong for exactly the
# group case the app was built for.
#
# Medium tier, not e2e: this is a component rendering against real index.html markup with injected
# state — no router, no persistence, no session lifecycle.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

from tests.medium._harness import load_with_stub, view_stub

BAR = "#clipboard-bar"


def _bar_stub(source_session):
    """Mount the notification area (which owns the handle bar the clipboard bar lives in) plus the
    bar itself, with an injected active session. Boot order matters and is asserted by doing it the
    way production does: the notification shell must exist before the bar mounts into it."""
    return view_stub(
        imports="""
import { bootNotificationArea, bootSessionBar } from './appBoot.js';
import { renderClipboardBar } from './modules/session/sessionBar.js';
""",
        view_id="clients",
        body="""
const state = { lang: 'en', clients: [], exercises: [], routines: [], sessions: [], history: [],
                planUpdates: [], notifications: [] };
const activeSession = __SESSION__;

let navigatedTo = null;
window.__navigatedTo = () => navigatedTo;

bootNotificationArea({
  getState: () => state,
  getActiveSession: () => activeSession,
  t,
  navigateToPath: noop,
  urlFor: (name) => `/${name}`,
  saveToLocalStorage: noop,
  renderSessions: noop,
  resetLibrePTData: noop,
  launchClipboardDirectly: noop,
  escapeHTML: (s) => String(s ?? ''),
});

bootSessionBar({
  getActiveSession: () => activeSession,
  t,
  formatSignedDuration: (s) => `signed:${s}`,
  formatDuration: (s) => `elapsed:${s}`,
  formatDurationHourMin: (s) => `hm:${s}`,
  navigateToPath: (path) => { navigatedTo = path; },
  clipboardPath: () => '/session/s1/client/c1',
});

renderClipboardBar();
""",
    ).replace("__SESSION__", source_session)


def _session_js(source_session, participants=("c1", "c2")):
    return json.dumps(
        {
            "id": "s1",
            "started": True,
            "startTime": None,
            "duration": 0,
            "participants": list(participants),
            "activeClientId": participants[0],
            "clientRoutines": {},
            "feedback": [],
            "sourceSession": source_session,
        }
    ).replace('"startTime": null', '"startTime": Date.now()')


MERGED = {
    "id": "s1",
    "ids": ["s1", "s9"],
    "titles": ["Group Strength & Conditioning", "Return-to-Play Rehab"],
    "timeLabel": "09:00 - 11:00",
    "day": "today",
    "location": "Trib gym base",
    "startDate": "2026-08-08T09:00:00.000Z",
    "endDate": "2026-08-08T11:00:00.000Z",
}


def test_a_merged_clipboard_names_every_session_it_covers(page, local_server):
    """The case the app is built for: two overlapping slots are ONE clipboard. Both titles must
    appear — a bar built from `titles[0]` would silently drop the second booking, and the trainer
    would be looking at a strip that names one of the two things they are running."""
    load_with_stub(page, local_server, _bar_stub(_session_js(MERGED)))

    title = page.inner_text("#clipboard-bar-title")
    assert "Group Strength & Conditioning" in title
    assert "Return-to-Play Rehab" in title, (
        "a merged clipboard must name every session it covers, not just the first"
    )
    assert page.inner_text("#clipboard-bar-meta") == "2 clients · 09:00 - 11:00"


def test_tapping_the_bar_returns_to_the_clipboard(page, local_server):
    """One tap back in — the whole point. The path comes from the controller so it restores the
    in-focus card, rather than dumping the trainer at the top of the deck."""
    load_with_stub(page, local_server, _bar_stub(_session_js(MERGED)))

    page.click(BAR)
    assert page.evaluate("() => window.__navigatedTo()") == "/session/s1/client/c1"


def test_the_whole_strip_is_the_tap_target(page, local_server):
    """AGENT_RULES §2.D.1 — 14px of title is nothing to aim at with a sweaty thumb, so the bar is a
    <button> and the strip itself is what you hit."""
    load_with_stub(page, local_server, _bar_stub(_session_js(MERGED)))

    assert page.eval_on_selector(BAR, "el => el.tagName") == "BUTTON"
    box = page.locator(BAR).bounding_box()
    assert box["height"] >= 40, f"tap target is only {box['height']}px tall"


def test_an_adhoc_clipboard_has_no_schedule_to_cite(page, local_server):
    """Started without a source session, there is no title or time range — the bar falls back to
    naming the clipboard generically rather than rendering an empty strip."""
    load_with_stub(
        page, local_server, _bar_stub(_session_js(None, participants=("c1",)))
    )

    assert page.inner_text("#clipboard-bar-title") == "Live Tracking Clipboard"
    assert page.inner_text("#clipboard-bar-meta") == "1 clients"


def test_no_clipboard_means_no_bar(page, local_server):
    """The idle state was deliberately dropped: 'next session' is planning information, not
    in-progress state, and does not earn permanent space on a phone. With nothing live the bar is
    hidden outright and the notification summary keeps the strip."""
    load_with_stub(page, local_server, _bar_stub("null"))

    assert "hidden" in (page.get_attribute(BAR, "class") or "")
    area_class = page.get_attribute("#notification-area", "class") or ""
    assert "has-active-session" not in area_class
