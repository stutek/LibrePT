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
    # Language + theme now live inside the ☰ menu; open it to reach the switcher.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()

    # Toggle language to Slovenian (SL); the dashboard header must translate dynamically
    lang_switcher.select_option("sl")
    assert page.locator("#btn-sessions-today").inner_text().strip().upper() == "DANES"

    # The Sync control now lives in the header cloud (Sync & Backup) modal; open it and
    # confirm the label translated too.
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")
    assert (
        page.locator("#btn-sync-data-text").inner_text().strip().upper()
        == "SINHRONIZIRAJ PODATKE"
    )

    # --- STEP 2: SESSION DATA SYNC (merged into the header cloud button) ---
    page.locator("#btn-sync-data").click()
    page.wait_for_selector(
        "#sync-status.text-emerald"
    )  # sync reports success in the modal
    page.locator("#dialog-backup .modal-close-btn").click()
    page.wait_for_selector("#dialog-backup", state="hidden")

    # Switch back to English (EN) — reopen the ☰ menu to reach the switcher again.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    lang_switcher.select_option("en")
    assert page.locator("#btn-sessions-today").inner_text().strip().upper() == "TODAY"

    # Verify bookings list cards appear on the dashboard
    page.wait_for_selector(".booking-card")
    booking_titles = page.locator(".booking-card strong").all_inner_texts()
    assert "Group Strength & Conditioning" in booking_titles

    # --- STEP 3: WORKOUT CLIPBOARD LAUNCH ---
    # Click the entire Group Strength card to verify clickability
    group_strength_card = page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    )
    group_strength_card.click()

    # Confirm the clipboard overlay opens and shows the merged-session client tabs
    page.wait_for_selector("#active-session-client-tabs")
    tabs = page.locator("#active-session-client-tabs button").all_inner_texts()
    assert any("Jane" in t for t in tabs)
    assert any("John" in t for t in tabs)
