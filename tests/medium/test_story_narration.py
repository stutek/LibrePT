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

// Every palette the trainer can pick, read from the app rather than listed here: a sixth theme must
// be readable too, and a test with its own copy of the list would not know it exists.
import { THEME_BODY_CLASS, applyTheme } from './modules/common/theme.js';
window.__themes = Object.keys(THEME_BODY_CLASS);
window.__wearTheme = (key) => applyTheme(key, { persist: false });

// Contrast of one element's text against the surface actually behind it — the first ancestor that
// paints, since the card itself is transparent inside the guide's panel.
window.__contrast = (selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  // Chromium reports a `color-mix()` result as `color(srgb 0.98 0.98 0.98 / 0.82)` — 0-1 floats,
  // not the 0-255 of `rgb()`. Read as 0-255 they all collapse to black, and every mixed surface
  // scores a flat 1:1, which looks exactly like a real failure. Scale by the notation, not a guess.
  const channels = (colour) => {
    const numbers = (colour.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
    return colour.startsWith('color(') ? numbers.map((v) => v * 255) : numbers;
  };
  const luminance = (colour) => {
    const [r, g, b] = channels(colour).map((v) => {
      const channel = v / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  let ground = getComputedStyle(document.body).backgroundColor;
  for (let node = el; node; node = node.parentElement) {
    const painted = getComputedStyle(node).backgroundColor;
    if (painted && !painted.startsWith('rgba(0, 0, 0, 0)')) { ground = painted; break; }
  }
  const [lighter, darker] = [luminance(getComputedStyle(el).color), luminance(ground)].sort(
    (a, b) => b - a,
  );
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
};
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
    "target": "#story-card",
}

TAP_STEP = {"id": "open-session", "caption": "tour_step_open_session"}


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, NARRATION_STUB)


def _show(page, step):
    page.evaluate("(step) => window.__show(step)", step)


def test_a_narrated_beat_puts_its_words_on_screen(page, local_server):
    """§35.1's rule for narrated steps: the words are ON SCREEN and they are the story's, not a key.

    The card carried its own Continue button until 2026-08-23, when a beat whose only control was
    that button left the guide's own Next greyed out beside it — two ways on, one of them dead. The
    words are all this surface owns now; moving the story along belongs to the guide."""
    _mount(page, local_server)

    _show(page, CHAPTER_STEP)

    card = page.locator("#story-card")
    expect(card).to_be_visible()
    expect(card).to_contain_text("In the gym")
    expect(card).to_contain_text("Jane and John")


def test_the_viewer_is_told_whose_phone_they_are_looking_at(page, local_server):
    """One persona at a time was the ruling (§35.1), so this label is the ONLY thing separating the
    trainer's app from a client's — the two look the same."""
    _mount(page, local_server)

    _show(page, CHAPTER_STEP)

    expect(page.locator("#story-persona")).to_have_text("Your phone")


def test_a_beat_with_nothing_to_read_shows_no_card(page, local_server):
    """A card left on screen would cover the control the step is about, and the whole claim of a
    scripted demo is that the viewer watches the real app being used."""
    _mount(page, local_server)
    _show(page, CHAPTER_STEP)

    _show(page, TAP_STEP)

    expect(page.locator("#story-card")).to_be_hidden()


def test_the_first_tap_on_the_app_takes_the_card_away(page, local_server):
    """A card is READ and then got out of the way — acting on the app is what says it has been read
    (reported 2026-08-22: a card sitting over the control its own step points at)."""
    _mount(page, local_server)
    _show(page, CHAPTER_STEP)
    expect(page.locator("#story-card")).to_be_visible()

    page.mouse.click(10, 400)

    expect(page.locator("#story-card")).to_be_hidden()


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


# WCAG AA for body text. The story card is a paragraph somebody reads on a phone, not a decorative
# label, so this is the bar it has to clear — on every palette, not on the one it was written under.
MIN_CONTRAST = 4.5


def test_the_card_is_readable_on_every_theme(page, local_server):
    """Reported 2026-08-27: "the 2/8 card is hard to read" — measured at 2.38:1 on Midnight, which is
    the palette the story's handover link forces on the client's phone.

    The card painted itself with `--text-primary` / `--text-secondary` / `--bg-secondary`, none of
    which this app has ever defined, so all five declarations fell through to the light-theme
    constants typed beside them. On Daylight that was right by coincidence; on the four dark palettes
    it was slate on near-black. The card now reads the app's own tokens, and this measures what a
    viewer's eye gets rather than which token was named.
    """
    _mount(page, local_server)

    unreadable = []
    for theme in page.evaluate("() => window.__themes"):
        page.evaluate("(theme) => window.__wearTheme(theme)", theme)
        _show(page, CHAPTER_STEP)
        for selector in (
            ".story-card-title",
            ".story-card-body",
            ".story-card-kicker",
            "#story-persona",
        ):
            contrast = page.evaluate("(sel) => window.__contrast(sel)", selector)
            if contrast is not None and contrast < MIN_CONTRAST:
                unreadable.append(f"{theme}: {selector} at {contrast}:1")

    assert not unreadable, "story card text below AA: " + "; ".join(unreadable)


def test_nothing_is_offered_when_there_is_nothing_to_offer(page, local_server):
    """A button that does nothing is worse than no button."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, NO_ONWARD_STUB)

    _show(page, ONWARD_STEP)

    expect(page.locator("#story-card-cleanup")).to_be_hidden()
