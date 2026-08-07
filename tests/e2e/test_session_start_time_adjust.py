# tests/e2e/test_session_start_time_adjust.py
# Starting a session off its scheduled slot — the gym runs late, the previous group overruns, a
# client turns up twenty minutes after the hour. Two things follow from that, and both are the
# SESSION LIFECYCLE rather than a render rule, which is why this is e2e and not tests/medium/:
# it needs the real launch → stage → Start path, the real state.sessions record behind the card,
# and the real bar/card/clipboard timers all reading one session.
#
#   1. The headline timer must never open NEGATIVE. It used to: every surface counted down to the
#      scheduled end, so tapping Start after that end had passed reported an overrun before a
#      single set was logged (the decision itself is pinned in
#      tests/unit_js/domain/sessionClock.test.mjs).
#   2. Past a ±15 minute tolerance the trainer is offered the schedule, prefilled with the session
#      shifted onto the clock — because it is the SCHEDULE that is wrong by then, not the session.
#   3. The session so started must SURVIVE a reload. Recovery aged a cached session out against its
#      scheduled end, which for a late start is already hours gone (isCachedSessionStale).
#
# "Group Strength & Conditioning" is seeded currentHour-1..currentHour+1 and NOT completed
# (src/data/sessions.js), so its start is always in the past and always outside the tolerance —
# never a coin flip on what time of day the suite happens to run. Note that `currentHour` there is
# CLAMPED to 03..17 so the demo sits in plausible gym hours, which means that from ~18:00 onward
# the seeded slot has already ended. That is not an edge case to design around, it is the ordinary
# "opening yesterday's session" path, and it is what exposed the fabricated end date this test now
# guards: the slot's LENGTH must survive its end having passed (TODO §24.4).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

HOUR_MIN = re.compile(r"^-?\d{2}h \d{2}m$")
DIALOG = "#dialog-session-start-time"
CARD_TITLE = "Group Strength & Conditioning"


def _launch_and_start(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=CARD_TITLE).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    page.wait_for_selector(f"{DIALOG}[open]")


def _overlay_timer(page):
    return page.inner_text("#overlay-session-duration").strip()


def test_starting_late_offers_the_schedule_and_never_a_negative_clock(
    page, local_server
):
    _launch_and_start(page, local_server)

    # The session is already RUNNING behind the dialog — nothing on the gym floor waits on a modal
    # the trainer did not ask for.
    assert page.locator("#overlay-session-timer").is_visible() is True
    opening = _overlay_timer(page)
    assert HOUR_MIN.match(opening), f"expected an 'HHh MMm' clock, got {opening!r}"
    assert not opening.startswith("-"), (
        f"a session cannot open on an overrun it has not had: {opening!r}"
    )

    # Prefilled with the whole slot shifted onto now, keeping the two hours it was planned for.
    start_value = page.input_value("#session-start-time-start")
    end_value = page.input_value("#session-start-time-end")
    start_hour, start_min = (int(part) for part in start_value.split(":"))
    end_hour, end_min = (int(part) for part in end_value.split(":"))
    assert (end_hour * 60 + end_min - start_hour * 60 - start_min) % (24 * 60) == 120

    page.click("#btn-session-start-time-apply")
    page.wait_for_selector(f"{DIALOG}[open]", state="detached")

    # The clipboard's own title line and its countdown move together — a trainer who corrects the
    # time in one place expects the rest to agree.
    assert start_value in page.inner_text("#session-title-text")
    # A freshly moved two-hour slot has essentially all of itself left to run (the start is floored
    # to the minute, so a few seconds of it are already spent).
    assert _overlay_timer(page) in ("02h 00m", "01h 59m")

    # Finishing asks twice over native confirms (early finish, and no sets logged).
    page.on("dialog", lambda d: d.accept())
    page.click("#btn-finish-session")
    page.wait_for_selector("#view-history.active")
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".session-card", has_text=CARD_TITLE).first
    assert f"{start_value} - {end_value}" in card.inner_text(), (
        "the adjusted slot must be persisted onto the session, not just shown live"
    )


def test_a_session_started_late_survives_a_reload(page, local_server):
    # Recovery used to age a cached session out against its SCHEDULED end, so a session begun well
    # after its slot — the very case the dialog above exists for — was already "abandoned" the
    # second Start was tapped. The next reload dropped it: the clipboard came back staged with the
    # Start button restored, and everything logged into the session went with it.
    #
    # The slot is pushed into the far past through the cache rather than by waiting or by seeding a
    # hand-built session, so the flow up to here stays the REAL one (launch, Start, dismiss) and the
    # test does not quietly depend on what time of day the suite runs (see the header note on the
    # seed's clamped currentHour).
    _launch_and_start(page, local_server)
    page.click(f"{DIALOG} .modal-close-btn")
    page.wait_for_selector(f"{DIALOG}[open]", state="detached")
    session_url = page.url

    page.evaluate(
        """() => {
            const key = 'librept_active_session';
            const cached = JSON.parse(localStorage.getItem(key));
            const sixHours = 6 * 60 * 60 * 1000;
            cached.sourceSession.startDate = new Date(cached.startTime - 2 * sixHours).toISOString();
            cached.sourceSession.endDate = new Date(cached.startTime - sixHours).toISOString();
            localStorage.setItem(key, JSON.stringify(cached));
        }"""
    )

    page.goto(session_url)
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    assert page.locator("#overlay-session-timer").is_visible() is True
    assert page.locator("#btn-start-session").is_visible() is False
    assert (
        page.evaluate(
            "() => JSON.parse(localStorage.getItem('librept_active_session')).started"
        )
        is True
    )


def _unscheduled_plan_count(page):
    # Read the live store rather than localStorage: state is persisted through IndexedDB as well,
    # and a mirror written on a different beat is not what the feed counts.
    return page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().history.filter((entry) => entry.isPlanning).length;
        }"""
    )


def test_deleting_an_off_schedule_session_keeps_its_plans_unscheduled(
    page, local_server
):
    # The third honest answer to "you started this five hours late": it never ran. The slot has to
    # actually leave the board — the ⋯ menu said "Delete Session" and left the card sitting there —
    # while the programming behind it survives as unscheduled plans, because that is what gets
    # re-run on another day.
    _launch_and_start(page, local_server)
    planned_before = _unscheduled_plan_count(page)

    page.on("dialog", lambda d: d.accept())
    page.click("#btn-session-start-time-delete")
    page.wait_for_selector("#view-clients.active")

    assert page.locator(".session-card", has_text=CARD_TITLE).count() == 0, (
        "a deleted session must leave the dashboard, not just close its clipboard"
    )
    planned_after = _unscheduled_plan_count(page)
    assert planned_after > planned_before, (
        "the participants' plans must survive the session as unscheduled ones"
    )

    # And it has to be a WRITE, not just a re-render: a delete the next reload undoes is worse than
    # no delete, because the trainer has already stopped expecting the session.
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    assert page.locator(".session-card", has_text=CARD_TITLE).count() == 0
    assert _unscheduled_plan_count(page) == planned_after


def test_keeping_the_schedule_leaves_the_slot_and_counts_up(page, local_server):
    _launch_and_start(page, local_server)
    scheduled_title = page.inner_text("#session-title-text")

    page.click("#btn-session-start-time-keep")
    page.wait_for_selector(f"{DIALOG}[open]", state="detached")

    assert page.inner_text("#session-title-text") == scheduled_title
    # Still inside the scheduled window here (it ends currentHour+1), so a real countdown is what
    # the trainer keeps — declining the offer changes nothing about the session.
    assert not _overlay_timer(page).startswith("-")
