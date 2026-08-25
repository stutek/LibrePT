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
BACK = "#walkthrough-back"

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


# A card beat has no control of its own: it is read, and the guide's own Next is the way on
# (2026-08-23). What used to be a tap on the card is now no tap at all.


# What is worth knowing about the screen when a beat does not complete — the questions someone
# debugging a stuck guide asks next, answered in the failure itself rather than by re-running with a
# hand-written browser script. Short on purpose: it is read by a person, not parsed.
ON_SCREEN = """
() => ({
  dialogs: [...document.querySelectorAll("dialog[open]")].map((d) => d.id),
  card: document.getElementById("story-card")?.hidden === false ? "shown" : "hidden",
  appMenu: !document.getElementById("app-menu")?.classList.contains("hidden"),
  sessionMenu: !document.getElementById("session-menu")?.classList.contains("hidden"),
  clipboard: !document.getElementById("active-session-overlay")?.classList.contains("hidden"),
  route: location.pathname + location.search,
})
"""


def _stuck(page, step_now, caption):
    """The message a stuck beat leaves behind: which beat, what it asked for, what the guide said,
    and what was actually on screen."""
    problem = page.locator(PROBLEM).inner_text().strip()
    return (
        f"the guide stopped at step {step_now}: {caption!r}\n"
        f"  guide said: {problem or '(nothing)'}\n"
        f"  on screen:  {page.evaluate(ON_SCREEN)}"
    )


def _past_the_splash(page):
    """A crossing to the other phone is a real navigation, so the cold-start splash can be in front
    of the guide — a viewer taps it away, and so does this. The suite's own auto-dismiss only fires
    on navigations the TEST makes; this one is made by the app."""
    splash = page.locator("#splash-dismiss")
    if not splash.count() or not splash.first.is_visible():
        return
    try:
        splash.first.click(timeout=2_000)
    except Exception:
        # It took itself down between the look and the tap — the same outcome, which is the only
        # reason this swallows anything: what matters next is whether the guide comes back, and the
        # walk asserts that either way.
        pass


def _walk_the_whole_story(page, limit=60):
    """Walk every beat the way a trainer would: ask to be shown where there is something to show,
    read the card where there is not, and tap Next — which is the only thing that moves the guide.

    It follows the story ACROSS the two phones. A beat whose way on is another page (the handover to
    the client's own form, and the hand back afterwards) carries that page on Next itself, so the
    walk simply keeps tapping and the guide comes back up on the other side.

    To WATCH it rather than read a failure, run this file with `--headed --slowmo 400`; that is why
    there is no separate walker script beside it — a second implementation of the walk is a second
    thing to keep true, and this one is already the thing the build gates.
    """
    seen = []
    for _ in range(limit):
        _past_the_splash(page)
        page.locator(PANEL).wait_for(state="visible", timeout=30_000)
        step_now, _ = _step_numbers(page)
        caption = page.locator(CAPTION).inner_text()
        seen.append(caption)

        if page.locator(SHOW_ME).is_visible():
            page.locator(SHOW_ME).click()
        try:
            expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        except AssertionError:
            raise AssertionError(_stuck(page, step_now, caption)) from None
        assert page.locator(PROBLEM).is_hidden(), _stuck(page, step_now, caption)

        page.locator(NEXT).click()
        # The last beat of a SEQUENCE is not the end of the story: the handover and the hand back are
        # both last beats that navigate, and the guide comes back up on the other side. So the end is
        # "no panel returned", never "this was beat n of n" — reading it the other way stopped the
        # walk at the client's phone and called the story finished.
        _past_the_splash(page)
        try:
            page.locator(PANEL).wait_for(state="visible", timeout=6_000)
        except Exception:
            return seen
    raise AssertionError(
        f"the story did not end after {limit} beats; last was {seen[-1]!r}"
    )


