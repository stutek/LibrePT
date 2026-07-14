import os
import time
import socket
import subprocess
import pytest
from playwright.sync_api import sync_playwright

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

@pytest.fixture(scope="session", autouse=True)
def local_server():
    """Starts a local Python HTTP server on port 8081 if not already running."""
    proc = None
    if not is_port_open(8081):
        # Run python server from workspace root
        proc = subprocess.Popen(["python3", "-m", "http.server", "8081"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Give it a second to bind
        time.sleep(1.5)
    yield "http://localhost:8081"
    if proc:
        proc.terminate()
        proc.wait()

def test_interactive_dashboard_flow(page, local_server):
    """
    LibrePT Gym-Floor E2E Test.
    
    You can observe the browser state and step through this test using:
    
    1. standard breakpoints in VSCode/PyCharm
    2. Playwright Inspector by uncommenting `page.pause()`
    """
    
    # Go to the local dashboard
    page.goto(local_server)
    
    # 1. Assert logo title is present
    assert page.locator(".logo-area h1").text_content() == "LibrePT"
    
    # --- STEP 1: INTERACTIVE LANGUAGE TRANSLATION ---
    # Locate language switcher select dropdown
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()
    
    # Toggle language to Slovenian (SL)
    lang_switcher.select_option("sl")
    
    # Verify dashboard header translates dynamically
    assert page.locator("#calendar-title").inner_text().strip().upper() == "DANAŠNJE IN JUTRIŠNJE SEJE"
    assert page.locator("#btn-sync-calendar-text").inner_text().strip().upper() == "SINHRONIZIRAJ SEJE"
    
    # Switch back to English (EN)
    lang_switcher.select_option("en")
    assert page.locator("#calendar-title").inner_text().strip().upper() == "TODAY'S & TOMORROW'S SESSIONS"
    
    # --- STEP 2: GOOGLE CALENDAR SYNC ---
    # Tap the Sync Calendar button
    sync_btn = page.locator("#btn-sync-calendar")
    sync_btn.click()
    
    # Handle the window alert dialog
    # Playwright automatically handles dialogs, but we can hook into it
    # to verify the message "Calendar synchronized successfully!"
    
    # Verify bookings list cards appear on the dashboard
    page.wait_for_selector(".booking-card")
    booking_titles = page.locator(".booking-card strong").all_inner_texts()
    assert "Group Strength & Conditioning" in booking_titles
    
    # --- STEP 3: WORKOUT SETUP CLIPBOARD LAUNCH ---
    # Click the entire Group Strength card to verify clickability
    group_strength_card = page.locator(".booking-card", has_text="Group Strength & Conditioning")
    group_strength_card.click()
    
    # Verify the setup modal opens
    modal = page.locator("#dialog-workout-setup")
    assert modal.is_visible()
    
    # Verify Jane Doe and John Smith checkbox elements are checked by default
    jane_checkbox = page.locator("#setup-cb-client-jane-doe")
    john_checkbox = page.locator("#setup-cb-client-john-smith")
    assert jane_checkbox.is_checked()
    assert john_checkbox.is_checked()
    
    # Check that they have their respective routines assigned
    # Jane -> Upper Body A (routine-upper-a)
    jane_row = page.locator(".participant-setup-row", has_text="Jane Doe")
    jane_select = jane_row.locator("select")
    assert jane_select.input_value() == "routine-upper-a"

    # --- STEP 4: INTERACTIVE INSPECTION ---
    # Uncomment the line below to launch the Playwright Inspector debugger and pause execution
    # page.pause()
    
    # Click 'Launch Clipboard' inside the modal to start tracking
    start_session_btn = page.locator("#dialog-workout-setup button[type='submit']")
    start_session_btn.click()
    
    # Confirm clipboard overlay is active and displaying client tabs
    page.wait_for_selector("#active-session-client-tabs")
    tabs = page.locator("#active-session-client-tabs button").all_inner_texts()
    assert any("Jane" in t for t in tabs)
    assert any("John" in t for t in tabs)

    # Verify Foreshadowing ("Up Next") card is visible
    assert page.locator("#foreshadowing-card").is_visible()
    assert "UP NEXT" in page.locator("#label-up-next").inner_text().strip().upper()

    # --- STEP 5: PRIVACY-FIRST VOICE NOTE RECORDING ---
    # Open the Log Feedback modal
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback", state="visible")

    # Tap record mic button to start recording
    page.locator("#btn-voice-record").click()
    page.wait_for_timeout(1000)

    # Tap record mic button again to stop and trigger mock on-device transcription
    page.locator("#btn-voice-record").click()
    page.wait_for_timeout(1500) # wait for transcription timeout to append note

    # Assert transcription text was generated and appended locally
    custom_note_val = page.locator("#feedback-custom-note").input_value()
    assert "Voice note" in custom_note_val or "Glasovna opomba" in custom_note_val

    # Log/Submit the feedback
    page.locator("#dialog-feedback button[type='submit']").click()
    page.wait_for_selector("#dialog-feedback", state="hidden")

    # Minimize active tracking overlay
    page.locator("#btn-collapse-session").click()

    # Verify the new adjustment alert card on the dashboard displays the play audio button
    page.wait_for_selector(".btn-play-adjustment-audio", state="visible")
    assert page.locator(".btn-play-adjustment-audio").is_visible()
