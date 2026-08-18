# tests/e2e/test_walkthrough.py
# The guided walkthrough over the real app (TODO §9.5).
#
# It plays the SAME script as the automatic demo (gymFloorTour.js) — the difference is who taps. So
# what is worth testing here is not the flow (test_demo_tour.py already proves the four steps work),
# it is the guiding: the panel asks for one thing at a time, it notices the trainer doing that thing
# themselves, it never asks for something already done, and it can be left in one tap without
# touching their data.
#
# The blank-app churn §23.5 names is what this exists for, so the entry-point half of it — the splash
# button bringing demo data with it — is asserted in test_splash_screen.py where the splash lives.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

from playwright.sync_api import expect
import pytest

PANEL = "#walkthrough-overlay"
CAPTION = "#walkthrough-overlay .walkthrough-caption"
PROGRESS = "#walkthrough-overlay .walkthrough-progress"
SHOW_ME = "#walkthrough-show"
NEXT = "#walkthrough-next"
BACK = "#walkthrough-back"
EXIT = "#walkthrough-exit"

# Four steps, and the panel says so. Read from the script rather than hardcoded, so shortening the
# tour cannot leave this quietly asserting a count nobody ships.
STEP_COUNT_PATTERN = re.compile(r"\b(\d+)\s*$")


def _open_walkthrough(page, local_server):
    page.goto(f"{local_server}?init=demo_data_load&demo=walkthrough")
    page.locator(PANEL).wait_for(state="visible", timeout=30_000)


def _do_current_step(page):
    """Ask to be shown, and take whichever exit the step offers.

    Since 2026-08-18 a delegated step advances by itself, so on every step but the last this is the
    WHOLE loop. The last one still ends on the trainer's own tap, because advancing off it closes
    the walkthrough (see test_the_last_step_still_ends_on_the_trainers_tap)."""
    progress_before = page.locator(PROGRESS).inner_text()
    # Which exit to expect is decided BEFORE the tap, from the step number. Waiting for "progress
    # changed OR Next enabled" instead was racy: Next is briefly enabled between the step completing
    # and the guide advancing, so the wait could return while the panel was still mid-transition.
    step_now, step_count = (int(n) for n in re.findall(r"\d+", progress_before))

    page.locator(SHOW_ME).click()

    if step_now == step_count:
        expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
        page.locator(NEXT).click()
    else:
        # Matched on the step NUMBER, case-insensitively, rather than against the string read back
        # from inner_text(): the panel uppercases its progress line in CSS, so inner_text() returns
        # "STEP 1 OF 4" while the assertion compares something else — and "not this text" was
        # therefore true before anything had happened at all.
        expect(page.locator(PROGRESS)).to_have_text(
            re.compile(rf"step\s+{step_now + 1}\s+of", re.I), timeout=15_000
        )


def test_the_panel_asks_for_one_step_and_offers_no_way_past_it(page, local_server):
    """Next is unavailable until the step happens, and that is not pedagogy: the next step's control
    does not exist yet (there is no circuit card before the clipboard is open), so a Next that worked
    here would point the trainer at nothing."""
    _open_walkthrough(page, local_server)

    expect(page.locator(NEXT)).to_be_disabled()
    expect(page.locator(SHOW_ME)).to_be_visible()
    expect(page.locator(BACK)).to_be_hidden()
    expect(page.locator(PROGRESS)).to_contain_text("1")


def test_the_explanation_is_translated_copy_and_not_a_key(page, local_server):
    """A missing translation renders the i18n key itself, which is invisible to every other test and
    is the first thing a trainer would see. The step's caption is the whole guidance — if it says
    `tour_step_open_session`, the walkthrough has no content at all."""
    _open_walkthrough(page, local_server)

    caption = page.locator(CAPTION).inner_text().strip()
    assert caption, "the step has no explanation"
    assert not caption.startswith("tour_step_"), (
        f"untranslated i18n key on screen: {caption}"
    )
    assert " " in caption, (
        f"a caption should be a sentence, not an identifier: {caption}"
    )


def test_the_trainer_doing_the_step_themselves_is_what_advances_it(page, local_server):
    """The point of guiding someone through the REAL app: they tap the real control, and the panel
    notices. A walkthrough that only advanced on its own buttons would be teaching its own buttons."""
    _open_walkthrough(page, local_server)

    page.locator(".session-card", has_text="Group Strength").first.click()

    expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
    expect(page.locator(SHOW_ME)).to_be_hidden()
    # And the app really did what the step said, not merely the panel's opinion of it.
    expect(page.locator("#active-session-client-tabs")).to_be_visible()


