# tests/e2e/test_gym_floor_flow.py
# End-to-end "gym floor" smoke flow: a trainer's session from the dashboard through language/theme
# switching, calendar sync, launching the clipboard, logging a feedback entry with a typed note, and
# resolving a pending plan adjustment. Broad by design — it exercises the seams between features
# rather than one feature in isolation, which is what the more focused suites elsewhere in
# tests/e2e/ cover.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.
#
# Migrated from the legacy tests/test_browser.py — the other three tests that used to
# live there (sessions day navigation, timeline scroll, continuous vertical layout) were stale
# duplicates of the maintained versions in test_sessions_dashboard.py and were dropped rather than
# moved.
#
# test_clipboard.py was deleted into this file for the same reason (2026-08-05): its whole flow —
# logo, language switch, the Slovenian sync label, sync success, switching back, the session cards,
# the card tap, the Jane/John participant tabs — was a strict prefix of STEPS 1-3 below. Its one
# assertion this file did not already make (a NAVIGATION item translating, rather than only the
# dialog entries) moved down to
# tests/medium/test_header_menu.py::test_menu_and_settings_translate_to_slovenian, where menu
# translation already lives. Two near-identical full-app flows cost ~9s per run to assert the same thing twice.


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
    # Language + theme live in Settings, behind the ☰ menu.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-settings").click()
    lang_switcher = page.locator("#lang-switcher")
    assert lang_switcher.is_visible()

    # Toggle language to Slovenian (SL), then close Settings — it is modal.
    lang_switcher.select_option("sl")
    page.locator("#dialog-settings .modal-close-btn").click()
    page.wait_for_selector("#dialog-settings", state="hidden")

    # The header cloud opens Sync & Backup, and it speaks the language just chosen.
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")
    assert "Izvozi varnostno kopijo" in page.locator("#dialog-backup").inner_text()
    page.locator("#dialog-backup .modal-close-btn").click()
    page.wait_for_selector("#dialog-backup", state="hidden")

    # Switch back to English (EN) — through Settings again.
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-settings").click()
    lang_switcher.select_option("en")
    page.locator("#dialog-settings .modal-close-btn").click()
    page.wait_for_selector("#dialog-settings", state="hidden")
    page.locator("#btn-app-menu").click()
    assert (
        page.locator("#menu-library").inner_text().strip() == "Exercises and routines"
    )
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
                '#active-exercise-scroll-deck .exercise-deck-card'
            );
            if (card) { card.scrollIntoView({ block: 'center' }); card.click(); }
        }"""
    )
    page.wait_for_timeout(400)

    # --- STEP 5: A FEEDBACK ENTRY WITH A TYPED NOTE ---
    # Log Feedback lives on the in-focus exercise card. There is no microphone: by ruling, the app
    # never records, and a mock recorder here once wrote a sentence nobody said into the record.
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback", state="visible")
    assert page.locator("#dialog-feedback .fa-microphone").count() == 0
    page.locator("#feedback-custom-note").fill("Left knee, third round")

    # Log/Submit the feedback
    page.locator("#dialog-feedback button[type='submit']").click()
    page.wait_for_selector("#dialog-feedback", state="hidden")

    # Leave the clipboard via the title-bar grab handle (replaces the old minimize chevron). The
    # overlay slides down over ~230ms (slideOverlayDownThenHome, gestureController.js) before
    # goHome() actually fires -- wait for it to fully close rather than racing the next interaction
    # against that transition under load.
    page.locator("#active-session-overlay .view-grabber").click()
    page.wait_for_selector("#active-session-overlay.hidden", state="attached")

    # Pending Plan Adjustments is its own view/route, reached from its status message in the
    # notification area — the ☰ menu has no row for it.
    page.evaluate(
        """async () => {
            const area = await import(
                new URL('modules/common/notificationArea.js', document.baseURI).href
            );
            area.toggleNotificationArea(true);
        }"""
    )
    page.locator(
        '[data-notification-id="synthetic-pending-sessions"] [data-nav-target]'
    ).first.click()
    page.wait_for_selector("#view-adjustments.active")

    # The new alert card is there, and no card draws a recording: there never was one.
    page.wait_for_selector(
        "#dashboard-adjustments-list .adjustment-card", state="visible"
    )
    assert page.locator("#dashboard-adjustments-list .fa-circle-play").count() == 0

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
