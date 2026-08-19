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
    pretend to. So a step returned to stays done, and Next is there without doing it again."""
    _open_walkthrough(page, local_server)
    _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("2")

    page.locator(BACK).click()

    expect(page.locator(PROGRESS)).to_contain_text("1")
    expect(page.locator(NEXT)).to_be_enabled()
    # Show me is still offered here (reported 2026-08-18: walking back left a guide with no Show me
    # anywhere, because every step behind you is done). It is safe because the action is idempotent
    # — see test_re_showing_a_done_step_changes_nothing.
    expect(page.locator(SHOW_ME)).to_be_visible()


def test_re_showing_a_done_step_changes_nothing(page, local_server):
    """Decided 2026-08-18: "show me should always start from the same state and execute the same
    action idempotently".

    Step 3 signals Too Easy, and that control is a TOGGLE — replaying its tap would clear the signal
    it had just demonstrated, which is worse than the missing button this fixes. So the demonstration
    runs again (pointer, press, ripple) while the action does not: pressing Show me once or five
    times leaves the same state.
    """
    _open_walkthrough(page, local_server)
    for _ in range(3):
        _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("4")
    signal = page.locator(".circuit-sig.easy.active")

    page.locator(BACK).click()
    expect(page.locator(PROGRESS)).to_contain_text("3")
    for _ in range(3):
        page.locator(SHOW_ME).click()
        page.wait_for_timeout(2200)

    expect(signal.first).to_be_visible()
    expect(page.locator(PROGRESS)).to_contain_text("3"), "a replay is not progress"


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


def test_a_deep_link_starts_the_walkthrough_where_the_script_starts(page, local_server):
    """Reported 2026-08-18: refreshing a clipboard URL that carries `?demo=walkthrough` "starts demo
    at wrong step".

    It started at step 1 correctly — and step 1 says "open the group session" while the session was
    already open behind the panel, which from a trainer's side is the guide asking for something
    that has plainly happened. A pasted or refreshed link can point anywhere, so the walkthrough
    puts the app where its script begins rather than trusting the URL it was opened with.
    """
    page.goto(
        f"{local_server}session/s01f2e3d/client/c1a9f0e2/circuit/z06a2b3c"
        "?init=demo_data_load&splash=off&demo=walkthrough"
    )
    page.locator(PANEL).wait_for(state="visible", timeout=30_000)

    expect(page.locator(PROGRESS)).to_contain_text("1")
    # The state step 1 is written against: the board, not a clipboard already open over it.
    expect(page.locator("#active-session-overlay")).to_have_class(
        re.compile(r"\bhidden\b")
    )
    expect(page.locator(".session-card").first).to_be_visible()


def test_a_step_whose_ground_was_pulled_away_rebuilds_it(page, local_server):
    """Wanted 2026-08-18: "when the demo card for step loads, it should assert the app state is right
    (right view, right data)" — and 2026-08-19, what to DO about it: rebuild the state, do not tell
    the trainer to start over.

    A step whose control cannot exist yet will fail confusingly the moment anyone taps Show me. The
    check runs when the card LOADS; what follows is the guide replaying the steps that build the
    state — here, reopening the clipboard the trainer closed behind it.
    """
    _open_walkthrough(page, local_server)
    _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("2")

    # Leave the clipboard the way a trainer might: step 2 now has nothing to point at.
    page.locator("#active-session-overlay .view-grabber").click()
    page.wait_for_timeout(600)

    # Re-entering the step is when its card loads, which is when the check runs. Checking on every
    # poll tick instead was considered and left alone: a message that appears mid-transition, while
    # a view is still swapping, would cry wolf on the one surface a newcomer is reading closely.
    page.locator(BACK).click()
    page.locator(NEXT).click()

    expect(page.locator(PROGRESS)).to_contain_text("2")
    expect(page.locator("#active-exercise-scroll-deck")).to_be_visible(timeout=15_000)
    expect(page.locator(".walkthrough-problem")).to_be_hidden()


def test_show_me_brings_a_scrolled_away_control_into_view_before_tapping(
    page, local_server
):
    """Reported 2026-08-19: "when session list is scrolled, the highlighted element gets out of view,
    show me should scroll the view into middle screen first before clicking".

    Measured at 390px: scrolling the board to its last day puts the step's card ~1000px above the
    viewport, and the spotlight follows it off screen. Tapping Show me then produced a control
    changing somewhere nobody could see — the tap worked, which is the worst version of this, because
    the demo appears to skip a step.

    The rect is captured ON THE CLICK, which is the only moment that matters: a check afterwards
    would pass on a page that scrolled there later.
    """
    page.set_viewport_size({"width": 390, "height": 844})
    _open_walkthrough(page, local_server)
    page.wait_for_timeout(800)

    page.evaluate(
        """() => {
            window.__clickedAt = null;
            const card = [...document.querySelectorAll('.session-card')]
                .find((c) => c.textContent.includes('Group Strength'));
            card.addEventListener('click', () => {
                const r = card.getBoundingClientRect();
                window.__clickedAt = { top: r.top, bottom: r.bottom, height: window.innerHeight };
            }, { capture: true });
            const headers = [...document.querySelectorAll('[data-date]')];
            headers[headers.length - 1]?.scrollIntoView({ block: 'start' });
        }"""
    )
    page.wait_for_timeout(600)

    page.locator(SHOW_ME).click()
    page.wait_for_function("() => window.__clickedAt !== null", timeout=15_000)

    where = page.evaluate("() => window.__clickedAt")
    assert where["top"] >= 0 and where["bottom"] <= where["height"], (
        f"tapped a card at {where['top']}..{where['bottom']} of a {where['height']}px viewport"
    )
    # "Into middle screen", which is what was asked for and is stronger than merely on-screen: a
    # control tapped at the very edge is one a viewer's eye never reaches in time. A quarter of the
    # viewport of slack, because a card near the end of a scroll container cannot always be centred.
    centre = (where["top"] + where["bottom"]) / 2
    assert abs(centre - where["height"] / 2) < where["height"] / 4, (
        f"tapped a card centred at {centre} in a {where['height']}px viewport"
    )


def test_going_back_across_a_view_boundary_returns_to_that_view(page, local_server):
    """Reported 2026-08-19: "clicking back in demo needs to also switch back to previous view".

    Step 1 happens on the sessions board and step 2 inside the clipboard it opens. Going back left
    the clipboard covering the board, so the panel asked the trainer to open a session while the
    session sat open on top of it — the same confusion a refreshed deep link produced, arrived at
    from the other direction.
    """
    _open_walkthrough(page, local_server)
    _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("2")
    expect(page.locator("#active-session-overlay")).not_to_have_class(
        re.compile(r"\bhidden\b")
    )

    page.locator(BACK).click()

    expect(page.locator(PROGRESS)).to_contain_text("1")
    expect(page.locator("#active-session-overlay")).to_have_class(
        re.compile(r"\bhidden\b"), timeout=10_000
    )
    expect(page.locator(".session-card").first).to_be_visible()
    # And having restored the ground the step needs, it must not also be complaining about it.
    expect(page.locator(".walkthrough-problem")).to_be_hidden()


def test_the_diagnosis_goes_to_the_console_not_to_the_trainer(page, local_server):
    """Decided 2026-08-19: "the red assertion text is helpful to me for investigations, but should not
    be customer visible".

    A step's diagnosis is a CSS selector and an unmet expectation — exactly what someone debugging
    the script needs, and exactly what a trainer can do nothing with. It goes to the console rather
    than being deleted: the alternative to showing it is putting it where an investigator already
    looks. Here the app recovers, so the trainer is told nothing at all — and the console still says
    which step needed rebuilding.
    """
    warnings = []
    page.on("console", lambda message: warnings.append(message.text))
    _open_walkthrough(page, local_server)
    _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("2")

    page.locator("#active-session-overlay .view-grabber").click()
    page.wait_for_timeout(600)
    page.locator(BACK).click()
    page.locator(NEXT).click()
    expect(page.locator("#active-exercise-scroll-deck")).to_be_visible(timeout=15_000)

    assert any("[walkthrough]" in text for text in warnings), (
        f"nothing diagnosable reached the console: {warnings}"
    )
    expect(page.locator(".walkthrough-problem")).to_be_hidden()


def test_the_spotlight_follows_the_page_immediately_when_it_scrolls(page, local_server):
    """Reported 2026-08-19 on a `?demo=walkthrough` deep link into a dated board: "highlight box is
    above the application header, not highlighting the right card".

    The ring was repositioned only by the 250ms poll, so anything that moved the page between ticks —
    the timeline settling to the day in the URL, right after boot — left it drawn where the card had
    been, which on a scrolled board is over the header. Sampled a frame after a scroll, not a tick.
    """
    page.set_viewport_size({"width": 390, "height": 844})
    _open_walkthrough(page, local_server)
    page.wait_for_timeout(900)

    page.evaluate(
        "() => window.scrollBy(0, 220) || document.scrollingElement.scrollBy(0, 220)"
    )
    page.wait_for_timeout(80)  # far under the poll interval

    drift = page.evaluate(
        """() => {
            const spot = document.querySelector('.walkthrough-spotlight').getBoundingClientRect();
            const card = [...document.querySelectorAll('.session-card')]
                .find((c) => c.textContent.includes('Group Strength'));
            if (!card) return null;
            const box = card.getBoundingClientRect();
            return Math.round(Math.abs(spot.top - box.top));
        }"""
    )
    if drift is not None:
        assert drift <= 2, f"ring is {drift}px from the card it is meant to be on"


def test_the_spotlight_does_not_draw_over_the_header(page, local_server):
    """The visible half of the same report: a ring for a control scrolled up behind the header has
    nothing to point at, and drawing it there points at the header instead."""
    page.set_viewport_size({"width": 390, "height": 844})
    _open_walkthrough(page, local_server)
    page.wait_for_timeout(900)

    page.evaluate(
        """() => {
            const headers = [...document.querySelectorAll('[data-date]')];
            headers[headers.length - 1]?.scrollIntoView({ block: 'start' });
        }"""
    )
    page.wait_for_timeout(500)

    state = page.evaluate(
        """() => {
            const spot = document.querySelector('.walkthrough-spotlight');
            const box = spot.getBoundingClientRect();
            const header = document.getElementById('app-header').getBoundingClientRect();
            return { visible: spot.classList.contains('is-visible'), top: box.top, header: header.bottom };
        }"""
    )
    assert not state["visible"] or state["top"] >= state["header"], (
        f"ring at y={state['top']} with the header ending at {state['header']}"
    )


def test_the_ring_appears_where_it_belongs_rather_than_flying_in(page, local_server):
    """Asked 2026-08-19: "pulse is ok, but why it needs to fly in with delay?".

    The ring transitions its position and size so that moving between steps reads as one ring
    travelling rather than two rings blinking. The side effect was its FIRST appearance sliding in
    from the corner of the screen, which is not information — it is a wait before the guide starts.
    Sampled one frame after it becomes visible.
    """
    _open_walkthrough(page, local_server)
    page.wait_for_selector(".walkthrough-spotlight.is-visible", timeout=30_000)

    drift = page.evaluate(
        """() => new Promise((resolve) => requestAnimationFrame(() => {
            const spot = document.querySelector('.walkthrough-spotlight').getBoundingClientRect();
            const card = [...document.querySelectorAll('.session-card')]
                .find((c) => c.textContent.includes('Group Strength'));
            const box = card.getBoundingClientRect();
            resolve(Math.round(Math.hypot(spot.left - box.left, spot.top - box.top)));
        }))"""
    )

    assert drift <= 4, f"ring was {drift}px from its control on the frame it appeared"


def test_back_off_the_last_step_rebuilds_the_state_that_step_needs(page, local_server):
    """Reported 2026-08-19: "After completing demo I click back and get: This step needs a different
    screen — go back to the sessions board and start it again. that is not acceptable".

    Step 4 switches participant, which re-renders the deck for somebody else — so the Too Easy signal
    step 3 asks for is no longer on screen, through no fault of the trainer. A button they were
    offered must leave the app in the state the step it lands on needs: the walkthrough performs the
    preceding steps itself rather than telling them to start over.
    """
    _open_walkthrough(page, local_server)
    for _ in range(3):
        _do_current_step(page)
    expect(page.locator(PROGRESS)).to_contain_text("4")
    page.locator(SHOW_ME).click()
    expect(page.locator(NEXT)).to_be_enabled(timeout=15_000)

    page.locator(BACK).click()

    expect(page.locator(PROGRESS)).to_contain_text("3")
    expect(page.locator(".walkthrough-problem")).to_be_hidden()
    expect(page.locator(".circuit-sig.easy").first).to_be_visible(timeout=15_000)
