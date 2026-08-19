# tests/e2e/test_session_invite_dialog.py
# TODO §1.1: assigning clients to a session directly from the PT's setup form (not only via
# client self-subscription) offers a "Send calendar invites" dialog for newly-assigned
# participants, and re-saving the same assignment must not re-prompt.

from playwright.sync_api import expect


def _create_session_with_participants(page, local_server, client_ids, session_name):
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")
    page.fill("#setup-session-name", session_name)
    page.fill("#setup-session-date", "2026-09-01")
    page.fill("#setup-start-time", "09:00")
    page.fill("#setup-end-time", "10:00")
    page.fill("#setup-location", "Studio A")

    # Start from a clean slate: uncheck every preselected client, then check exactly the ones
    # this test wants assigned.
    for cb in page.locator(
        "#setup-participants-assignment-list input[type=checkbox]"
    ).all():
        if cb.is_checked():
            cb.uncheck()
    for client_id in client_ids:
        page.check(f"#setup-cb-{client_id}")
        row = page.locator(f"#setup-cb-{client_id}").locator(
            "xpath=ancestor::div[contains(@class,'participant-setup-row')]"
        )
        select = row.locator("select")
        select.select_option(index=1)

    page.click("#form-workout-setup button[type=submit]")


def test_new_session_with_participants_opens_invite_dialog(page, local_server):
    _create_session_with_participants(
        page, local_server, ["c1a9f0e2", "c2b8e1d3"], "Invite Test Session"
    )

    dialog = page.locator("#dialog-session-invite")
    expect(dialog).to_be_visible()
    rows = dialog.locator(".session-invite-row")
    expect(rows).to_have_count(2)
    expect(dialog.locator(".session-invite-row", has_text="Jane Doe")).to_be_visible()
    expect(dialog.locator(".session-invite-row", has_text="John Smith")).to_be_visible()

    send_btn = dialog.locator(".session-invite-row", has_text="Jane Doe").locator(
        ".session-invite-send-btn"
    )
    # The download itself is the proof the button was live — an exact class string would break on
    # any restyle while proving nothing a trainer can see.
    with page.expect_download():
        send_btn.click()
    expect(send_btn).to_have_text("Invite sent")

    dialog.locator(".modal-cancel").click()
    expect(dialog).not_to_be_visible()


def test_resaving_unchanged_participants_does_not_reopen_invite_dialog(
    page, local_server
):
    _create_session_with_participants(
        page, local_server, ["c1a9f0e2"], "Repeat Save Session"
    )
    dialog = page.locator("#dialog-session-invite")
    expect(dialog).to_be_visible()
    dialog.locator(".modal-cancel").click()
    expect(dialog).not_to_be_visible()

    # Find the session id from the URL/state via the session card, then reopen its edit form and
    # save again with the exact same participant — no *new* assignment, so no dialog this time.
    page.goto(local_server)
    card = page.locator(".session-card", has_text="Repeat Save Session").first
    card.wait_for()
    card.locator(".btn-edit-session").click()
    page.wait_for_selector("#view-workout-setup.active")
    expect(page.locator("#setup-cb-c1a9f0e2")).to_be_checked()

    page.click("#form-workout-setup button[type=submit]")
    page.wait_for_timeout(300)
    expect(dialog).not_to_be_visible()
