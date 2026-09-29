# tests/e2e/test_session_invite_dialog.py
# Assigning clients to a session directly from the PT's setup form (not only via
# client self-subscription) offers a "Send calendar invites" dialog for newly-assigned
# participants, and re-saving the same assignment must not re-prompt.

from playwright.sync_api import expect


# The two seeded clients these tests assign, as the trainer sees them: the search field is driven by
# the NAME, and the row that appears is identified by the client's id.
JANE = ("c1a9f0e2", "Jane Doe")
JOHN = ("c2b8e1d3", "John Smith")


def _create_session_with_participants(
    page, local_server, participants, session_name, query=""
):
    page.goto(f"{local_server}session/new{query}")
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

    page.click("#btn-setup-open")


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


def test_two_clients_with_one_name_are_told_apart_by_their_alias(page, local_server):
    # Two rows reading "Jane Doe" leave the trainer guessing which one an invite goes to; the alias
    # exists for exactly this, so each row carries it.
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(
        """async () => {
          const store = await import(new URL('data/stateStore.js', document.baseURI).href);
          const clients = store.getState().clients;
          Object.assign(clients.find((c) => c.id === 'c1a9f0e2'), { alias: 'mornings' });
          Object.assign(clients.find((c) => c.id === 'c2b8e1d3'), { name: 'Jane Doe', alias: 'evenings' });
          store.saveToLocalStorage();
          const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
          await queue.flushWrites();
        }"""
    )
    _create_session_with_participants(
        page, local_server, [JANE, ("c2b8e1d3", "Jane Doe")], "Namesakes"
    )

    dialog = page.locator("#dialog-session-invite")
    expect(dialog).to_be_visible()
    names = dialog.locator(".session-invite-name").all_text_contents()
    assert sorted(names) == ["Jane Doe (evenings)", "Jane Doe (mornings)"]


def test_the_invite_dialog_is_in_the_chosen_language_to_its_last_button(
    page, local_server
):
    """The dialog is built after the boot's translation pass; its Done button kept "Done"."""
    _create_session_with_participants(
        page, local_server, [JANE], "Jutranja vadba", query="?lang=sl"
    )

    dialog = page.locator("#dialog-session-invite")
    expect(dialog).to_be_visible()
    expect(dialog.locator(".modal-cancel")).to_have_text("Končano")


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

    page.click("#btn-setup-open")
    page.wait_for_timeout(300)
    expect(dialog).not_to_be_visible()
