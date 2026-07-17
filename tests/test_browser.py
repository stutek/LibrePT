# Browser E2E tests. The `local_server` fixture lives in tests/conftest.py and serves the app
# under the /LibrePT/ sub-path (mirrors GitHub Pages); `page`/`browser` come from pytest-playwright.
import datetime


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


def _touch_swipe(cdp, page, x, y, dx, steps=12):
    """
    Drag a single finger horizontally across the deck.

    Note: CDP's Input.synthesizeScrollGesture does NOT scroll overflow containers in this
    headless setup (verified against a plain scroll-snap control deck), so the gesture is
    built from raw touch events instead.
    """
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    for i in range(1, steps + 1):
        cdp.send("Input.dispatchTouchEvent", {
            "type": "touchMove",
            "touchPoints": [{"x": x + dx * i / steps, "y": y}],
        })
        page.wait_for_timeout(16)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def test_touch_swipe_between_days(browser, local_server):
    """A real one-finger swipe on the deck must advance exactly one day and retitle the bar."""
    context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = context.new_page()
    page.goto(local_server)
    page.wait_for_selector("#today-sessions-column")
    page.wait_for_timeout(1200)

    cdp = context.new_cdp_session(page)
    weekday = page.locator("#calendar-title-weekday-short")
    tag = page.locator("#calendar-title-tag")
    today = datetime.date.today()

    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()
    assert tag.is_visible()

    # Swiping left walks forward to tomorrow
    _touch_swipe(cdp, page, 195, 300, -300)
    page.wait_for_timeout(1200)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%a").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow.strftime("%Y-%m-%d")
    assert tag.is_hidden()

    # Swiping right walks back to today, tag and all
    _touch_swipe(cdp, page, 195, 300, 300)
    page.wait_for_timeout(1200)
    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()
    assert tag.is_visible()

    context.close()


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
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(DANES)"

    # The sync control now lives in the header cloud (Sync & Backup) modal; open it and
    # confirm its label translated too.
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")
    assert page.locator("#btn-sync-data-text").inner_text().strip().upper() == "SINHRONIZIRAJ PODATKE"

    # --- STEP 2: SESSION DATA SYNC (merged into the header cloud button) ---
    page.locator("#btn-sync-data").click()
    page.wait_for_selector("#sync-status.text-emerald")  # sync reports success in the modal
    page.locator("#dialog-backup .modal-close-btn").click()
    page.wait_for_selector("#dialog-backup", state="hidden")

    # Switch back to English (EN)
    lang_switcher.select_option("en")
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(TODAY)"

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

    # --- STEP 5: PRIVACY-FIRST VOICE NOTE RECORDING ---
    # Log Feedback now lives on the in-focus exercise card
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
