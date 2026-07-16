# tests/e2e/test_clipboard.py
# End-to-end flow for launching the gym-floor clipboard from the dashboard, including the
# language switch and the calendar-sync entry point that precede it.

def test_clipboard_launch_flow(page, local_server):
    """
    LibrePT gym-floor E2E: translate the UI, sync the calendar, then tap a session card and
    confirm the clipboard overlay opens with the expected participant tabs.

    Step through it with a debugger breakpoint or by uncommenting `page.pause()`.
    """
    page.goto(local_server)

    # 1. Assert logo title is present
    assert page.locator(".logo-area h1").first.text_content() == "LibrePT"

    # --- STEP 1: INTERACTIVE LANGUAGE TRANSLATION ---
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()

    # Toggle language to Slovenian (SL); the dashboard header must translate dynamically
    lang_switcher.select_option("sl")
    assert page.locator("#btn-sync-calendar-text").inner_text().strip().upper() == "SINHRONIZIRAJ PODATKE"
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(DANES)"

    # Switch back to English (EN)
    lang_switcher.select_option("en")
    assert page.locator("#calendar-title-tag").inner_text().strip().upper() == "(TODAY)"

    # --- STEP 2: GOOGLE CALENDAR SYNC ---
    page.locator("#btn-sync-calendar").click()

    # Verify bookings list cards appear on the dashboard
    page.wait_for_selector(".booking-card")
    booking_titles = page.locator(".booking-card strong").all_inner_texts()
    assert "Group Strength & Conditioning" in booking_titles

    # --- STEP 3: WORKOUT CLIPBOARD LAUNCH ---
    # Click the entire Group Strength card to verify clickability
    group_strength_card = page.locator(".booking-card", has_text="Group Strength & Conditioning")
    group_strength_card.click()

    # Confirm the clipboard overlay opens and shows the merged-session client tabs
    page.wait_for_selector("#active-session-client-tabs")
    tabs = page.locator("#active-session-client-tabs button").all_inner_texts()
    assert any("Jane" in t for t in tabs)
    assert any("John" in t for t in tabs)
