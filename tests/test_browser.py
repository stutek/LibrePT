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
    assert page.locator("#calendar-title").inner_text().strip().upper() == "DANAŠNJE REZERVACIJE KOLEDARJA"
    assert page.locator("#btn-sync-calendar-text").inner_text().strip().upper() == "SINHRONIZIRAJ"
    
    # Switch back to English (EN)
    lang_switcher.select_option("en")
    assert page.locator("#calendar-title").inner_text().strip().upper() == "TODAY'S CALENDAR BOOKINGS"
    
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
    # Find the "Launch Clipboard" button inside the Group Strength card and click it
    group_strength_card = page.locator(".booking-card", has_text="Group Strength & Conditioning")
    launch_btn = group_strength_card.locator("button")
    launch_btn.click()
    
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
