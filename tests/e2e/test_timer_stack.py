# tests/e2e/test_timer_stack.py
# The clipboard timer stack: starting a timer from a card adds one labelled countdown (client name +
# Rest/Exercise) to #clipboard-timer-stack; there is at most one per client; it counts into negative
# overtime; it survives a reload; a start on a still-running timer does not reset it while a start
# on an overtime timer does; ✕ is the only way a card leaves; and a countdown sounds once as it
# crosses zero. Fixtures (page, local_server) come from tests/conftest.py.

from datetime import timedelta

from tests.conftest import FROZEN_NOW


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)
    # The deck starts fully collapsed on open (deckAllCollapsed), and the ⏱ on a rest row
    # (.circuit-break-play) is only ADDED to the focused circuit card, so bring one into focus first.
    # force=True: collapsed cards use margin-bottom:-24px overlap — the first non-past card may
    # sit behind a stacked card that physically intercepts the pointer; force bypasses it.
    page.locator(".exercise-deck-card:not(.past-session)").first.click(force=True)
    page.wait_for_timeout(300)


def _start_a_timer(page):
    # A real countdown, not the exercise (⏱) button: no exercise in the seed data sets
    # workDuration, so that button always starts a count-up stopwatch -- a rest
    # break's data-rest is the only place a genuine countdown (with an endTime to rewind) exists.
    page.locator("#active-exercise-scroll-deck .circuit-break-play").first.click()
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
    page.locator("#active-exercise-scroll-deck .circuit-break-play").first.click()
    page.wait_for_timeout(150)
    assert page.locator("#clipboard-timer-stack .timer-card").count() == 1


def test_timer_survives_reload_and_goes_overtime(page, local_server):
    _open_session(page, local_server)
    _start_a_timer(page)

    # Force the running timer into overtime by rewinding its stored end time, then reload: the session
    # (and its timers) rehydrate from cache. Also push the cached session's own sourceSession.endDate
    # safely into the future first -- recoverActiveSession() discards (and freshly relaunches,
    # wiping every timer) any cached session more than 2h past its scheduled end, and this seed
    # session's end time is clamped to at most 18:00 (src/data/sessions.js), so this test would
    # otherwise start failing every evening once real wall-clock time passes ~20:00, regardless of
    # the timer logic under test.
    page.evaluate(
        """() => {
            const list = JSON.parse(localStorage.getItem('librept_active_timers'));
            list.forEach(t => { t.endTime = Date.now() - 5000; });
            localStorage.setItem('librept_active_timers', JSON.stringify(list));

            const cached = JSON.parse(localStorage.getItem('librept_active_session'));
            if (cached?.sourceSession) {
                cached.sourceSession.endDate = new Date(Date.now() + 3600000).toISOString();
                localStorage.setItem('librept_active_session', JSON.stringify(cached));
            }
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
    page.locator("#active-exercise-scroll-deck .circuit-break-play").first.click()
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


def test_the_close_button_dismisses_the_timer(page, local_server):
    """Timers are dismiss-only: ✕ is the one way a card leaves the stack, and it stays gone after a
    reload rather than coming back from the stored list."""
    _open_session(page, local_server)
    _start_a_timer(page)

    page.locator("#clipboard-timer-stack .timer-card .timer-close").click()
    assert page.locator("#clipboard-timer-stack .timer-card").count() == 0

    page.reload()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)
    assert page.locator("#clipboard-timer-stack .timer-card").count() == 0


# Counts the tones the app plays: each call to createOscillator is one tone. Installed before the
# app's own scripts run, so the app's `new AudioContext()` gets the counting one.
COUNT_TONES = """() => {
  window.__tones = 0;
  const Real = window.AudioContext || window.webkitAudioContext;
  if (!Real) return;
  window.AudioContext = class extends Real {
    createOscillator() { window.__tones += 1; return super.createOscillator(); }
  };
}"""


def test_a_rest_timer_sounds_once_when_it_crosses_zero(page, local_server):
    """The trainer is watching someone else when a rest period ends, so the phone has to say it.
    It says it once: a card that keeps sounding every second in overtime, or again after a reload,
    is a phone the trainer mutes."""
    page.add_init_script(f"({COUNT_TONES})()")
    _open_session(page, local_server)
    _start_a_timer(page)
    assert page.evaluate("window.__tones") == 0

    # The wall clock is frozen for every browser test; moving it past the rest period is the
    # crossing. The timer ticks once a second in real time, so give it two ticks.
    page.clock.set_fixed_time(FROZEN_NOW + timedelta(minutes=10))
    page.wait_for_timeout(2200)
    tones = page.evaluate("window.__tones")
    assert tones > 0, "the rest period ended in silence"

    page.wait_for_timeout(2200)
    assert page.evaluate("window.__tones") == tones, "it sounds again in overtime"

    page.reload()
    page.wait_for_selector("#clipboard-timer-stack .timer-card")
    page.wait_for_timeout(2200)
    assert page.evaluate("window.__tones") == 0, "a reload replays the alert"
