"""E2E test suite verifying the workout session setup/create/edit view as a first-class citizen.

Ensures /session/new and /session/setup/:id are URL-addressable routes and that form input drafts
auto-persist across page reloads via localStorage.
"""

from urllib.parse import urlparse

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
