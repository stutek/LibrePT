# tests/medium/test_walkthrough_modal.py
# The guide and whatever the app has left on top of the step — its MODALS and its dropdown MENUS
# (TODO §38.3). Every rule here was invisible from the code and plain on screen.
#
# A `<dialog>` opened with showModal() makes the rest of the page inert. The guide answers that by
# moving its panel INTO the open dialog, which is what keeps Show me and Next tappable. That single
# move is where all three live:
#
#   • Every dialog in this app is a glass card, and `backdrop-filter` makes an element the
#     containing block for `position: fixed` descendants — so the guide's full-screen frame
#     collapsed onto the dialog and drew the card INSIDE the modal, over the controls it was asking
#     for.
#   • "Visible" stopped meaning "reachable": a step could grade itself done against a button painted
#     behind the modal, which is how the step that closes the intake-invite dialog was finished
#     before it happened.
#   • And a modal left standing from an earlier step cannot be walked out of — everything the guide
#     or the trainer might tap to escape it is inert.
#
# Medium rather than e2e: the rules are about the DOM, the top layer and real CSS, and a tour is
# data. Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

# The app's own modal shape — `dialog-modal card glassmorphic` is what every dialog in src/ wears,
# and the backdrop-filter that comes with it is the whole point of the first test.
STAGE = """
const stage = document.createElement('div');
stage.className = 'app-view active';
stage.innerHTML = `
  <button id="open-modal">Open the modal</button>
  <button id="outside">Outside</button>
  <div class="menu-wrap" style="position: relative">
    <button id="open-menu" aria-haspopup="true" aria-expanded="false">Menu</button>
    <div id="the-menu" class="session-menu hidden" role="menu"
         style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; max-height: none; background: #333; z-index: 50">
      <button role="menuitem">Something else</button>
    </div>
  </div>
  <dialog id="the-modal" class="dialog-modal card glassmorphic">
    <button class="modal-close-btn">Close</button>
    <div style="height: 900px"></div>
    <button id="inside">Inside</button>
  </dialog>
  <dialog id="the-small-modal" class="dialog-modal card glassmorphic">
    <button class="modal-close-btn">Close</button>
    <button id="inside-small">Inside</button>
  </dialog>
`;
document.body.appendChild(stage);
const modal = document.getElementById('the-modal');
window.__closes = 0;
modal.addEventListener('close', () => { window.__closes += 1; });
const smallModal = document.getElementById('the-small-modal');
smallModal.querySelector('.modal-close-btn').addEventListener('click', () => smallModal.close());
document.getElementById('open-modal').addEventListener('click', () => modal.showModal());
modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
document.getElementById('outside').addEventListener('click', (e) => {
  e.target.textContent = 'tapped';
});
const menu = document.getElementById('the-menu');
const menuBtn = document.getElementById('open-menu');
menuBtn.addEventListener('click', () => {
  const open = !menu.classList.toggle('hidden');
  menuBtn.setAttribute('aria-expanded', String(open));
});
"""


def _stub(tour_steps, open_at_start=""):
    return f"""
import {{ startGuidedWalkthrough }} from './modules/demo/walkthroughOverlay.js';
{STAGE}
{open_at_start}
window.__walkthrough = startGuidedWalkthrough({{
  tour: {{ id: 'modal-test', steps: {tour_steps} }},
  pollMs: 60,
}});
"""


def _start(page, local_server, stub):
    load_with_stub(page, local_server, stub)
    page.wait_for_selector(".walkthrough-panel")
    page.wait_for_timeout(400)