def test_show_me_taps_the_control_for_a_trainer_who_cannot_find_it(page, local_server):
    _open_walkthrough(page, local_server)

    page.locator(SHOW_ME).click()

    expect(page.locator("#active-session-client-tabs")).to_be_visible(timeout=15_000)


def test_asking_to_be_shown_moves_on_by_itself(page, local_server):
    """Reported 2026-08-18: "show me clicks the button right, but the demo step did not advance".

    It completed the step and then waited for Next, which is two taps for the one thing the trainer
    had just delegated — from their side, asking to be shown did nothing to the guide. Doing it
    THEMSELVES still leaves Next to them: there they are learning by doing and may want to read the
    caption against what just happened. Delegating is the case where the guide should carry on.
    """
    _open_walkthrough(page, local_server)
    expect(page.locator(PROGRESS)).to_contain_text("1")

    page.locator(SHOW_ME).click()

    expect(page.locator(PROGRESS)).to_contain_text("2", timeout=15_000)
    # And it is asking for the NEXT step, not still explaining the last one.
    expect(page.locator(NEXT)).to_be_disabled()
    expect(page.locator(SHOW_ME)).to_be_visible()


def test_the_last_step_still_ends_on_the_trainers_tap(page, local_server):
    """Advancing off the final step CLOSES the walkthrough. Doing that on their behalf would make
    the guide vanish mid-gesture, so Done stays a deliberate tap even when the step was delegated."""
    _open_walkthrough(page, local_server)
    for _ in range(3):
        _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("4")

    page.locator(SHOW_ME).click()

    expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)
    expect(page.locator(PANEL)).to_be_visible()


def test_going_back_re_reads_a_step_without_asking_for_it_again(page, local_server):
    """Back re-explains against an app that has already moved on — it cannot undo a tap, and must not
    pretend to. So a step returned to stays done: no second Too Easy signal logged because the
    trainer wanted to re-read what the first one meant."""
    _open_walkthrough(page, local_server)
    _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("2")

    page.locator(BACK).click()

    expect(page.locator(PROGRESS)).to_contain_text("1")
    expect(page.locator(NEXT)).to_be_enabled()
    expect(page.locator(SHOW_ME)).to_be_hidden()


def test_walking_the_whole_script_ends_with_the_app_in_the_state_it_showed(
    page, local_server
):
    """The walkthrough closes itself on the last step and leaves the trainer inside the thing they
    were just shown — a live clipboard on the second participant — rather than back at a start
    screen, which would throw away the four taps they just made."""
    _open_walkthrough(page, local_server)

    step_count = int(
        STEP_COUNT_PATTERN.search(page.locator(PROGRESS).inner_text()).group(1)
    )
    for _ in range(step_count):
        _do_current_step(page)

    expect(page.locator(PANEL)).to_have_count(0)
    assert page.evaluate("() => document.getElementById('demo-tour-hand')") is None
    expect(
        page.locator("#active-session-client-tabs .client-tab-btn:nth-child(2)")
    ).to_have_class(re.compile(r"\bactive\b"))

    # The signal logged in step 3 belonged to the FIRST participant, and switching in step 4 correctly
    # re-rendered the deck for the second — so it is only back there that it should still be set. The
    # walkthrough's taps are the trainer's taps: closing the panel must not have rolled them back.
    page.locator("#active-session-client-tabs .client-tab-btn:nth-child(1)").click()
    expect(page.locator(".circuit-sig.easy.active").first).to_be_visible()


def test_leaving_is_one_tap_and_takes_nothing_with_it(page, local_server):
    """Gym-floor rule: any guide that cannot be dropped mid-set is a guide that gets in the way of a
    client. Leaving keeps whatever the trainer already did — the signal they logged is theirs."""
    _open_walkthrough(page, local_server)
    _do_current_step(page)

    page.locator(EXIT).click()

    expect(page.locator(PANEL)).to_have_count(0)
    assert page.evaluate("() => document.getElementById('demo-tour-hand')") is None
    # The app is still there and still usable, not left under a dead full-screen overlay.
    expect(page.locator("#active-session-client-tabs")).to_be_visible()
    assert page.locator("#backup-btn").is_enabled()


@pytest.mark.clean_start
def test_no_walkthrough_without_something_to_walk_through(page, local_server):
    """`?demo=walkthrough` on an empty app would spotlight selectors that match nothing. A trainer who
    followed a stale link must get their app, not a panel pointing at a blank screen."""
    page.goto(f"{local_server}?demo=walkthrough")
    page.wait_for_selector("#app-header", timeout=15_000)
    page.wait_for_timeout(1_500)

    assert page.evaluate("() => document.getElementById('walkthrough-overlay')") is None
