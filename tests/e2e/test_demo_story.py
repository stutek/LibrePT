# tests/e2e/test_demo_story.py
# The long demo, walked as a trainer would walk it (TODO §35).
#
# Same bargain as tests/e2e/test_demo_tour.py, and the reason both are scripts rather than
# recordings: the story drives the real controls, so the artifact that promotes the app is the
# artifact that proves it still works.
#
# **It is GUIDED, not played** (decided 2026-08-22): four taps can be watched, four minutes cannot,
# and a viewer who is only watching stops watching. So the story runs on the walkthrough's panel —
# the trainer performs each beat or asks to be shown it — and this test drives it the same way, by
# tapping Show me all the way through.
#
# Fixtures (local_server) come from tests/conftest.py + pytest-playwright.

import pathlib
import re

import pytest
from playwright.sync_api import expect

PANEL = "#walkthrough-overlay"
PROGRESS = "#walkthrough-overlay .walkthrough-progress"
CAPTION = "#walkthrough-overlay .walkthrough-caption"
PROBLEM = "#walkthrough-overlay .walkthrough-problem"
SHOW_ME = "#walkthrough-show"
NEXT = "#walkthrough-next"

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
STORY_SOURCE = REPO_ROOT / "src" / "modules" / "demo" / "storyTour.js"


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Reduced motion, for the reason test_demo_tour.py gives: the pauses exist for a human eye, a
    headless run has none, and `demoPace` returns zero for a viewer who asked for less motion."""
    return {**browser_context_args, "reduced_motion": "reduce"}


def _chapter_ids():
    """The chapter ids the shipped script declares, read from the script rather than restated — a
    hardcoded copy would keep passing after someone dropped a chapter."""
    source = STORY_SOURCE.read_text(encoding="utf-8")
    return re.findall(r'^\s*id: "([^"]+)",\n\s*titleKey:', source, re.M)


def _open_story(page, local_server, query="?init=demo_data_load&demo=story"):
    page.goto(f"{local_server}{query}")
    page.locator(PANEL).wait_for(state="visible", timeout=30_000)


def _step_numbers(page):
    return [int(n) for n in re.findall(r"\d+", page.locator(PROGRESS).inner_text())]


def _walk_the_whole_story(page):
    """Tap Show me through every beat, the way a trainer who wants to be shown would.

    A delegated step advances the guide by itself (walkthroughOverlay.js), so this is the whole loop
    until the last one, which stays the trainer's own tap because advancing off it closes the guide.
    """
    seen = []
    step_now, step_count = _step_numbers(page)
    while True:
        seen.append(page.locator(CAPTION).inner_text())
        page.locator(SHOW_ME).click()
        if step_now == step_count:
            expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
            page.locator(NEXT).click()
            return seen
        expect(page.locator(PROGRESS)).to_have_text(
            re.compile(rf"step\s+{step_now + 1}\s+of", re.I), timeout=20_000
        )
        assert page.locator(PROBLEM).is_hidden(), (
            f"the guide got stuck on step {step_now}: {page.locator(PROBLEM).inner_text()}"
        )
        step_now += 1


def test_the_whole_story_can_be_walked_with_show_me(page, local_server):
    _open_story(page, local_server)

    _, step_count = _step_numbers(page)
    captions = _walk_the_whole_story(page)

    # Every beat was reached, and the guide closed on the last one rather than stalling halfway.
    assert len(captions) == step_count
    expect(page.locator(PANEL)).to_be_hidden()


def test_the_story_tells_a_story_rather_than_naming_features(page, local_server):
    """Asked for 2026-08-22: this is storytelling, not a feature list. The proof a test can hold is
    that the people on screen are named in the words the viewer reads — a demo that says "the
    client" is describing software."""
    _open_story(page, local_server)

    told = " ".join(_walk_the_whole_story(page))

    assert "John" in told, told[:400]
    assert "Jane" in told, told[:400]


def test_the_story_leaves_the_note_on_the_person_it_was_about(page, local_server):
    """The evening's point, verified independently of the guide's own grading: what was typed
    mid-circuit is on that participant's record and in the plan being shaped for them."""
    _open_story(page, local_server)

    _walk_the_whole_story(page)

    expect(page.locator("#client-focus-gym")).to_be_visible()
    expect(page.locator("#client-focus-gym")).to_contain_text("Joint Pain")
    notes = page.locator("#client-focus-notes").inner_text()
    assert "left knee, third round" in notes


def test_one_chapter_can_be_walked_on_its_own(page, local_server):
    """Chapters exist because nobody watches five unbroken minutes of software they do not use yet,
    so a link naming one has to open that one."""
    chapters = _chapter_ids()
    assert chapters, "the story declares no chapters"

    _open_story(
        page, local_server, f"?init=demo_data_load&demo=story&chapter={chapters[0]}"
    )

    expect(page.locator(PANEL)).to_be_visible()
    assert _step_numbers(page)[0] == 1


@pytest.mark.clean_start
def test_the_story_does_not_run_without_demo_data(page, local_server):
    """A story with nothing to demonstrate would point at a blank screen."""
    page.goto(f"{local_server}?demo=story")
    page.wait_for_selector("#app-header", timeout=15_000)
    page.wait_for_timeout(1_500)

    assert page.locator(PANEL).count() == 0
    assert page.evaluate("() => document.getElementById('story-card')") is None
