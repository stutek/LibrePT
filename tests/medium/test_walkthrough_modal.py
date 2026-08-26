# tests/medium/test_walkthrough_modal.py
# The guide and the app's own MODALS — three rules learned the same evening (TODO §38.3), all of
# them invisible from the code and plain on screen.
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
#     behind the modal, which is how the beat that closes the intake-invite dialog was finished
#     before it happened.
#   • And a modal left standing from an earlier beat cannot be walked out of — everything the guide
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
  <dialog id="the-modal" class="dialog-modal card glassmorphic">
    <button class="modal-close-btn">Close</button>
    <div style="height: 900px"></div>
    <button id="inside">Inside</button>
  </dialog>
`;
document.body.appendChild(stage);
const modal = document.getElementById('the-modal');
document.getElementById('open-modal').addEventListener('click', () => modal.showModal());
modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
document.getElementById('outside').addEventListener('click', (e) => {
  e.target.textContent = 'tapped';
});
"""


def _stub(tour_steps, open_at_start=False):
    return f"""
import {{ startGuidedWalkthrough }} from './modules/demo/walkthroughOverlay.js';
{STAGE}
{"modal.showModal();" if open_at_start else ""}
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
    _start(page, local_server, _stub(steps, open_at_start=True))

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
    """The beat that CLOSES a modal, in miniature. Its control is the dialog's ✕ and its claim is
    that the dialog is gone; a claim about anything painted behind the modal would be true from the
    moment the modal opened — which is how the story walked on through an invite dialog it never
    closed, with the whole app inert behind it."""
    steps = """[
      { id: 'close-it', target: '#the-modal .modal-close-btn', caption: 'walkthrough_progress',
        expect: { selector: '#outside', visible: true } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start=True))

    assert page.locator("#walkthrough-next").is_disabled(), (
        "the step was finished by a button nobody could press"
    )

    page.locator("#walkthrough-show").click()
    # The demonstration walks a pointer before it taps, so the wait is the guide's own pace.
    expect(page.locator("#walkthrough-next")).to_be_enabled(timeout=15_000)

    assert page.evaluate("() => document.getElementById('the-modal').open") is False


def test_the_guide_closes_a_modal_the_beat_it_is_restoring_is_not_in(
    page, local_server
):
    """Reported 2026-08-25: "the back button keeps the app stuck in the modal". Rebuilding a beat's
    ground can navigate and replay forward, and neither reaches out of a modal — so the one thing
    the guide could not repair was the one state nothing else could escape either."""
    steps = """[
      { id: 'tap-outside', target: '#outside', caption: 'walkthrough_progress',
        requires: [{ selector: '#outside', visible: true }],
        expect: { selector: '#outside', containsText: 'tapped' } }
    ]"""
    _start(page, local_server, _stub(steps, open_at_start=True))

    page.locator("#walkthrough-show").click()
    expect(page.locator("#outside")).to_have_text("tapped", timeout=15_000)

    assert page.evaluate("() => document.getElementById('the-modal').open") is False
