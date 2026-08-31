# tests/e2e/test_demo_story.py
# The long demo, walked as a trainer would walk it (TODO §35).
#
# Same bargain as tests/e2e/test_demo_tour.py, and the reason both are scripts rather than
# recordings: the story drives the real controls, so the artifact that promotes the app is the
# artifact that proves it still works.
#
# **It is GUIDED, not played** (decided 2026-08-22): four taps can be watched, four minutes cannot,
# and a viewer who is only watching stops watching. So the story runs on the walkthrough's panel —
# the trainer performs each step or asks to be shown it — and this test drives it the same way, by
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


# A card step has no control of its own: it is read, and the guide's own Next is the way on
# (2026-08-23). What used to be a tap on the card is now no tap at all.


# What is worth knowing about the screen when a step does not complete — the questions someone
# debugging a stuck guide asks next, answered in the failure itself rather than by re-running with a
# hand-written browser script. Short on purpose: it is read by a person, not parsed.
ON_SCREEN = """
() => ({
  dialogs: [...document.querySelectorAll("dialog[open]")].map((d) => d.id),
  card: document.getElementById("demo-narrator-card")?.hidden === false ? "shown" : "hidden",
  appMenu: !document.getElementById("app-menu")?.classList.contains("hidden"),
  sessionMenu: !document.getElementById("session-menu")?.classList.contains("hidden"),
  clipboard: !document.getElementById("active-session-overlay")?.classList.contains("hidden"),
  route: location.pathname + location.search,
})
"""


