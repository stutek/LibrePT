# tests/medium/test_story_narration.py
# The long demo's narration surface (TODO §35.1) — the cards, the persona label and the caption bar
# that carry a four-minute story between its taps.
#
# Why this is a component test: the surface is what a VIEWER reads, so the claims are about what is
# on screen and dismissible, not about how a step is played. The story itself is replayed end to end
# in tests/e2e/test_demo_story.py.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub
from tests.medium._overflow import assert_component_fits

pytestmark = pytest.mark.clean_start

# Mounts the real narration surface with the real translation dict, and exposes its handle so a test
# can show one step the way the guide does when it enters one.
NARRATION_STUB = """
import { mountStoryNarration } from './modules/demo/storyNarration.js';
import { TRANSLATIONS } from './i18n/index.js';

window.__cleared = 0;
window.__narration = mountStoryNarration({
  t: (key) => TRANSLATIONS.en[key] || key,
  onClearDemoData: () => { window.__cleared += 1; },
});
window.__show = (step) => window.__narration.showStep(step);
"""

# The same stub with nobody offering a way onward — a caller that cannot clear demo data.
NO_ONWARD_STUB = NARRATION_STUB.replace(
    "  onClearDemoData: () => { window.__cleared += 1; },\n", ""
)

CHAPTER_STEP = {
    "id": "gym-open",
    "persona": "story_persona_trainer",
    "narrate": {
        "kind": "chapter",
        "titleKey": "story_chapter_gym",
        "bodyKey": "story_gym_open_body",
    },
    "target": "#story-card-continue",
}

TAP_STEP = {"id": "open-session", "caption": "tour_step_open_session"}


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, NARRATION_STUB)


def _show(page, step):
    page.evaluate("(step) => window.__show(step)", step)


def test_a_narrated_beat_is_read_and_then_dismissed_by_a_tap(page, local_server):
    """§35.1's rule for narrated steps: the card is on screen, and it is DISMISSIBLE — which is what
    makes it a step with a real expectation rather than a pause the player hoped was long enough."""
    _mount(page, local_server)

    _show(page, CHAPTER_STEP)

    card = page.locator("#story-card")
    expect(card).to_be_visible()
    expect(card).to_contain_text("In the gym")
    expect(card).to_contain_text("Jane and John")

    page.click("#story-card-continue")

    expect(card).to_be_hidden()


def test_the_viewer_is_told_whose_phone_they_are_looking_at(page, local_server):
    """One persona at a time was the ruling (§35.1), so this label is the ONLY thing separating the
    trainer's app from a client's — the two look the same."""
    _mount(page, local_server)

    _show(page, CHAPTER_STEP)

    expect(page.locator("#story-persona")).to_have_text("Trainer's phone")


def test_a_tap_beat_gets_a_caption_and_no_card_over_the_app(page, local_server):
    """The story narrates the taps too, but a card would cover the control being demonstrated — and
    the whole claim of a scripted demo is that the viewer watches the real app being used."""
    _mount(page, local_server)
    _show(page, CHAPTER_STEP)

    _show(page, TAP_STEP)

    expect(page.locator("#story-card")).to_be_hidden()
    caption = page.locator("#story-caption")
    expect(caption).to_be_visible()
    expect(caption).to_contain_text("group session")


def test_the_paper_track_is_words_not_a_drawn_form(page, local_server):
    """§35.1: the paper beats SAY what happens on a printed form. A drawn form among live screens
    reads as a real one, and the first viewer who goes looking for it in the app has been misled —
    so what the paper card holds is text, and its paper-ness is the surface it is written on."""
    _mount(page, local_server)

    _show(
        page,
        {
            **CHAPTER_STEP,
            "id": "paper",
            "narrate": {**CHAPTER_STEP["narrate"], "kind": "paper"},
        },
    )

    card = page.locator("#story-card")
    expect(card).to_be_visible()
    assert card.locator("input, form, select, textarea").count() == 0
    # It has to LOOK like paper, or nothing distinguishes narration from a screen.
    background = page.evaluate(
        "() => getComputedStyle(document.getElementById('story-card')).backgroundImage"
    )
    assert "gradient" in background


def test_the_narration_fits_the_phone_the_story_is_watched_on(page, local_server):
    _mount(page, local_server)

    _show(page, CHAPTER_STEP)

    assert_component_fits(
        page, "#story-card", label="story narration card", viewport=None
    )


ONWARD_STEP = {
    **CHAPTER_STEP,
    "id": "gym-close",
    "narrate": {**CHAPTER_STEP["narrate"], "onward": True},
}


def test_the_last_card_offers_the_two_ways_onward(page, local_server):
    """§30.2: the demo used to end by simply closing, leaving a trainer inside the clipboard it had
    just shown them with nothing said. Dismissing IS "play around" — the app stays where the story
    put it — and the other way is the cleanup dialog the demo notice already opens."""
    _mount(page, local_server)

    _show(page, ONWARD_STEP)

    expect(page.locator("#story-card")).to_contain_text("Clear the demo data")
    page.click("#story-card-cleanup")

    assert page.evaluate("() => window.__cleared") == 1
    expect(page.locator("#story-card")).to_be_hidden()


def test_a_mid_story_card_makes_no_such_offer(page, local_server):
    """Only the last beat is entitled to hand the app over; offering it earlier reads as the demo
    asking to be stopped."""
    _mount(page, local_server)
    _show(page, ONWARD_STEP)

    _show(page, CHAPTER_STEP)

    expect(page.locator("#story-card-cleanup")).to_be_hidden()


def test_nothing_is_offered_when_there_is_nothing_to_offer(page, local_server):
    """A button that does nothing is worse than no button."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, NO_ONWARD_STUB)

    _show(page, ONWARD_STEP)

    expect(page.locator("#story-card-cleanup")).to_be_hidden()