def test_the_guide_stays_inside_the_modal_it_had_to_move_into(page, local_server):
    """Reported over one evening, three ways: the card "hijacked" by the modal and covering its
    controls; then — once the frame was stretched back over the viewport — "really long scroll bars"
    down the modal; and finally "does not display demo card anymore, so I can't click show me or
    next or back".

    All three are one box. A dialog with a backdrop-filter is the frame of reference for anything
    fixed inside it, it CLIPS whatever hangs off its edges, and what hangs off the bottom becomes
    scrollable overflow. So the guide's frame is the dialog's own visible box — and the assertions
    are about what a person can SEE and TAP, because a geometry check passed while the card was
    being clipped out of sight, which is how the third report happened at all.

    The stub's modal is deliberately taller than the phone: reaching a control in its lower half
    scrolls it, and the guide has to come along."""
    steps = """[
      { id: 'inside', target: '#inside', caption: 'walkthrough_progress',
        expect: { selector: '#never-happens', visible: true } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start="modal.showModal();"))
    # Wait for the frame to reach the dialog's box, rather than measuring after _start's fixed pause:
    # under a full parallel run the guide had moved into the modal but not yet sized its frame, and
    # the measurement below caught it half-way (medium stage, 2026-09-23). A frame that never gets
    # there still fails, on the timeout.
    page.wait_for_function(
        """() => {
            const overlay = document.querySelector('.walkthrough');
            const modal = document.getElementById('the-modal');
            if (!overlay || overlay.parentElement !== modal) return false;
            const frame = overlay.getBoundingClientRect();
            const box = modal.getBoundingClientRect();
            return frame.top >= box.top - 1 && frame.bottom <= box.bottom + 1
                && frame.left >= box.left - 1 && frame.right <= box.right + 1;
        }""",
        timeout=5_000,
    )

    seen = page.evaluate(
        """() => {
            const overlay = document.querySelector('.walkthrough');
            const modal = document.getElementById('the-modal');
            const frame = overlay.getBoundingClientRect();
            const box = modal.getBoundingClientRect();
            const next = document.getElementById('walkthrough-next').getBoundingClientRect();
            const onTop = document.elementFromPoint(next.left + next.width / 2,
                                                    next.top + next.height / 2);
            return {
              parent: overlay.parentElement.id,
              inside: frame.top >= box.top - 1 && frame.bottom <= box.bottom + 1
                      && frame.left >= box.left - 1 && frame.right <= box.right + 1,
              // What the guide ADDS to the modal's own scroll. The stub's content is deliberately
              // longer than the box, so the modal scrolls either way; the reported scrollbars were
              // the guide's frame reaching past the bottom edge, and that is what must be zero.
              addedScroll: (() => {
                const withGuide = modal.scrollHeight;
                overlay.style.display = 'none';
                const without = modal.scrollHeight;
                overlay.style.display = '';
                return withGuide - without;
              })(),
              onTop: onTop ? onTop.id : null,
            };
        }"""
    )
    assert seen["parent"] == "the-modal", (
        "the panel has to be inside the modal to be tappable"
    )
    assert seen["inside"], f"the frame hangs outside the dialog that clips it: {seen}"
    assert seen["addedScroll"] == 0, (
        f"the guide added {seen['addedScroll']}px of scroll to the modal"
    )
    # The decisive one. Layout said the card was on screen while the dialog clipped it out of sight;
    # only "what answers a tap at this point" can tell the difference.
    assert seen["onTop"] == "walkthrough-next", (
        f"the card is not what is on screen: {seen}"
    )


def test_a_control_behind_the_modal_does_not_finish_a_step(page, local_server):
    """The step that CLOSES a modal, in miniature. Its control is the dialog's ✕ and its claim is
    that the dialog is gone; a claim about anything painted behind the modal would be true from the
    moment the modal opened — which is how the story walked on through an invite dialog it never
    closed, with the whole app inert behind it."""
    steps = """[
      { id: 'close-it', target: '#the-modal .modal-close-btn', caption: 'walkthrough_progress',
        expect: { selector: '#outside', visible: true } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start="modal.showModal();"))

    assert page.locator("#walkthrough-next").is_disabled(), (
        "the step was finished by a button nobody could press"
    )

    page.locator("#walkthrough-show").click()
    # The demonstration walks a pointer before it taps, so the wait is the guide's own pace.
    expect(page.locator("#walkthrough-next")).to_be_enabled(timeout=15_000)

    assert page.evaluate("() => document.getElementById('the-modal').open") is False


