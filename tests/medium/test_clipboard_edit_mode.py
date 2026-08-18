# tests/medium/test_clipboard_edit_mode.py
# Edit mode's CHROME: what flipping the live deck into the inline plan editor does to the session
# title bar, the live-session chrome, and the ⋯ menu's destructive action. All of it is one
# component reacting to one tap — no navigation, no persistence, no session lifecycle — so it mounts
# the clipboard directly rather than driving a dashboard card through a full app boot.
#
# Migrated from tests/e2e/test_edit_mode_titlebar.py, test_edit_mode_client_focus.py and
# test_edit_mode_delete_plan.py. What stayed in e2e is the edit-mode DEEP LINK (the URL surviving a
# reload), which needs a real router to write one.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    open_plan_editor,
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

# Jane Doe — the seeded client the fixture defaults to, and the one whose goals/notes the focus
# panel below asserts are populated.
CLIENT_ID = "c1a9f0e2"


def _mount_clipboard(page, local_server):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(
                exercises=[
                    exercise_item("exA", "Barbell Row"),
                    exercise_item("exB", "Overhead Press"),
                ]
            )
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _enter_edit_mode(page):
    open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")


def _visible(page, selector):
    return page.evaluate(
        """(sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const s = getComputedStyle(el);
            return s.display !== 'none' && s.visibility !== 'hidden';
        }""",
        selector,
    )


def test_edit_chrome_is_on_the_title_bar(page, local_server):
    _mount_clipboard(page, local_server)

    # Live deck: Done hidden, and the way into edit mode is offered. Since 2026-08-18 that lives in
    # the ⋯ menu rather than on the title bar, so "offered" means the menu shows it — the bar itself
    # deliberately has one icon fewer, to give the session title back its space. Asserted on the way
    # THROUGH rather than by opening the menu twice: choosing Edit closes it, so a second open would
    # be toggling a menu this test had left standing.
    assert page.locator("#btn-done-edit").is_visible() is False
    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    assert page.locator("#btn-edit-plan").is_visible() is True
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")

    state = page.evaluate(
        """() => ({
            doneVisible: !document.getElementById('btn-done-edit').classList.contains('hidden'),
            titleHasPen: !!document.querySelector('#session-title-text i.fa-pen-to-square'),
            editorHeaders: document.querySelectorAll('.clipboard-editor-head, .clipboard-editor-title').length,
            editTriggerHidden: document.getElementById('btn-edit-plan').classList.contains('hidden'),
        })"""
    )
    # ✎ icon + Done moved up to the title line; the "Edit plan" header/label is gone.
    assert state["doneVisible"] is True
    assert state["titleHasPen"] is True
    assert state["editorHeaders"] == 0
    assert state["editTriggerHidden"] is True


def test_titlebar_done_exits_to_live_deck(page, local_server):
    _mount_clipboard(page, local_server)
    _enter_edit_mode(page)

    page.click("#btn-done-edit")
    page.wait_for_selector(".clipboard-editor", state="detached")

    assert page.locator("#btn-done-edit").is_visible() is False
    # Offered again, in the menu it now lives in.
    assert (
        page.locator("#btn-edit-plan").evaluate("el => el.classList.contains('hidden')")
        is False
    )


def test_edit_mode_hides_chrome_and_shows_client_focus(page, local_server):
    """The live-session chrome (member tabs + running timer) is irrelevant while reshaping a plan,
    and the client's goals + injuries are exactly what the trainer needs instead — so the two swap."""
    _mount_clipboard(page, local_server)

    assert _visible(page, "#active-session-client-tabs")
    assert _visible(page, ".session-timer-block")
    assert not _visible(page, "#clipboard-client-focus")

    _enter_edit_mode(page)

    assert not _visible(page, "#active-session-client-tabs")
    assert not _visible(page, ".session-timer-block")
    assert _visible(page, "#clipboard-client-focus")
    assert page.text_content("#client-focus-goals").strip(), (
        "goals text should be populated"
    )
    assert page.text_content("#client-focus-notes").strip(), (
        "notes text should be populated"
    )

    # Escape exits edit mode -> chrome restored, focus panel hidden again.
    page.keyboard.press("Escape")
    page.wait_for_selector(".clipboard-editor", state="detached")
    assert _visible(page, "#active-session-client-tabs")
    assert _visible(page, ".session-timer-block")
    assert not _visible(page, "#clipboard-client-focus")


def test_menu_destructive_label_swaps_between_session_and_plan(page, local_server):
    _mount_clipboard(page, local_server)

    # Live deck: the destructive item cancels the whole session.
    label = page.text_content("#btn-delete-session").strip()
    assert "Session" in label, label

    _enter_edit_mode(page)

    # Edit mode: the same button now targets just the plan.
    label = page.text_content("#btn-delete-session").strip()
    assert "Plan" in label, label


def test_delete_plan_clears_exercises_but_keeps_the_session(page, local_server):
    _mount_clipboard(page, local_server)
    _enter_edit_mode(page)
    assert page.locator(".editor-row").count() > 0, "editor should start with exercises"

    page.on("dialog", lambda dialog: dialog.accept())
    page.click("#btn-session-menu")
    page.click("#btn-delete-session")
    page.wait_for_function(
        "() => document.querySelectorAll('.editor-row').length === 0"
    )

    # The plan is emptied but the session is still open, still in edit mode.
    assert page.locator("#active-session-overlay").is_visible()
    assert page.locator(".clipboard-editor").is_visible(), "should stay in the editor"