def _stuck(page, step_now, caption):
    """The message a stuck step leaves behind: which step, what it asked for, what the guide said,
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


def _do_step(page):
    """One step, the way a viewer spends one: ask to be shown it where there is something to show,
    and tap Next only if the card has not already followed the app (2026-08-26)."""
    step_now = _step_numbers(page)[0]
    if page.locator(SHOW_ME).is_visible():
        page.locator(SHOW_ME).click()
    if not _card_moved_on(page, step_now):
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()


def _card_moved_on(page, step_now, timeout=8_000):
    """Whether the card followed the app off this step by itself (2026-08-26), or still wants Next."""
    try:
        expect(page.locator(PROGRESS)).not_to_have_text(
            re.compile(rf"step\s+{step_now}\s+of", re.I), timeout=timeout
        )
        return True
    except AssertionError:
        return False


def _walk_the_whole_story(page, limit=60):
    """Walk every step the way a trainer would: ask to be shown where there is something to show,
    read the card where there is not, and tap Next where the card has not already moved on.

    Since 2026-08-26 a step completed in front of the viewer carries the card on by itself, so the
    walk taps Next only when the step it just did was one the card was already satisfied by — a
    narrated card, or a step whose screen the previous one left behind.

    It follows the story ACROSS the two phones. A step whose way on is another page (the handover to
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

        # A step done in front of the viewer carries the card on by itself; one that arrived already
        # satisfied waits for Next. Both are the guide working, so the walk asks which happened
        # rather than tapping Next regardless — which would skip the step after it.
        if not _card_moved_on(page, step_now):
            try:
                expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
            except AssertionError:
                raise AssertionError(_stuck(page, step_now, caption)) from None
            assert page.locator(PROBLEM).is_hidden(), _stuck(page, step_now, caption)
            page.locator(NEXT).click()
        assert page.locator(PROBLEM).is_hidden(), _stuck(page, step_now, caption)
        # The last step of a SEQUENCE is not the end of the story: the handover and the hand back are
        # both last steps that navigate, and the guide comes back up on the other side. So the end is
        # "no panel returned", never "this was step n of n" — reading it the other way stopped the
        # walk at the client's phone and called the story finished.
        _past_the_splash(page)
        try:
            page.locator(PANEL).wait_for(state="visible", timeout=6_000)
        except Exception:
            return seen
    raise AssertionError(
        f"the story did not end after {limit} steps; last was {seen[-1]!r}"
    )


def test_the_whole_story_can_be_walked_with_show_me(page, local_server):
    _open_story(page, local_server)

    _, story_length = _step_numbers(page)
    captions = _walk_the_whole_story(page)

    # The whole story, exactly once each — both phones. Since 2026-08-27 the counter says how long
    # the STORY is rather than how long this leg of it is (§38.9), so the walk and the denominator
    # are directly comparable: anything less means the walk stopped somewhere, and anything more
    # means it went round twice.
    assert len(captions) == story_length, len(captions)
    assert any("Ana types her own name" in caption for caption in captions), (
        "the walk never reached the client's own phone"
    )
    # ...and the guide closed on the last step rather than stalling halfway.
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

    expect(page.locator("#demo-narrator-card")).to_be_visible()
    # Compared in the page: a DOM node does not survive the trip out, so identity has to be decided
    # where the nodes are.
    together = page.evaluate(
        "() => { const box = (s) => document.querySelector(s)?.closest('.walkthrough-panel');"
        "        const words = box('#demo-narrator-card');"
        "        return Boolean(words) && words === box('.walkthrough-progress'); }"
    )
    assert together, "the story's words and the step count must be in the same card"

    step_now, step_count = _step_numbers(page)
    assert step_now == 1, f"the first card a viewer reads is step {step_now}, not 1"
    assert step_count > 1


def test_a_reload_comes_back_on_the_step_it_left(page, local_server):
    """Reported 2026-08-23: a reload part-way through the story came back at somebody else's first
    card. A demo is watched in interruptions — a phone that locks, a tab restored, a link forwarded
    to a colleague half way through — and starting again from the top is what a viewer will not sit
    through twice. The step names itself in the address, so the address is enough to come back to."""
    _open_story(page, local_server)
    for _ in range(2):
        _do_step(page)
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+3\s+of", re.I))
    caption_before = page.locator(CAPTION).inner_text()

    page.reload()
    page.locator(PANEL).wait_for(state="visible", timeout=30_000)

    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+3\s+of", re.I))
    assert page.locator(CAPTION).inner_text() == caption_before
    # And it can be carried on from, rather than being a picture of where you were.
    expect(page.locator(BACK)).to_be_visible()


def test_the_card_holds_still_on_a_step_that_points_at_itself(page, local_server):
    """Reported 2026-08-23: "4 of 31 jumps up and down". The guide moves its panel off whatever a
    step points at — and a card step points at the card, which is IN the panel, so moving it moved
    the target too and the answer flipped on every tick. Measured, not eyeballed: the card is where
    it was a second and a half later."""
    _open_story(page, local_server)
    # Walk until a step whose only control is the card itself — the guide hides Show me on exactly
    # those. Found rather than counted, so adding a step to the story does not silently move this
    # test onto a different one.
    for _ in range(12):
        if not page.locator(SHOW_ME).is_visible():
            break
        _do_step(page)
    else:
        raise AssertionError("no card-only step in the story's opening chapter")
    expect(page.locator("#demo-narrator-card")).to_be_visible()
    # Let the step finish arriving before measuring: the panel settles into place once, which is not
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

    The step that opens the register taps a row inside the menu — and succeeding closes that menu,
    so a second Show me looked for a row that was no longer there and told the trainer the step had
    failed when it had worked. Whatever the trainer has done to the app in between, asking again
    starts from where the step starts.

    And it has to FINISH there too (reported 2026-08-25: "step 3/41 does not ensure menu closed").
    Rebuilding re-opens the menu; skipping the tap because the register was already open then left
    it hanging over the next step's control.

    Walked BACK into rather than repeated in place, because since 2026-08-26 a step done in front of
    the viewer carries the card on — so "asking again" is what you do after returning to it."""
    _open_story(page, local_server)
    _do_step(page)
    _do_step(page)
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+3\s+of", re.I))

    page.locator(BACK).click()
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+2\s+of", re.I))

    for _ in range(3):
        page.locator(SHOW_ME).click()
        page.wait_for_timeout(1200)
        assert page.locator(PROBLEM).is_hidden(), (
            f"the guide reported a failure on a repeat: {page.locator(PROBLEM).inner_text()}"
        )
        expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+2\s+of", re.I))

    expect(page.locator("#btn-invite-client")).to_be_visible()
    assert page.locator("#app-menu.hidden").count() == 1, (
        "the menu the rebuild re-opened is still covering the register"
    )


def test_walking_back_out_of_a_dialog_and_forward_again_reopens_it(page, local_server):
    """Reported 2026-08-26: "back and forth for demo steps surrounding sending intake link don't
    work".

    Back out of the invite modal CLOSES it, which is right — the step before it happens on the
    register page. Walking forward again then stepped through four steps whose controls were inside
    that closed dialog, lighting Next on each because each was done on the first pass, over a screen
    where none of it was happening. Nothing detected it: none of those steps declares a
    precondition, and a control inside a closed dialog is not something a selector complains about.
    Being READY now includes the step's own control being reachable."""
    _open_story(page, local_server)

    # Forward to the step that types a phone number into the invite dialog.
    for _ in range(4):
        _do_step(page)
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+5\s+of", re.I))
    expect(page.locator("#dialog-intake-invite")).to_be_visible()

    for _ in range(3):
        page.locator(BACK).click()
        page.wait_for_timeout(400)
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+2\s+of", re.I))
    expect(page.locator("#dialog-intake-invite")).to_be_hidden()

    for _ in range(2):
        page.locator(NEXT).click()
        page.wait_for_timeout(600)

    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+4\s+of", re.I))
    # The step asks for a number to be typed into a field in that dialog, so the dialog is back.
    expect(page.locator("#dialog-intake-invite")).to_be_visible(timeout=15_000)
    assert page.locator(PROBLEM).is_hidden(), page.locator(PROBLEM).inner_text()


def test_walking_back_puts_the_screen_the_card_describes_back(page, local_server):
    """Reported 2026-08-26: "going back in demo from step 7 to step 4 does not clear/update the
    intake address / number".

    Being able to PERFORM a step is not the same as standing where it begins. The rebuild reopened
    the invite dialog — which empties its contact field — and stopped there, because the step's own
    control was now reachable and nothing looked wrong. The card then read "type it over the number"
    over an empty box. Every step the story has already shown is part of the next one's ground."""
    _open_story(
        page, local_server, "clients?init=demo_data_load&demo=story&step=arrive-invite"
    )
    for _ in range(4):
        _do_step(page)
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+7\s+of", re.I))

    for _ in range(3):
        page.locator(BACK).click()
        page.wait_for_timeout(1500)

    # Step 4 typed the number, and it is back in the box the card is talking about.
    expect(page.locator(PROGRESS)).to_have_text(re.compile(r"step\s+4\s+of", re.I))
    expect(page.locator("#dialog-intake-invite")).to_be_visible()
    assert page.input_value("#intake-invite-contact") == "+386 41 234 567", (
        "the card asks for a number the app is not showing"
    )
    expect(page.locator("#intake-invite-send")).to_contain_text("text message")


def test_the_trainer_reads_what_ana_sent_and_she_lands_in_the_register(
    page, local_server
):
    """The step the story used to skip, and the one the whole first chapter is FOR: a person exists
    in the register only once they sent their own details and the trainer accepted them (§26.5).

    It was called unscriptable because opening a file needs the operating system's picker, which no
    page can drive. The seam moved rather than the refusal. Since 2026-08-30 the story shows where
    the file actually is — an attachment under Ana's message, drawn as a screenshot of the trainer's
    messaging app — and tapping it opens the review, which is what tapping it on a phone now does
    (§38.22). The app then reads it, matches it and saves it unchanged. What this asserts is the
    outcome a trainer cares about: she is in the register, and nobody typed her in."""
    # On the register, which is where the hand back from Ana's phone lands — and where the result of
    # this chapter has to be visible.
    _open_story(
        page,
        local_server,
        "clients?init=demo_data_load&demo=story&step=review-message",
    )

    for _ in range(2):
        _do_step(page)
        assert page.locator(PROBLEM).is_hidden(), page.locator(PROBLEM).inner_text()

    expect(page.locator("#clients-list")).to_contain_text("Ana Novak")
    # Her own words came with her — the shoulder she mentioned is on the record the trainer will
    # write every plan against, which is the difference between a form and a client.
    assert "shoulder" in page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const ana = store.getState().clients.find((c) => c.name === 'Ana Novak');
            return JSON.stringify(ana);
        }"""
    )


def test_one_chapter_can_be_walked_on_its_own(page, local_server):
    """Chapters exist because nobody watches five unbroken minutes of software they do not use yet,
    so a link naming one has to open that one.

    It opens where that chapter SITS in the story, not at "1 of its own length" (§38.9): someone
    handed a link to the gym chapter is joining a story part-way, and the count is what tells them
    so. The whole story opened from the top still reads step 1, which is what makes this a place
    rather than an offset.
    """
    chapters = _chapter_ids()
    assert chapters, "the story declares no chapters"

    _open_story(page, local_server)
    first_step, story_length = _step_numbers(page)
    assert first_step == 1, "the story opened from the top starts at its first step"

    _open_story(
        page, local_server, f"?init=demo_data_load&demo=story&chapter={chapters[0]}"
    )

    expect(page.locator(PANEL)).to_be_visible()
    chapter_step, chapter_total = _step_numbers(page)
    assert chapter_total == story_length, (
        f"the chapter reports a story {chapter_total} steps long, the story itself {story_length}"
    )
    assert 1 <= chapter_step <= story_length


@pytest.mark.clean_start
def test_the_story_does_not_run_without_demo_data(page, local_server):
    """A story with nothing to demonstrate would point at a blank screen."""
    page.goto(f"{local_server}?demo=story")
    page.wait_for_selector("#app-header", timeout=15_000)
    page.wait_for_timeout(1_500)

    assert page.locator(PANEL).count() == 0
    assert page.evaluate("() => document.getElementById('demo-narrator-card')") is None


@pytest.mark.clean_start
def test_the_client_half_is_played_on_the_client_page(page, local_server):
    """§35.3e's handover. One persona at a time, and the client's screens are the REAL ones — so the
    story crosses to `/intake` by NAVIGATING, exactly as someone following the trainer's link does,
    and the guide picks up there. A drawn "client phone" would be a recording with extra steps."""
    page.goto(f"{local_server}intake?demo=story&chapter=intake")

    page.locator(PANEL).wait_for(state="visible", timeout=30_000)
    # Up to the chapter's last step, and no further: that step's Next hands the browser back to the
    # trainer's phone, and everything asserted below lives on this one.
    while "Back to" not in page.locator(NEXT).inner_text():
        _do_step(page)

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


def test_crossing_to_the_client_phone_carries_the_story_count_over(page, local_server):
    """Asked for 2026-08-27 (Simon): "zakaj je anin telefon demo števec 1/10, zakaj ne nadaljuje po
    demo števcu z enakim slogom kot do sedaj" — the counter restarted when the story crossed phones.

    Her chapter is still not folded into the trainer's step list: it lives in a different boot on a
    different device, and a guide walking those steps on his phone would point at a form that is not
    there. What crosses is the NUMBER. A viewer watching "step 10 of 41" become "step 1 of 8" reads
    it as having left the story and started something else, which is exactly what they have not done
    (§38.9).

    It is reached by GOING there, which since 2026-08-23 is what the guide's own Next does on that
    step (reported: "why is Open Ana's phone a different button from Next, and why does Next skip the
    intake form?").
    """
    _open_story(page, local_server)

    # Up to the handover, then across.
    while "Open Ana" not in page.locator(NEXT).inner_text():
        _do_step(page)
    handover_step, story_length = _step_numbers(page)
    page.locator(NEXT).click()

    page.locator(PANEL).wait_for(state="visible", timeout=30_000)
    assert "/intake" in page.url, page.url
    her_step, her_total = _step_numbers(page)
    assert (her_step, her_total) == (handover_step + 1, story_length), (
        f"the story crossed from step {handover_step} of {story_length} to step {her_step} of "
        f"{her_total} — a viewer reads that as a different demo starting"
    )
    expect(page.locator("#intake-form")).to_be_visible()


# Every moment the guide's complaint line was on screen, kept from before the app boots so the test
# sees a message that appears and is withdrawn again half a second later — which is exactly the
# failure, and exactly what a retrying assertion is built to miss.
WATCH_COMPLAINTS = """
window.__complaints = [];
new MutationObserver((records) => {
  for (const record of records) {
    const el = record.target;
    if (el.classList?.contains("walkthrough-problem") && !el.hidden) {
      window.__complaints.push(el.textContent.trim());
    }
  }
// The DOCUMENT, not its element: this runs before the page is parsed, and
// `document.documentElement` is null there — observing it throws, and the watch that was supposed
// to catch the complaint silently never ran.
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
"""


def test_the_guide_does_not_call_the_screen_wrong_while_scrolling_to_it(
    page, local_server
):
    """TODO §38.17, measured at the evening's session move: the guide said "this step needs a
    different screen" for half a second on the very screen the step lives on, then scrolled to the
    control and withdrew it.

    The card was on the board the whole time, 650px above the fold. `isCovered` clamped the
    control's centre into the viewport before asking what was drawn there, so the answer came back
    "the app header" — and the guide waited out its whole settle budget for a control nothing was
    going to uncover, complained, and only then scrolled to it. Bringing a control into view is the
    guide's own job; being out of view is not being covered."""
    # A phone, because that is where the board runs long enough to put the card off the screen —
    # on a desktop viewport the evening's session is already in view and there is nothing to scroll.
    page.set_viewport_size({"width": 390, "height": 844})
    page.add_init_script(WATCH_COMPLAINTS)
    _open_story(page, local_server, "?init=demo_data_load&demo=story&step=evening-move")

    control = page.locator(
        ".session-card", has_text="Tuesday & Thursday"
    ).first.locator(".btn-edit-session")
    # The guide has finished putting the app where the step happens.
    expect(control).to_be_in_viewport(timeout=30_000)
    assert page.evaluate("() => window.__complaints") == [], (
        "the guide complained about the screen it was already on"
    )
    # And it arrives on a clean screen: the ☰ menu the replayed theme step re-opened is closed,
    # rather than left standing over the card the ring is about to name. The sweep that closes it
    # used to run only because an off-screen control read as covered.
    expect(page.locator("#app-menu")).to_be_hidden()