def test_the_whole_story_can_be_walked_with_show_me(page, local_server):
    _open_story(page, local_server)

    _, trainer_beats = _step_numbers(page)
    captions = _walk_the_whole_story(page)

    # Every beat of the trainer's own run, PLUS the client's chapter it crosses into and comes back
    # from — the story is one walk over two phones since 2026-08-23, so counting only one leg would
    # pass on a story that never made the crossing.
    assert len(captions) > trainer_beats, len(captions)
    assert any("Ana types her own name" in caption for caption in captions), (
        "the walk never reached the client's own phone"
    )
    # ...and the guide closed on the last beat rather than stalling halfway.
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
    """The gym chapter's point, verified independently of the guide's own grading: what was typed
    mid-circuit is on that participant's record and in the plan being shaped for them.

    Walked as its own chapter, which is also what the claim is about — the story now runs on past
    this into the evening, and asserting it from the end would be asserting where the LAST chapter
    happens to leave the app."""
    _open_story(page, local_server, "?init=demo_data_load&demo=story&chapter=gym")

    _walk_the_whole_story(page)

    expect(page.locator("#client-focus-gym")).to_be_visible()
    expect(page.locator("#client-focus-gym")).to_contain_text("Joint Pain")
    notes = page.locator("#client-focus-notes").inner_text()
    assert "left knee, third round" in notes


def test_the_story_and_the_guide_are_one_numbered_card(page, local_server):
    """Reported 2026-08-23: the story's words and the guide's controls were two separate boxes, so
    the first thing a viewer read carried no step number and the second looked mis-numbered — "1 of
    31" on what was plainly the second card, with no way back from either.

    The promise is one box: the words, the count and the way back are read together, and it starts
    at one."""
    _open_story(page, local_server)

    expect(page.locator("#story-card")).to_be_visible()
    # Compared in the page: a DOM node does not survive the trip out, so identity has to be decided
    # where the nodes are.
    together = page.evaluate(
        "() => { const box = (s) => document.querySelector(s)?.closest('.walkthrough-panel');"
        "        const words = box('#story-card');"
        "        return Boolean(words) && words === box('.walkthrough-progress'); }"
    )
    assert together, "the story's words and the step count must be in the same card"

    step_now, step_count = _step_numbers(page)
    assert step_now == 1, f"the first card a viewer reads is step {step_now}, not 1"
    assert step_count > 1


def test_a_reload_comes_back_on_the_beat_it_left(page, local_server):
    """Reported 2026-08-23: a reload part-way through the story came back at somebody else's first
    card. A demo is watched in interruptions — a phone that locks, a tab restored, a link forwarded
    to a colleague half way through — and starting again from the top is what a viewer will not sit
    through twice. The step names itself in the address, so the address is enough to come back to."""
    _open_story(page, local_server)
    for _ in range(2):
        if page.locator(SHOW_ME).is_visible():
            page.locator(SHOW_ME).click()
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+3\s+of", re.I))
    caption_before = page.locator(CAPTION).inner_text()

    page.reload()
    page.locator(PANEL).wait_for(state="visible", timeout=30_000)

    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+3\s+of", re.I))
    assert page.locator(CAPTION).inner_text() == caption_before
    # And it can be carried on from, rather than being a picture of where you were.
    expect(page.locator(BACK)).to_be_visible()


def test_the_card_holds_still_on_a_beat_that_points_at_itself(page, local_server):
    """Reported 2026-08-23: "4 of 31 jumps up and down". The guide moves its panel off whatever a
    step points at — and a card beat points at the card, which is IN the panel, so moving it moved
    the target too and the answer flipped on every tick. Measured, not eyeballed: the card is where
    it was a second and a half later."""
    _open_story(page, local_server)
    # Walk until a beat whose only control is the card itself — the guide hides Show me on exactly
    # those. Found rather than counted, so adding a beat to the story does not silently move this
    # test onto a different one.
    for _ in range(12):
        if not page.locator(SHOW_ME).is_visible():
            break
        page.locator(SHOW_ME).click()
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()
    else:
        raise AssertionError("no card-only beat in the story's opening chapter")
    expect(page.locator("#story-card")).to_be_visible()
    # Let the beat finish arriving before measuring: the panel settles into place once, which is not
    # what this test is about. What it is about is whether it ever stops.
    # The guide's ring pulses forever on purpose, so an endless animation is not "still settling".
    page.wait_for_function(
        """() => document.getAnimations().every((a) =>
             a.playState !== 'running' || a.effect?.getTiming?.().iterations === Infinity)"""
    )

    seen = []
    for _ in range(10):
        seen.append(
            page.evaluate(
                "() => Math.round("
                "  document.querySelector('.walkthrough-panel').getBoundingClientRect().top)"
            )
        )
        page.wait_for_timeout(150)

    assert len(set(seen)) == 1, f"the card moved while nobody touched it: {seen}"


