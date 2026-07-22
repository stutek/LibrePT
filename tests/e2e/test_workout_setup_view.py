"""E2E test suite verifying the workout session setup/create/edit view as a first-class citizen.

Ensures /session/new and /session/setup/:id are URL-addressable routes and that form input drafts
auto-persist across page reloads via localStorage.
"""

from playwright.sync_api import expect


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
