# tests/medium/test_clipboard_complete_action.py
# TODO §8.4 — "Complete Workout Session" is a LIVE-session action: it logs the session to history.
# Whether it is offered is a pure function of two things the clipboard already knows,
# `canStartSession = !clipboardEditMode && currentPlanMode() !== "planning"` and `started`
# (activeSessionController.syncStartCompleteVisibility), so all three rules mount as one component:
#   - a started live session offers it;
#   - editing the plan withdraws it, and Done brings it back (Done is the only exit while editing);
#   - a planning-mode programme never offers it, because there is no execution to complete.
# The WHOLE footer hides rather than just the button, so the clipboard is never left with an empty
# action bar.
#
# Migrated from tests/e2e/test_edit_mode_hides_complete.py. What stayed there is the planning
# programme's CREATION flow — client directory → client detail → workout setup → submit — which
# crosses four views and is integration, not a render rule. The rule that flow ends up asserting is
# covered here instead, against a planning session built directly, so a regression in the rule fails
# in this tier rather than only at the end of a four-view journey.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

FOOTER = "#active-session-overlay .session-actions-footer"


def _mount(page, local_server, **session_overrides):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(
                exercises=[exercise_item("exA", "Barbell Row")], **session_overrides
            )
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _footer_visible(page):
    return page.evaluate(
        """(sel) => {
            const el = document.querySelector(sel);
            return !!el && !el.classList.contains('hidden');
        }""",
        FOOTER,
    )


def test_started_live_session_offers_complete(page, local_server):
    _mount(page, local_server)

    assert _footer_visible(page) is True
    assert page.locator("#btn-finish-session").is_visible() is True


def test_editing_the_plan_withdraws_complete_until_done(page, local_server):
    _mount(page, local_server)

    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")

    assert _footer_visible(page) is False, (
        "editing a plan must not offer finish-and-log-history"
    )
    assert page.locator("#btn-finish-session").is_visible() is False
    # Done is the only exit offered while editing.
    assert page.locator("#btn-done-edit").is_visible() is True

    page.click("#btn-done-edit")
    page.wait_for_selector(".clipboard-editor", state="detached")

    assert _footer_visible(page) is True, "exiting edit mode restores the footer"
    assert page.locator("#btn-finish-session").is_visible() is True


def test_planning_programme_never_offers_complete(page, local_server):
    """A planning-mode programme has no execution to complete — not even after leaving edit mode.
    `sourceSession.isPlanning` is what currentPlanMode() reads, and a planning draft carries no real
    dates (docs/DATA_MODEL.md §7), so it is built here exactly as the workout-setup flow builds it
    rather than as a live session with a flag flipped."""
    _mount(page, local_server, sourceSession={"isPlanning": True, "titles": ["Draft"]})

    assert _footer_visible(page) is False, (
        "a planning programme must not be completable"
    )

    # Leaving edit mode does not turn it into a live session either. The workout-setup flow drops
    # the trainer straight INTO the editor on create, which a directly-built session does not
    # reproduce — so enter it explicitly first, or the Done below would assert nothing.
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    assert _footer_visible(page) is False

    page.click("#btn-done-edit")
    page.wait_for_selector(".clipboard-editor", state="detached")
    assert _footer_visible(page) is False
