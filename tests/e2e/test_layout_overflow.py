# tests/e2e/test_layout_overflow.py
# TODO §25: the suite asserts semantics everywhere and geometry nowhere, so a control that runs off
# the screen edge — or one whose label is silently clipped inside its own box — passes the whole
# gate. This walks every addressable state of the app at three real device widths and sweeps the
# rendered DOM for both, using the shared sweep in agent_tools/overflow_scan.py (the same one an
# agent runs by hand against a live page, so the check cannot drift into two versions).
#
# Three devices, chosen as the ones the app is actually opened on:
#   iPhone 14 (390x844)          — the narrowest supported phone; text-wrap failures show here first
#   Galaxy S23 Ultra (412x915)   — the wide-phone case
#   Desktop (1280x800)           — where body's 480px max-width column, NOT the window, is the edge
#
# Plus one Slovenian pass at the narrowest width: overflow is a text-length bug, `sl` labels are
# materially longer than `en`, and an en-only sweep passes on strings that break the live app.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re
from pathlib import Path

import pytest

from agent_tools import overflow_scan

ROUTE_TABLE = (
    Path(__file__).resolve().parents[2]
    / "src"
    / "controllers"
    / "routes"
    / "routeTable.js"
)

# Every route name the walk below reaches, and the ones it deliberately does not. Checked against
# routeTable.js by test_the_walk_still_covers_every_route, so a route added later fails this file
# until someone decides whether its view can overflow — the alternative is a sweep that silently
# stops covering the newest screens, which are exactly the least-reviewed ones.
DELIBERATELY_NOT_WALKED = {
    # Redirects with no markup of their own: both rewrite to sessions.day, which IS walked, so
    # visiting them would sweep the same DOM a second time under a different name.
    "home": "redirect to sessions.day",
    "home.index": "redirect to sessions.day",
    "session.newAlias": "alias of session.new — same view, same markup",
    # A focus id names one card inside the live overlay, which the overlay sweep already covers in
    # whatever focus the app opened with; navigating to a second card re-renders no new component.
    "session.edit.item": "same editor markup as session.edit, one row highlighted",
    "session.catalog.slot": "same picker markup as session.catalog, prefiltered",
}


# The walk itself, declared as data so the coverage check below reads the same list the browser
# does rather than re-deriving it from the source of this file.
STATIC_ROUTE_WALK = [
    ("clients", "/clients"),
    ("adjustments", "/adjustments"),
    ("routines", "/routines"),
    ("exercises", "/exercises"),
    ("history", "/history"),
    ("session.new", "/session/new"),
    ("routine.new", "/routines/new"),
    ("exercise.new", "/exercises/new"),
    ("about", "/about"),
    ("build", "/build"),
    ("backup", "/backup"),
    ("terms", "/terms"),
]
DASHBOARD_ROUTE = "sessions.day"
RECORD_DETAIL_ROUTES = ["client.detail", "routine.edit", "adjustment.apply"]
LIVE_SESSION_ROUTES = [
    "session.focus",
    "session",
    "session.client",
    "session.edit",
    "session.catalog",
    "session.setup",
]
WALKED_ROUTES = (
    {DASHBOARD_ROUTE}
    | {name for name, _ in STATIC_ROUTE_WALK}
    | set(RECORD_DETAIL_ROUTES)
    | set(LIVE_SESSION_ROUTES)
)


def _base(page):
    """The app's base path (e.g. '/LibrePT'), read from <base>."""
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    """Drive the client-side router the way an opened deep link would — no reload, so one page
    context covers the whole walk instead of paying a cold navigation per route."""
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(250)


def _sweep(page, findings, label):
    """Run the sweep and file anything it finds under `label` (the route/state it was seen in).

    Deliberately accumulating rather than asserting per route: this suite is expected to surface
    several real layout defects at once, and failing at the first one would hide the rest behind a
    dozen re-runs.
    """
    for finding in overflow_scan.scan(page):
        findings.append((label, finding))


def _walk_static_routes(page, base, findings):
    """Every route reachable by URL alone — views first, then the route-backed dialogs, which are
    swept while OPEN because a dialog is exactly where a long label meets a narrow box."""
    for label, path in STATIC_ROUTE_WALK:
        _nav(page, base + path)
        _sweep(page, findings, label)


