# tests/e2e/test_timer_stack.py
# The clipboard timer stack: starting a timer from a card adds one labelled countdown (client name +
# Rest/Exercise) to #clipboard-timer-stack; there is at most one per client; it counts into negative
# overtime; it survives a reload; and a start on a still-running timer does not reset it while a start
# on an overtime timer does. Fixtures (page, local_server) come from tests/conftest.py.


def _open_session(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(700)
    page.locator(
        ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _start_a_timer(page):
    page.locator("#active-exercise-scroll-deck .deck-card-timer").first.click()
    page.wait_for_selector("#clipboard-timer-stack .timer-card")
    page.wait_for_timeout(150)


def test_timer_is_labelled_and_one_per_client(page, local_server):
    _open_session(page, local_server)
    _start_a_timer(page)

    cards = page.locator("#clipboard-timer-stack .timer-card")
    assert cards.count() == 1
    # Labelled with the client's name and a running m:ss countdown.
    name = page.text_content("#clipboard-timer-stack .timer-card-label strong").strip()
    assert name, "timer should show the client name"
    import re

    time_txt = page.text_content("#clipboard-timer-stack .timer-card-time").strip()
    assert re.match(r"^\d+:\d\d$", time_txt), f"unexpected time format: {time_txt}"

    # Starting again for the same client does not add a second timer (one per client).
    page.locator("#active-exercise-scroll-deck .deck-card-timer").first.click()
    page.wait_for_timeout(150)
    assert page.locator("#clipboard-timer-stack .timer-card").count() == 1


def test_timer_survives_reload_and_goes_overtime(page, local_server):
    _open_session(page, local_server)
    _start_a_timer(page)

    # Force the running timer into overtime by rewinding its stored end time, then reload: the session
    # (and its timers) rehydrate from cache.
    page.evaluate(
        """() => {
            const list = JSON.parse(localStorage.getItem('librept_active_timers'));
            list.forEach(t => { t.endTime = Date.now() - 5000; });
            localStorage.setItem('librept_active_timers', JSON.stringify(list));
        }"""
    )
    page.reload()
    page.wait_for_selector("#clipboard-timer-stack .timer-card")
    page.wait_for_timeout(200)

    card = page.locator("#clipboard-timer-stack .timer-card").first
    assert "overtime" in (card.get_attribute("class") or ""), (
        "past zero should be overtime"
    )
    assert (
        page.text_content("#clipboard-timer-stack .timer-card-time")
        .strip()
        .startswith("-")
    )

    # A start on an OVERTIME timer resets it (back to a positive countdown, no longer overtime).
    page.locator("#active-exercise-scroll-deck .deck-card-timer").first.click()
    page.wait_for_timeout(150)
    card = page.locator("#clipboard-timer-stack .timer-card").first
    assert "overtime" not in (card.get_attribute("class") or ""), (
        "reset should clear overtime"
    )
    assert (
        not page.text_content("#clipboard-timer-stack .timer-card-time")
        .strip()
        .startswith("-")
    )