def test_the_guide_closes_a_modal_the_step_it_is_restoring_is_not_in(
    page, local_server
):
    """Reported 2026-08-25: "the back button keeps the app stuck in the modal". Rebuilding a step's
    ground can navigate and replay forward, and neither reaches out of a modal — so the one thing
    the guide could not repair was the one state nothing else could escape either."""
    steps = """[
      { id: 'tap-outside', target: '#outside', caption: 'walkthrough_progress',
        requires: [{ selector: '#outside', visible: true }],
        expect: { selector: '#outside', containsText: 'tapped' } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start="modal.showModal();"))

    page.locator("#walkthrough-show").click()
    expect(page.locator("#outside")).to_have_text("tapped", timeout=15_000)

    assert page.evaluate("() => document.getElementById('the-modal').open") is False


def test_an_open_menu_is_closed_before_the_step_is_demonstrated(page, local_server):
    """Wanted 2026-08-26 (Simon), reproducing it by hand: "manually open menu and click show me ->
    observe menu is not closed (no state enforcement)".

    A dropdown is not modal, so nothing is inert and nothing looks broken — it just COVERS, and a
    demonstration under one is a hand tapping a control the viewer cannot see. Whether a control is
    reachable is therefore asked at its own centre, not from its rectangle: an element under an open
    menu has a perfectly good box, which is why nothing detected this."""
    steps = """[
      { id: 'tap-outside', target: '#outside', caption: 'walkthrough_progress',
        expect: { selector: '#outside', containsText: 'tapped' } }
    ]"""
    _start(page, local_server, _stub(steps))

    # The trainer opens the menu themselves, mid-step, and it lands over the control.
    page.locator("#open-menu").click()
    page.wait_for_timeout(200)
    covered = page.evaluate(
        """() => {
            const box = document.getElementById('outside').getBoundingClientRect();
            const onTop = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return onTop.id || onTop.parentElement?.id;
        }"""
    )
    assert covered == "the-menu", (
        f"the stub's menu is not covering the control: {covered}"
    )

    # Since 2026-09-13 (§51) that tap interrupts the guide, so Show me is not offered from here: the
    # card's way back closes the menu first, and the step is then shown on a clean screen.
    page.locator("#walkthrough-return").click()
    page.locator("#walkthrough-show").click()
    expect(page.locator("#outside")).to_have_text("tapped", timeout=15_000)

    assert page.locator("#the-menu.hidden").count() == 1, (
        "the step was shown under an open menu"
    )
    assert page.locator("#open-menu").get_attribute("aria-expanded") == "false", (
        "the menu was hidden behind the app's back rather than closed through its own control"
    )


def test_the_card_leaves_a_modal_that_does_not_need_to_scroll(page, local_server):
    """Asked for 2026-08-26 (Simon): "step 4 of 41 card is still trapped in the modal view and covers
    the interface — can you move the demo card outside of modal please?"

    What kept it in there is the dialog's own UA `overflow: auto`, which clips its children. Lifting
    that lets the card draw at the bottom of the SCREEN while staying a child of the dialog — and
    being a child of it is the only thing that keeps it tappable while the rest of the page is inert.

    Only for a dialog that does not need its own scrolling: the modal in the tests above is taller
    than the phone, and a form that cannot scroll is a worse thing to hand someone than a card in the
    way."""
    steps = """[
      { id: 'inside', target: '#inside-small', caption: 'walkthrough_progress',
        expect: { selector: '#never-happens', visible: true } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start="smallModal.showModal();"))

    seen = page.evaluate(
        """() => {
            const overlay = document.querySelector('.walkthrough');
            const modal = document.getElementById('the-small-modal');
            const panel = document.querySelector('.walkthrough-panel').getBoundingClientRect();
            const box = modal.getBoundingClientRect();
            const next = document.getElementById('walkthrough-next').getBoundingClientRect();
            const onTop = document.elementFromPoint(next.left + next.width / 2,
                                                    next.top + next.height / 2);
            return {
              parent: overlay.parentElement.id,
              belowTheModal: panel.top >= box.bottom,
              atTheScreenBottom:
                Math.abs(panel.bottom - document.documentElement.clientHeight) < 40,
              scrolls: getComputedStyle(modal).overflow !== 'visible'
                       && modal.scrollHeight > modal.clientHeight,
              onTop: onTop ? onTop.id : null,
            };
        }"""
    )
    assert seen["parent"] == "the-small-modal", (
        "it still has to live in the modal to be tappable"
    )
    assert seen["belowTheModal"], f"the card is still inside the modal's box: {seen}"
    assert seen["atTheScreenBottom"], (
        f"the card is not where the guide always sits: {seen}"
    )
    # The escape must not be paid for with scrollbars down the modal, which is how the FIRST attempt
    # at getting the card out of there was reported.
    assert not seen["scrolls"], f"the modal gained a scrollbar: {seen}"
    assert seen["onTop"] == "walkthrough-next", (
        f"the card is not what is on screen: {seen}"
    )


def test_showing_a_done_step_again_does_not_blink_what_it_opened(page, local_server):
    """Reported 2026-08-26: "show me on step 3/41 seems to loop". The step that opens the invite
    dialog puts its own control — the button on the page behind — out of reach by succeeding. Asking
    to be shown it again therefore meant closing the dialog to get at the button, tapping it, and
    opening the dialog afresh: from the outside, the app blinking, and anything typed in the meantime
    gone. There is nothing left to demonstrate on a step like that, so nothing happens."""
    steps = """[
      { id: 'open-it', target: '#open-modal', caption: 'walkthrough_progress',
        expect: { selector: '#the-modal', visible: true } }
    ]"""
    _start(page, local_server, _stub(steps))

    page.locator("#walkthrough-show").click()
    expect(page.locator("#walkthrough-next")).to_be_enabled(timeout=15_000)
    assert page.evaluate("() => document.getElementById('the-modal').open") is True

    page.locator("#walkthrough-show").click()
    page.wait_for_timeout(1500)

    closes = page.evaluate("() => window.__closes")
    assert closes == 0, "the dialog was torn down and rebuilt"
    assert page.evaluate("() => document.getElementById('the-modal').open") is True
    assert page.locator(".walkthrough-problem").is_hidden(), (
        "silence, not a complaint: the step worked"
    )