def _walk_record_details(page, base, findings):
    """Routes whose URL carries a record id. The ids are demo-data ids, so rather than hardcoding
    them (they would rot with the seed) the walk clicks the first card and reads where it landed."""
    _nav(page, base + "/clients")
    client_card = page.locator("#clients-list .client-card").first
    if client_card.count():
        client_card.click()
        page.wait_for_timeout(300)
        _sweep(page, findings, "client.detail")

    _nav(page, base + "/routines")
    routine_card = page.locator(".routine-card").first
    if routine_card.count():
        routine_card.click()
        page.wait_for_timeout(300)
        _sweep(page, findings, "routine.edit")

    _nav(page, base + "/adjustments")
    adjustment_card = page.locator(".adjustment-card").first
    if adjustment_card.count():
        adjustment_card.locator("button").first.click()
        page.wait_for_timeout(300)
        _sweep(page, findings, "adjustment.apply")


def _walk_live_session(page, base, findings):
    """The live session and its editor — the densest screens in the app, and the ones a trainer
    reads at arm's length mid-set. Opening a session upgrades the URL to carry both ids, which is
    where the editor/catalog/setup URLs below come from."""
    _nav(page, base + "/")
    session_card = page.locator(".session-card").first
    if not session_card.count():
        return
    session_card.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)", timeout=15000)
    page.wait_for_timeout(400)
    _sweep(page, findings, "session.focus (live overlay)")

    match = re.search(
        r"/session/([^/]+)/client/([^/]+)", page.evaluate("() => location.pathname")
    )
    if not match:
        return
    session_id, client_id = match.group(1), match.group(2)
    session_path = f"{base}/session/{session_id}"

    for label, path in [
        ("session", session_path),
        ("session.client", f"{session_path}/client/{client_id}"),
        ("session.edit", f"{session_path}/client/{client_id}/edit"),
        ("session.catalog", f"{session_path}/client/{client_id}/edit/catalog"),
        ("session.setup", f"{base}/session/setup/{session_id}"),
    ]:
        _nav(page, path)
        _sweep(page, findings, label)


def _walk_the_app(page, local_server, findings, query=""):
    page.goto(local_server + query)
    page.wait_for_selector("#view-clients.active")
    page.wait_for_timeout(400)
    base = _base(page)

    _sweep(page, findings, "sessions.day (dashboard)")
    _walk_static_routes(page, base, findings)
    _walk_record_details(page, base, findings)
    _walk_live_session(page, base, findings)


def _report(findings):
    lines = [f"{len(findings)} layout overflow finding(s):"]
    for label, finding in findings:
        axis = "horizontally" if finding["axis"] == "x" else "vertically"
        lines.append(
            f"  [{finding['invariant']}] {label}: {finding['element']} overflows "
            f"{finding['boundary']} {axis} by {finding['overflowPx']}px"
        )
    return "\n".join(lines)


# NOT parametrized on `device`: pytest-playwright owns a fixture of that name and would try to
# resolve these as its own emulation presets. `device_name` is ours.
@pytest.mark.parametrize("device_name", ["iphone-14", "galaxy-s23-ultra", "desktop"])
def test_no_component_overflows_its_boundary(page, local_server, device_name):
    """Invariants A and B (see agent_tools/overflow_scan.py) across every walkable route."""
    profile = overflow_scan.device_profile(device_name)
    page.set_viewport_size({"width": profile["width"], "height": profile["height"]})

    findings = []
    _walk_the_app(page, local_server, findings)

    assert not findings, f"{profile['description']}\n{_report(findings)}"


def test_no_component_overflows_in_slovenian(page, local_server):
    """The same walk in `sl`. Slovenian is the launch language and its labels are longer than the
    English ones every other assertion in this suite is written against — a layout that fits `en`
    at 390px is not evidence it fits at all."""
    profile = overflow_scan.device_profile("iphone-14")
    page.set_viewport_size({"width": profile["width"], "height": profile["height"]})

    findings = []
    _walk_the_app(page, local_server, findings, query="?lang=sl")

    assert not findings, f"Slovenian at {profile['width']}px\n{_report(findings)}"


def test_the_walk_still_covers_every_route():
    """No browser: a static check that the walk above has not fallen behind routeTable.js.

    A sweep silently missing the newest screen is the failure mode worth guarding — new views are
    the least reviewed, so they are where an overflow is most likely and least likely to be seen.
    """
    source = ROUTE_TABLE.read_text(encoding="utf-8")
    declared = set(re.findall(r'name:\s*"([^"]+)"', source))
    # The global dialogs are registered from a literal array, so their names are positional rather
    # than keyed — same routes, different spelling in the source.
    declared |= set(re.findall(r'\[\s*"([^"]+)",\s*"/[^"]*",\s*"dialog-', source))

    uncovered = declared - WALKED_ROUTES - set(DELIBERATELY_NOT_WALKED)

    assert not uncovered, (
        f"routes with no overflow sweep: {sorted(uncovered)}. Add them to the walk, or to "
        "DELIBERATELY_NOT_WALKED with the reason their markup is already covered."
    )
