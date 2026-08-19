# tests/medium/test_destructive_button_affordance.py
# A destructive action set apart from the row must still LOOK like something you can press.
#
# Reported 2026-08-18: the "Didn't happen" control on the session-adjustment dialog does not read as
# a button. It was styled `danger-link-btn` — no background, transparent border — which was a
# deliberate choice for the right reason (it must not compete for a thumb aiming at Keep beside it)
# taken one step too far: what it produced is a caption in red text, and a trainer who does not
# recognise it as a control never reaches the third answer the dialog is offering them.
#
# The treatment is asserted here rather than described in a comment because it IS the contract: the
# whole complaint is about what the thing looks like, and "recessive but visibly a button" is not
# something a semantic assertion can express. Kept to the two properties that carry it — a visible
# edge, and no filled surface — so the palette stays free to change.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

STUB = """
import { TRANSLATIONS } from './i18n/index.js';

const stage = document.createElement('div');
stage.className = 'modal-actions';
stage.innerHTML = `
  <button type="button" class="btn danger-link-btn" id="the-quiet-one">Didn't happen</button>
  <button type="button" class="btn secondary-btn" id="the-loud-one">Keep</button>
`;
document.body.appendChild(stage);
"""

COMPUTED = """(id) => {
  const style = getComputedStyle(document.getElementById(id));
  const alphaOf = (color) => {
    const parts = color.match(/[\\d.]+/g) || [];
    return parts.length === 4 ? Number(parts[3]) : 1;
  };
  return {
    borderWidth: Number.parseFloat(style.borderTopWidth),
    borderAlpha: alphaOf(style.borderTopColor),
    backgroundAlpha: alphaOf(style.backgroundColor),
    paddingY: Number.parseFloat(style.paddingTop),
  };
}"""


def test_the_quiet_destructive_action_still_has_a_visible_edge(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#the-quiet-one")

    quiet = page.evaluate(COMPUTED, "the-quiet-one")

    assert quiet["borderWidth"] >= 1, "no border at all reads as text, not as a control"
    assert quiet["borderAlpha"] > 0.2, (
        f"a transparent border is the same as no border ({quiet['borderAlpha']})"
    )


def test_it_stays_quieter_than_the_button_beside_it(page, local_server):
    """The reason it was understyled in the first place is real and must survive the fix: a
    destructive action sharing a row with an ordinary one must not compete for a thumb aiming at
    its neighbour."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#the-quiet-one")

    quiet = page.evaluate(COMPUTED, "the-quiet-one")
    loud = page.evaluate(COMPUTED, "the-loud-one")

    assert quiet["backgroundAlpha"] < loud["backgroundAlpha"], (
        "an outline is the point — a filled destructive button competes with Keep"
    )


def test_it_is_a_real_touch_target_not_a_hover_sized_link(page, local_server):
    """This app is used on a phone, with a sweaty thumb."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#the-quiet-one")

    box = page.locator("#the-quiet-one").bounding_box()
    assert box["height"] >= 36, f"only {box['height']}px tall"