def test_asking_to_be_shown_again_rebuilds_what_the_first_time_used_up(
    page, local_server
):
    """Reported 2026-08-23: "multiple clicks on Show me should always reset state first".

    The beat that opens the register taps a row inside the menu — and succeeding closes that menu,
    so a second Show me looked for a row that was no longer there and told the trainer the step had
    failed when it had worked. Whatever the trainer has done to the app in between, asking again
    starts from where the beat starts."""
    _open_story(page, local_server)
    page.locator(SHOW_ME).click()
    expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
    page.locator(NEXT).click()
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+2\s+of", re.I))

    for _ in range(3):
        page.locator(SHOW_ME).click()
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        assert page.locator(PROBLEM).is_hidden(), (
            f"the guide reported a failure on a repeat: {page.locator(PROBLEM).inner_text()}"
        )

    expect(page.locator("#btn-invite-client")).to_be_visible()


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


@pytest.mark.clean_start
def test_the_client_half_is_played_on_the_client_page(page, local_server):
    """§35.3e's handover. One persona at a time, and the client's screens are the REAL ones — so the
    story crosses to `/intake` by NAVIGATING, exactly as someone following the trainer's link does,
    and the guide picks up there. A drawn "client phone" would be a recording with extra steps."""
    page.goto(f"{local_server}intake?demo=story&chapter=intake")

    page.locator(PANEL).wait_for(state="visible", timeout=30_000)
    # Up to the chapter's last beat, and no further: that beat's Next hands the browser back to the
    # trainer's phone, and everything asserted below lives on this one.
    while "Back to" not in page.locator(NEXT).inner_text():
        if page.locator(SHOW_ME).is_visible():
            page.locator(SHOW_ME).click()
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()

    # She filled her own form in, on her own phone...
    assert page.input_value("#intake-name") == "Ana Novak"
    assert page.locator("#intake-consent").is_checked()
    # ...and the page still wrote nothing of the app's to it, which is the promise the whole
    # stateless boot exists for. The one key present is the suite's own terms auto-accept
    # (tests/e2e/test_intake.py names it the same way).
    written = page.evaluate(
        "() => Object.keys(localStorage).filter((key) => key.startsWith('librept') "
        "&& key !== 'librept_terms_accepted')"
    )
    assert written == [], written


def test_the_client_chapter_is_counted_and_played_on_its_own_phone(page, local_server):
    """The client's chapter lives in a different boot on a different device, so it is never folded
    into the trainer's numbered run — the guide would be pointing at a form that is not on screen.

    It is reached by GOING there, which since 2026-08-23 is what the guide's own Next does on that
    beat (reported: "why is Open Ana's phone a different button from Next, and why does Next skip the
    intake form?"). So the trainer's counter never counts her beats, and the walk still visits them.
    """
    _open_story(page, local_server)
    _, trainer_beats = _step_numbers(page)

    # Up to the handover, then across.
    while "Open Ana" not in page.locator(NEXT).inner_text():
        if page.locator(SHOW_ME).is_visible():
            page.locator(SHOW_ME).click()
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()
    page.locator(NEXT).click()

    page.locator(PANEL).wait_for(state="visible", timeout=30_000)
    assert "/intake" in page.url, page.url
    _, client_beats = _step_numbers(page)
    assert client_beats < trainer_beats, (
        f"the client's chapter is counted on its own ({client_beats}), not as part of the "
        f"trainer's {trainer_beats}"
    )
    expect(page.locator("#intake-form")).to_be_visible()
