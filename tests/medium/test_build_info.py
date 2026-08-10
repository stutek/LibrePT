# tests/medium/test_build_info.py
# "Which build am I on" has to be answerable ON A PHONE. The long build identity used to live only
# in the header stamp's `title` tooltip, which a touch device cannot reach at all. The stamp is a
# button opening a dialog that shows commit and DATA SCHEMA (two different axes, TODO §16). The
# pure copyable-text-block model (buildInfoText()) is covered by
# tests/unit_js/modules/common/buildInfoDialog.test.mjs; this file covers the DOM: the touch
# target and the dialog itself. Mounted via appBoot.bootBuildInfoDialog() (see
# tests/medium/_harness.py) — the real router isn't booted, so the stub's fake `navigateToPath`
# does what the real "build" route does: render the dialog's rows and open it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.conftest import current_schema_version
from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

STUB = """
import { bootBuildInfoDialog } from './appBoot.js';
import { renderHeaderShell } from './modules/common/applicationHeader.js';
import { renderBuildInfo } from './modules/common/buildInfoDialog.js';
import { renderBuildStamp } from './controllers/appLifecycleController.js';
import { TRANSLATIONS } from './i18n/index.js';

const t = (key) => TRANSLATIONS.en[key] || key;

renderHeaderShell();
// Only the stamp's own text render, not the rest of bootAppLifecycle (SW registration, viewport
// resize, Drive-sync polling) — this test only needs #app-version to carry real text/height.
renderBuildStamp();
bootBuildInfoDialog({
  t,
  navigateToPath: () => {
    renderBuildInfo();
    document.getElementById('dialog-build-info').showModal();
  },
  urlFor: () => '#',
});
"""


def test_the_header_stamp_is_a_real_touch_target(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-version")

    stamp = page.locator("#app-version")
    assert stamp.is_visible(), "the stamp is shown on every viewport, phones included"
    assert stamp.evaluate("el => el.tagName") == "BUTTON", (
        "it must be a button, not a span, to be operable by touch and assistive tech"
    )
    # 9px of text is nothing to aim at with a gym-floor thumb; padding buys a usable target.
    height = stamp.evaluate("el => el.getBoundingClientRect().height")
    assert height >= 20, f"touch target is only {height}px tall"


def test_tapping_the_stamp_shows_commit_and_data_schema(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-version")

    page.click("#app-version")
    page.wait_for_selector("#dialog-build-info[open]")

    labels = page.locator("#build-info-rows dt").all_inner_texts()
    values = page.locator("#build-info-rows dd").all_inner_texts()
    facts = dict(zip(labels, values))

    assert facts["Commit"], "a bug report has to be pinnable to a build"
    # The data schema sits beside the commit on purpose: after a cached build updates, it is the
    # answer to "why are records missing", and the commit alone cannot tell you.
    # Read out of migrationSteps.js rather than hardcoded: a migration bumps this, and a test that
    # has to be edited alongside every migration is a test that will be edited without being read.
    assert facts["Data schema"] == str(current_schema_version())
    assert "Built" in facts
    assert "Version" not in facts, "no release tags any more — nothing to show here"


def test_the_dialog_closes(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-version")

    page.click("#app-version")
    page.wait_for_selector("#dialog-build-info[open]")
    page.click("#dialog-build-info .modal-close-btn")
    page.wait_for_timeout(200)

    assert page.locator("#dialog-build-info[open]").count() == 0
