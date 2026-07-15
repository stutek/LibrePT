import os
import time
import socket
import datetime
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

def test_sessions_day_navigation(page, local_server):
    """
    Verifies the sessions title bar reports the focused day (weekday + date + Today tag),
    that the title arrows step across the day deck, and that going home re-focuses today.
    """
    page.goto(local_server)

    weekday = page.locator("#calendar-title-weekday")
    tag = page.locator("#calendar-title-tag")
    today = datetime.date.today()

    # Dashboard opens focused on today: ISO date, weekday and the (Today) tag are all present
    page.wait_for_selector("#calendar-title-weekday")
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == today.strftime("%Y-%m-%d")
    assert tag.is_visible()

    # Left arrow steps back to yesterday and drops the (Today) tag
    page.locator("#btn-sessions-prev").click()
    page.wait_for_timeout(900)
    yesterday = today - datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == yesterday.strftime("%A").upper()
    assert tag.is_hidden()

    # Yesterday is the first column, so stepping further back is a dead end
    assert page.locator("#btn-sessions-prev").is_disabled()

    # Right arrow returns to today, then steps on to tomorrow
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    assert tag.is_visible()

    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert tag.is_hidden()

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert tag.is_visible()

    # A swipe of the deck itself (rather than the arrows) must retitle to the day it lands on
    page.evaluate("""() => {
      const grid = document.getElementById('sessions-categories-grid');
      const col = document.getElementById('tomorrow-sessions-column');
      grid.scrollTo({
        left: grid.scrollLeft + (col.getBoundingClientRect().left - grid.getBoundingClientRect().left),
        behavior: 'auto'
      });
    }""")
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow.strftime("%Y-%m-%d")
    assert tag.is_hidden()


def test_single_column_deck_at_every_viewport(page, local_server):
    """Exactly one day column may occupy the deck viewport, on phone and desktop alike."""
    visible_columns = """() => {
      const grid = document.getElementById('sessions-categories-grid');
      const gr = grid.getBoundingClientRect();
      return ['yesterday','today','tomorrow','upcoming'].filter(d => {
        const r = document.getElementById(d + '-sessions-column').getBoundingClientRect();
        return r.left < gr.right - 1 && r.right > gr.left + 1;
      });
    }"""

    for width, height in [(390, 844), (868, 843), (1280, 800)]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(local_server)
        page.wait_for_selector("#today-sessions-column")
        page.wait_for_timeout(700)
        assert page.evaluate(visible_columns) == ["today"], f"expected only today's column at {width}px"


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
    assert page.locator(".logo-area h1").first.text_content() == "LibrePT"
    
    # --- STEP 1: INTERACTIVE LANGUAGE TRANSLATION ---
    # Locate language switcher select dropdown
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()
    
    # Toggle language to Slovenian (SL)
    lang_switcher.select_option("sl")
    
    # Verify dashboard header translates dynamically
    assert page.locator("#btn-sync-calendar-text").inner_text().strip().upper() == "SINHRONIZIRAJ SEJE"
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(DANES)"

    # Switch back to English (EN)
    lang_switcher.select_option("en")
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(TODAY)"
    
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
    
    # Verify the clipboard overlay directly opens and displaying client tabs
    page.wait_for_selector("#active-session-client-tabs")
    
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

    # Click Resolve Alert button to trigger the adjustment wizard modal
    page.locator(".btn-resolve-alert").first.click()
    page.wait_for_selector("#dialog-apply-adjustment", state="visible")
    assert page.locator("#dialog-apply-adjustment").is_visible()

    # Modify parameters and submit
    page.locator("#adjust-action-type").select_option("modify")
    page.locator("#adjust-weight").fill("62.5")
    page.locator("#dialog-apply-adjustment button[type='submit']").click()

    # Verify wizard modal closes
    page.wait_for_selector("#dialog-apply-adjustment", state="hidden")
