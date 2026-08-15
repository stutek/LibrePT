# tests/e2e/test_demo_tour.py
# The scripted demo tour, replayed as a test (TODO §23.5).
#
# This file is the reason the demo is a script and not a screen recording. A recording of a real set
# being logged goes stale the first time a control moves, and NOTHING tells you — the asset keeps
# playing, showing an app that no longer exists, to exactly the people being asked to trust it.
# Because the tour drives the real controls, the same script that promotes the app also proves the
# flow still works, and a change that breaks the demo turns this red instead.
#
# The tour taps four things a trainer taps: open the session, focus an exercise, signal Too Easy,
# switch participant. §23.4 settled why that flow and not a feature tour — pitch the clipboard, the
# one job trainers hate, not "replace your PT software".
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json
import pathlib
import re

import pytest
from playwright.sync_api import expect

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
TOUR_SOURCE = REPO_ROOT / "src" / "modules" / "demo" / "gymFloorTour.js"


def _scripted_step_ids():
    """The step ids the shipped script declares, read from the script itself.

    Read rather than restated: a hardcoded copy here would keep passing after someone shortened the
    tour, which is the one regression this file exists to catch — a demo that quietly does less.
    """
    source = TOUR_SOURCE.read_text(encoding="utf-8")
    # Only ids inside the steps array — the tour object carries an `id` of its own, and scooping
    # that up made this expect a step the player was never asked to run.
    _, _, steps_block = source.partition("steps: [")
    return re.findall(r'^\s*id: "([^"]+)",', steps_block, re.M)


def _run_tour(page, local_server):
    page.goto(f"{local_server}?init=demo_data_load&demo=gym_floor")
    # The tour is the last boot step and each of its four taps carries a settle pause, so it runs
    # well past the default expectation timeout.
    page.wait_for_function(
        "() => Array.isArray(window.__demoTourResults)", timeout=30_000
    )
    return page.evaluate("() => window.__demoTourResults")


def test_every_scripted_step_runs_and_passes(page, local_server):
    results = _run_tour(page, local_server)

    failed = [r for r in results if not r["ok"]]
    assert not failed, "demo tour steps failed: " + json.dumps(failed, indent=2)

    # Ids AND order, against the script on disk. The player stops at the first failure, so a tour
    # that broke halfway would otherwise report a short, all-green list and pass.
    assert [r["id"] for r in results] == _scripted_step_ids()


def test_the_tour_actually_left_the_app_in_the_state_it_claims(page, local_server):
    """Independent verification, because the previous test trusts the app's own grading.

    The player checks its expectations from inside the page; if that check were wrong or silently
    permissive, every step would report ok while the screen showed nothing. These assertions are
    Playwright's own, against the finished state, and they are deliberately the same claims the
    script makes rather than easier ones.
    """
    _run_tour(page, local_server)

    # A clipboard is open, holding the whole group rather than one person — the thing the tour
    # exists to show.
    expect(page.locator("#active-session-client-tabs")).to_be_visible()
    assert page.locator("#active-session-client-tabs .client-tab-btn").count() >= 2

    # The tour ended on the second participant, and that tab is the active one.
    expect(
        page.locator("#active-session-client-tabs .client-tab-btn:nth-child(2)")
    ).to_have_class(re.compile(r"\bactive\b"))

    # Deliberately NOT asserting the circuit signal is still on screen: switching participant
    # re-renders the deck for THAT person, so step 3's control belongs to the first participant's
    # board and is correctly gone. test_the_signal_survives_switching_participant goes back for it.


def test_the_signal_survives_switching_participant(page, local_server):
    """Step 3 logged Too Easy for the FIRST participant, then step 4 moved away from them.

    Worth its own assertion because it is the failure a viewer would never notice and a trainer
    would: per-participant state that quietly belongs to whoever is on screen. Coming back has to
    show the signal still set (TODO §7.2's whole point — a control that does not show its state gets
    tapped twice).
    """
    _run_tour(page, local_server)

    page.locator("#active-session-client-tabs .client-tab-btn:nth-child(1)").click()
    expect(page.locator(".circuit-sig.easy.active").first).to_be_visible()


@pytest.mark.clean_start
def test_the_tour_does_not_run_without_demo_data(page, local_server):
    """A tour needs something to demonstrate. On an empty app the four selectors match nothing, so
    running it would park a pointer over a blank screen and report four failures at a trainer who
    only followed a stale link — a broken marketing asset must not read as a broken app."""
    page.goto(f"{local_server}?demo=gym_floor")
    page.wait_for_selector("#app-header", timeout=15_000)
    page.wait_for_timeout(1_500)

    assert page.evaluate("() => window.__demoTourResults") is None
    assert page.evaluate("() => document.getElementById('demo-tour-hand')") is None
