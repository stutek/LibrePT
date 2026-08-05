# tests/e2e/test_gym_floor_flow.py
# End-to-end "gym floor" smoke flow: a trainer's session from the dashboard through language/theme
# switching, calendar sync, launching the clipboard, logging a voice-note-backed feedback entry, and
# resolving a pending plan adjustment. Broad by design — it exercises the seams between features
# rather than one feature in isolation, which is what the more focused suites elsewhere in
# tests/e2e/ cover.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.
#
# Migrated from the legacy tests/test_browser.py (TODO §12.3) — the other three tests that used to
# live there (sessions day navigation, timeline scroll, continuous vertical layout) were stale
# duplicates of the maintained versions in test_sessions_dashboard.py and were dropped rather than
# moved.
#
# test_clipboard.py was deleted into this file for the same reason (2026-08-05): its whole flow —
# logo, language switch, the Slovenian sync label, sync success, switching back, the session cards,
# the card tap, the Jane/John participant tabs — was a strict prefix of STEPS 1-3 below. Its one
# assertion this file did not already make (a NAVIGATION item translating, `#menu-routines` ==
# "Rutine", rather than only the dialog entries) moved down to
# tests/medium/test_header_menu.py::test_menu_labels_translate_to_slovenian, where menu translation
# already lives. Two near-identical full-app flows cost ~9s per run to assert the same thing twice.


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
    # Language + theme now live inside the ☰ menu; open it to reach the switcher.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()

    # Toggle language to Slovenian (SL)
    lang_switcher.select_option("sl")

    # The sync control now lives in the header cloud (Sync & Backup) modal; open it and
    # confirm its label translated too.
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
    assert page.locator("#menu-routines").inner_text().strip() == "Routines"
    page.locator("#btn-app-menu").click()

    # Verify sessions list cards appear on the dashboard
    page.wait_for_selector(".session-card")
    session_titles = page.locator(".session-card strong").all_inner_texts()
    assert "Group Strength & Conditioning" in session_titles

    # --- STEP 3: WORKOUT SETUP CLIPBOARD LAUNCH ---
    # Click the entire Group Strength card to verify clickability
    group_strength_card = page.locator(
        ".session-card", has_text="Group Strength & Conditioning"
    )
    group_strength_card.click()

    # Verify the clipboard overlay directly opens and displaying client tabs
    page.wait_for_selector("#active-session-client-tabs")

    # Confirm clipboard overlay is active and displaying client tabs
    page.wait_for_selector("#active-session-client-tabs")
    tabs = page.locator("#active-session-client-tabs button").all_inner_texts()
    assert any("Jane" in t for t in tabs)
    assert any("John" in t for t in tabs)

    # The deck starts fully collapsed on open (deckAllCollapsed) — tap the first card into focus so
    # its Log Feedback action actually renders. Use JS evaluate rather than Playwright's locator:
    # the card lives inside the overlay's own scroll container, and Playwright's click can't scroll
    # an inner container's element into the page viewport even with force=True.
    page.evaluate(
        """() => {
            const card = document.querySelector(
                '#active-exercise-scroll-deck .exercise-deck-card:not(.past-session)'
            );
            if (card) { card.scrollIntoView({ block: 'center' }); card.click(); }
        }"""
    )
    page.wait_for_timeout(400)

    # --- STEP 5: PRIVACY-FIRST VOICE NOTE RECORDING ---
    # Log Feedback now lives on the in-focus exercise card
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback", state="visible")

    # Tap record mic button to start recording
    page.locator("#btn-voice-record").click()
    page.wait_for_timeout(1000)

    # Tap record mic button again to stop and trigger mock on-device transcription
    page.locator("#btn-voice-record").click()
    page.wait_for_timeout(1500)  # wait for transcription timeout to append note

    # Assert transcription text was generated and appended locally
    custom_note_val = page.locator("#feedback-custom-note").input_value()
    assert "Voice note" in custom_note_val or "Glasovna opomba" in custom_note_val

    # Log/Submit the feedback
    page.locator("#dialog-feedback button[type='submit']").click()
    page.wait_for_selector("#dialog-feedback", state="hidden")

    # Leave the clipboard via the title-bar grab handle (replaces the old minimize chevron). The
    # overlay slides down over ~230ms (slideOverlayDownThenHome, gestureController.js) before
    # goHome() actually fires -- wait for it to fully close rather than racing the next interaction
    # against that transition under load.
    page.locator("#active-session-overlay .view-grabber").click()
    page.wait_for_selector("#active-session-overlay.hidden", state="attached")

    # Pending Plan Adjustments is its own view/route now (TODO 4.8), not part of the dashboard.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-adjustments").click()
    page.wait_for_selector("#view-adjustments.active")

    # Verify the new adjustment alert card displays the play audio button
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
