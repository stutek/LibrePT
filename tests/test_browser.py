# Browser E2E tests. The `local_server` fixture lives in tests/conftest.py and serves the app
# under the /LibrePT/ sub-path (mirrors GitHub Pages); `page`/`browser` come from pytest-playwright.
import datetime


def test_sessions_day_navigation(page, local_server):
    """
    Verifies the sessions title bar reports the focused date (weekday + date),
    and that the title arrows step across the timeline's day-groups.
    """
    page.goto(local_server)

    weekday = page.locator("#calendar-title-weekday")
    today = datetime.date.today()

    # Dashboard opens focused on today: ISO date + weekday show today
    page.wait_for_selector("#calendar-title-weekday")
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == today.strftime(
        "%Y-%m-%d"
    )

    # Left arrow steps back to the previous day-group (the seed data's earliest is yesterday)
    page.locator("#btn-sessions-prev").click()
    page.wait_for_timeout(900)
    yesterday = today - datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == yesterday.strftime("%A").upper()

    # Yesterday is the earliest loaded day-group, so stepping further back is a dead end
    assert page.locator("#btn-sessions-prev").is_disabled()

    # Right arrow returns to today, then steps on to tomorrow
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)

    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()

    # The Today control resets the timeline directly, without stepping through the arrows
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    page.locator("#btn-sessions-today").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#btn-sessions-today").is_disabled(), (
        "the Today control disables itself once today is already focused"
    )

    # Scrolling the timeline itself (rather than the arrows) must retitle to the date it settles on
    tomorrow_iso = tomorrow.strftime("%Y-%m-%d")
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow_iso


def test_scrolling_the_timeline_updates_the_focused_day(page, local_server):
    """The old day-deck's custom swipe/fling-clamp logic is gone with the horizontal carousel —
    the continuous timeline is plain native browser scrolling plus an IntersectionObserver
    watching the sticky headers (sessionTimeline.js), so what actually needs proving is that
    scroll position drives the focused date, not any particular input method. Driving the
    scroll directly (rather than a synthetic touch/wheel gesture, which headless Chromium does
    not reliably turn into real scrolling for a plain overflow container) tests exactly that,
    deterministically."""
    page.goto(local_server)
    page.wait_for_selector(".sessions-day-group")
    # Boot re-renders the timeline more than once (recovering an active session, notifications,
    # etc.), and each render re-arms a brief "ignore scroll during a programmatic settle" guard
    # (sessionTimeline.js) so the title doesn't flicker mid-scrollIntoView. Give every boot-time
    # render's guard window a chance to expire before driving a scroll of our own.
    page.wait_for_timeout(1200)

    weekday = page.locator("#calendar-title-weekday-short")
    today = datetime.date.today()
    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()

    page.evaluate("() => { document.getElementById('main-content').scrollTop += 900; }")
    page.wait_for_timeout(1000)
    assert weekday.inner_text().strip().upper() != today.strftime("%a").upper(), (
        "scrolling the timeline must move the focused day-group off today"
    )


def test_continuous_vertical_timeline_at_every_viewport(page, local_server):
    """The timeline is one vertical, chronologically-ordered scroll of day-groups — not
    per-viewport paged columns — at every viewport width."""
    check = """() => {
      const groups = Array.from(document.querySelectorAll('.sessions-day-group[data-date]'));
      const dates = groups.map((g) => g.dataset.date);
      const sorted = [...dates].sort();
      const lefts = new Set(groups.map((g) => Math.round(g.getBoundingClientRect().left)));
      return {
        count: groups.length,
        inOrder: JSON.stringify(dates) === JSON.stringify(sorted),
        singleColumn: lefts.size <= 1,
      };
    }"""

    for width, height in [(390, 844), (868, 843), (1280, 800)]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(local_server)
        page.wait_for_selector(".sessions-day-group")
        page.wait_for_timeout(300)
        result = page.evaluate(check)
        assert result["count"] > 1, "the seed data spans multiple days"
        assert result["singleColumn"], (
            f"day-groups must stack in one column at {width}px"
        )
        assert result["inOrder"], "day-groups must render in chronological order"


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

    # Verify bookings list cards appear on the dashboard
    page.wait_for_selector(".booking-card")
    booking_titles = page.locator(".booking-card strong").all_inner_texts()
    assert "Group Strength & Conditioning" in booking_titles

    # --- STEP 3: WORKOUT SETUP CLIPBOARD LAUNCH ---
    # Click the entire Group Strength card to verify clickability
    group_strength_card = page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    )
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
