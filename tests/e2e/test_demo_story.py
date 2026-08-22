# tests/e2e/test_demo_story.py
# The long demo, replayed as a test (TODO §35).
#
# Same bargain as tests/e2e/test_demo_tour.py, and the reason both are scripts rather than
# recordings: the story drives the real controls, so the artifact that promotes the app is the
# artifact that proves it still works. A four-minute narrated scenario is the one most likely to rot
# quietly — it touches more of the app than the wedge does, and nobody watches it as often.
#
# What is asserted here is what a chapter PROMISES: it plays whole, it can be played alone from a
# link, and the narration says whose phone is on screen. The narration surface's own behaviour is
# tests/medium/test_story_narration.py.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json
import pathlib
import re

import pytest
from playwright.sync_api import expect


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Reduced motion, for the reason test_demo_tour.py gives: the pauses exist for a human eye, a
    headless run has none, and `demoPace` returns zero for a viewer who asked for less motion."""
    return {**browser_context_args, "reduced_motion": "reduce"}


REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY_SOURCE = REPO_ROOT / "src" / "modules" / "demo" / "storyTour.js"


def _chapter_ids():
    """The chapter ids the shipped script declares, read from the script rather than restated — a
    hardcoded copy would keep passing after someone dropped a chapter, which is exactly the
    regression this file exists to catch."""
    source = STORY_SOURCE.read_text(encoding="utf-8")
    return re.findall(r'^\s*id: "([^"]+)",\n\s*titleKey:', source, re.M)


def _play(page, local_server, query="?init=demo_data_load&demo=story"):
    page.goto(f"{local_server}{query}")
    page.wait_for_function(
        "() => Array.isArray(window.__demoStoryResults)", timeout=60_000
    )
    return page.evaluate("() => window.__demoStoryResults")


def test_the_story_plays_every_beat_it_declares(page, local_server):
    results = _play(page, local_server)

    failed = [r for r in results if not r["ok"]]
    assert not failed, "story beats failed: " + json.dumps(failed, indent=2)
    # The player stops at the first failure, so a story that broke halfway would otherwise report a
    # short, all-green list. Both the narrated cards and the taps are in here.
    assert [r["id"] for r in results] == [
        "gym-open",
        "open-session",
        "focus-exercise",
        "signal-too-easy",
        "next-participant",
        "back-to-first",
        "refocus-circuit",
        "capture-open",
        "capture-tag",
        "capture-keep",
        "capture-submit",
        "open-session-menu",
        "plan-editor-shows-the-notes",
        "swap-open-catalog",
        "swap-pick-movement",
        "gym-close",
    ]


def test_one_chapter_can_be_watched_on_its_own(page, local_server):
    """Chapters exist because nobody watches five unbroken minutes of software they do not use yet
    (§35.1), so a link naming one has to play that one and stop."""
    chapters = _chapter_ids()
    assert chapters, "the story declares no chapters"

    results = _play(
        page, local_server, f"?init=demo_data_load&demo=story&chapter={chapters[0]}"
    )

    assert [r["ok"] for r in results] == [True] * len(results)
    assert results[0]["id"].startswith(chapters[0])


def test_a_mistyped_chapter_still_shows_the_story(page, local_server):
    """These links are pasted into chat apps and typed by hand. A player handed an empty step list
    looks exactly like an app that failed to boot, so an unknown chapter plays the lot."""
    results = _play(
        page, local_server, "?init=demo_data_load&demo=story&chapter=no-such-chapter"
    )

    assert [r["ok"] for r in results] == [True] * len(results)
    assert len(results) > 1


def test_the_story_left_the_app_where_it_says_it_did(page, local_server):
    """Independent verification, because the assertions above trust the app's own grading."""
    _play(page, local_server)

    # It ends where the chapter says it does: the plan being shaped, with what the gym said a few
    # beats earlier already waiting against this participant. Asserted here rather than trusting the
    # player's own grading of its last step.
    expect(page.locator("#client-focus-gym")).to_be_visible()
    expect(page.locator("#client-focus-gym")).to_contain_text("Joint Pain")
    # The closing card was dismissed by its own step, so the app is left usable rather than behind
    # a card nobody can get past.
    expect(page.locator("#story-card")).to_be_hidden()
    expect(page.locator("#story-persona")).to_be_visible()


@pytest.mark.clean_start
def test_the_story_does_not_run_without_demo_data(page, local_server):
    """Same rule as the wedge: a story with nothing to demonstrate would park a pointer over a blank
    screen and report failures at someone who only followed a stale link."""
    page.goto(f"{local_server}?demo=story")
    page.wait_for_selector("#app-header", timeout=15_000)
    page.wait_for_timeout(1_500)

    assert page.evaluate("() => window.__demoStoryResults") is None
    assert page.evaluate("() => document.getElementById('story-card')") is None
