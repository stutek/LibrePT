# tests/e2e/test_session_invite_dialog.py
# TODO §1.1: assigning clients to a session directly from the PT's setup form (not only via
# client self-subscription) offers a "Send calendar invites" dialog for newly-assigned
# participants, and re-saving the same assignment must not re-prompt.

from playwright.sync_api import expect


# The two seeded clients these tests assign, as the trainer sees them: the search field is driven by
# the NAME, and the row that appears is identified by the client's id.
JANE = ("c1a9f0e2", "Jane Doe")
JOHN = ("c2b8e1d3", "John Smith")


def _create_session_with_participants(page, local_server, participants, session_name):
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")
    page.fill("#setup-session-name", session_name)
    page.fill("#setup-session-date", "2026-09-01")
    page.fill("#setup-start-time", "09:00")
    page.fill("#setup-end-time", "10:00")
    page.fill("#setup-location", "Studio A")

    # The form opens with nobody on the session: each participant is searched for by name and
    # added, which is the flow a trainer with a full client base uses.
    for client_id, name in participants:
        page.fill("#setup-participant-search", name)
        page.click(
            f"#setup-participant-matches .participant-match[data-client-id='{client_id}']"
        )
        row = page.locator(
            f"#setup-participants-assignment-list .participant-setup-row[data-client-id='{client_id}']"
        )
        row.locator("select").select_option(index=1)

    page.click("#form-workout-setup button[type=submit]")


def test_new_session_with_participants_opens_invite_dialog(page, local_server):
    _create_session_with_participants(
        page, local_server, [JANE, JOHN], "Invite Test Session"
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
    _create_session_with_participants(page, local_server, [JANE], "Repeat Save Session")
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
    expect(
        page.locator(
            "#setup-participants-assignment-list .participant-setup-row[data-client-id='c1a9f0e2']"
        )
    ).to_be_visible()

    page.click("#form-workout-setup button[type=submit]")
    page.wait_for_timeout(300)
    expect(dialog).not_to_be_visible()
