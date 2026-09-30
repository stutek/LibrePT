"""E2E test suite verifying the workout session setup/create/edit view as a first-class citizen.

Ensures /session/new and /session/setup/:id are URL-addressable routes and that form input drafts
auto-persist across page reloads via localStorage.
"""

from urllib.parse import urlparse

import pytest
from playwright.sync_api import expect


def test_a_name_nobody_has_can_be_added_as_a_client_from_the_form(page, local_server):
    """A search for a client who does not exist ended at "No client of that name", and the only way
    on was the ☰ menu, the client directory, and starting the session again. The form now offers to
    add that name, and the client added comes back onto the session."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#setup-participant-search")
    page.fill("#setup-participant-search", "Zala Novak")

    offer = page.locator("#setup-participant-matches .participant-add-new")
    expect(offer).to_have_text('Add "Zala Novak" as a new client')
    offer.click()

    expect(page.locator("#dialog-client")).to_be_visible()
    expect(page.locator("#client-name")).to_have_value("Zala Novak")
    page.locator("#dialog-client button[type='submit']").click()

    expect(page.locator("#dialog-client")).to_be_hidden()
    expect(
        page.locator("#setup-participants-assignment-list .participant-setup-row")
    ).to_contain_text("Zala Novak")


@pytest.mark.parametrize("width,height", [(390, 844), (320, 680)])
def test_save_and_open_are_on_the_screen_when_the_form_opens(
    page, local_server, width, height
):
    """The form opened with Save 116 pixels and Open in Clipboard 170 pixels below a phone screen,
    under the bar at the bottom: the two ways to finish were a scroll away. The action row stays on
    the screen, clear of the bar, while the form scrolls."""
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active #btn-setup-save")

    for button in ("#btn-setup-save", "#btn-setup-open"):
        reachable = page.evaluate(
            """(sel) => { const b = document.querySelector(sel); const r = b.getBoundingClientRect();
                         const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                         return r.bottom <= innerHeight && r.top >= 0 && !!hit && b.contains(hit); }""",
            button,
        )
        assert reachable, (
            f"{button} is not on the screen, or something covers it, at {width}x{height}"
        )


def test_a_message_with_one_answer_shows_one_button(page, local_server):
    """ "Choose at least one client." came with its OK and an empty second button beside it: the
    cancel button was hidden by an attribute that the button style overrode."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active #btn-setup-open")
    page.locator("#btn-setup-open").click()

    dialog = page.locator("dialog[open]:has(#app-question-text)")
    expect(dialog).to_be_visible()
    expect(dialog.locator("button:visible")).to_have_count(1)


def test_a_group_session_started_from_a_routine_survives_a_reload(page, local_server):
    """Started from a routine, the form kept the address /routines: a reload, which a phone does
    by itself, showed the routine list again and the name typed was gone, and Back went to the
    dashboard instead of the routines."""
    page.goto(f"{local_server}routines")
    page.locator("#routines-list .btn-launch-routine").first.click()
    page.wait_for_selector("#view-workout-setup.active")
    assert "/session/new" in page.url
    page.fill("#setup-session-name", "Skupina ponedeljek")
    page.wait_for_timeout(400)

    page.reload()
    page.wait_for_selector("#view-workout-setup.active")
    expect(page.locator("#setup-session-name")).to_have_value("Skupina ponedeljek")

    page.go_back()
    page.wait_for_selector("#routines-list")
    assert urlparse(page.url).path.rstrip("/").endswith("/routines")


def test_a_running_session_keeps_its_day_and_says_why(page, local_server):
    """A trainer opened the running session's form and picked Friday, thinking it moved the next
    appointment: the running session went to Friday without a question. While it runs, its date
    and times cannot be edited, and the form says why."""
    page.goto(local_server)
    page.locator('.session-card[data-session-id="s01f2e3d"]').click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    page.click("#dialog-session-start-time[open] .modal-close-btn")

    page.goto(f"{local_server}session/setup/s01f2e3d")
    page.wait_for_selector("#setup-session-date")

    for field in ("setup-session-date", "setup-start-time", "setup-end-time"):
        assert page.get_attribute(f"#{field}", "readonly") is not None, field
    expect(page.locator("#setup-slot-locked-note")).to_have_text(
        "This session has already started or finished, so its date and time cannot be changed."
    )


def test_workout_setup_view_route_loads(page, local_server):
    """Directly visiting /session/new loads the workout setup view."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")
    expect(page.locator("#workout-setup-view-title")).to_contain_text("Workout Session")
    expect(page.locator("#setup-session-name")).to_be_visible()


def test_workout_setup_draft_persists_across_reload(page, local_server):
    """Form draft inputs (session name, date, start time, location) persist across browser reload."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")

    # Fill out form fields
    page.fill("#setup-session-name", "Sunset Power Hour")
    page.fill("#setup-start-time", "17:30")
    page.fill("#setup-location", "City Park Outdoor Gym")

    # Verify input values before reload
    expect(page.locator("#setup-session-name")).to_have_value("Sunset Power Hour")

    # Reload the page on /session/new
    page.reload()
    page.wait_for_selector("#view-workout-setup.active")

    # Verify draft values were restored cleanly after reload
    expect(page.locator("#setup-session-name")).to_have_value("Sunset Power Hour")
    expect(page.locator("#setup-start-time")).to_have_value("17:30")
    expect(page.locator("#setup-location")).to_have_value("City Park Outdoor Gym")


def test_a_new_sessions_draft_never_fills_the_form_of_another_session(
    page, local_server
):
    """A new session left half-typed came back in the edit form of a different session, and saving
    that form wrote the draft over the other session: its name, day, time, routine and client, with
    no question asked. A draft belongs to the form it was typed in, and stays there."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")
    page.fill("#setup-session-name", "Draft C")
    page.fill("#setup-start-time", "07:00")
    page.reload()
    page.wait_for_selector("#view-workout-setup.active")

    # "Morning Conditioning", seeded tomorrow 09:00-10:00 (src/data/sessions.js).
    page.goto(f"{local_server}session/setup/s04f2e3d")
    page.wait_for_selector("#view-workout-setup.active")
    expect(page.locator("#setup-session-name")).to_have_value("Morning Conditioning")
    expect(page.locator("#setup-start-time")).to_have_value("09:00")

    # And the draft is still waiting in the form it was typed in.
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active")
    expect(page.locator("#setup-session-name")).to_have_value("Draft C")
    expect(page.locator("#setup-start-time")).to_have_value("07:00")


def test_the_name_and_place_fields_prompt_in_slovenian(page, local_server):
    """Both placeholders were English in every language."""
    page.goto(f"{local_server}session/new?lang=sl")
    page.wait_for_selector("#view-workout-setup.active")
    words = page.evaluate(
        """async () => {
            const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
            return [TRANSLATIONS.sl.session_name_placeholder, TRANSLATIONS.sl.location_placeholder];
        }"""
    )

    expect(page.locator("#setup-session-name")).to_have_attribute(
        "placeholder", words[0]
    )
    expect(page.locator("#setup-location")).to_have_attribute("placeholder", words[1])
