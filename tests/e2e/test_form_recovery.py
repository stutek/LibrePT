"""Unsaved work survives a real boot, including the form that held it (TODO §50.1).

These tests use real routes, persistence and field events. The draft helper alone cannot
prove a feature restores after its opener has populated defaults.
"""

import pytest
from playwright.sync_api import expect


def _open_module(page, module, method, argument=None):
    page.evaluate(
        "async ([module, method, argument]) => (await import(new URL(module, document.baseURI).href))[method](argument)",
        [module, method, argument],
    )


@pytest.mark.parametrize(
    "route,root,fields",
    [
        (
            "exercises/new",
            "#dialog-exercise",
            {
                "#exercise-name": "Draft movement",
                "#exercise-instructions": "Keep this cue",
            },
        ),
        (
            "routines/new",
            "#dialog-routine",
            {
                "#routine-name": "Draft routine",
                "#routine-desc": "Keep this description",
            },
        ),
    ],
)
def test_creation_form_survives_reload(page, local_server, route, root, fields):
    page.goto(local_server + route)
    for selector, value in fields.items():
        page.locator(selector).fill(value)
    page.reload()
    expect(page.locator(root)).to_be_visible()
    for selector, value in fields.items():
        expect(page.locator(selector)).to_have_value(value)


def test_rejected_client_save_keeps_notes_and_reopens_form(page, local_server):
    page.goto(local_server + "clients")
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("   ")
    page.locator("#client-notes").fill("Unfinished but important")
    page.locator('#form-client button[type="submit"]').click()
    expect(page.locator("#dialog-client")).to_be_visible()
    page.reload()
    expect(page.locator("#dialog-client")).to_be_visible()
    expect(page.locator("#client-notes")).to_have_value("Unfinished but important")


@pytest.mark.parametrize(
    "module,method,root,fields",
    [
        (
            "modules/common/trainerDetailsDialog.js",
            "openTrainerDetailsDialog",
            "dialog-trainer-details",
            {
                "trainer-details-name": "Draft trainer",
                "trainer-details-email": "unfinished@",
            },
        ),
        (
            "modules/plans/programImportDialog.js",
            "openProgramImportDialog",
            "dialog-program-import",
            {"program-import-text": "Bench press 3 x 10"},
        ),
    ],
)
def test_unrouted_dialog_and_its_input_return(
    page, local_server, module, method, root, fields
):
    page.goto(local_server + "clients")
    _open_module(page, module, method)
    for identifier, text in fields.items():
        page.locator("#" + identifier).fill(text)
    page.reload()
    expect(page.locator("#" + root)).to_be_visible()
    for identifier, text in fields.items():
        expect(page.locator("#" + identifier)).to_have_value(text)


def test_cancel_discards_but_failed_save_does_not(page, local_server):
    page.goto(local_server + "clients")
    _open_module(
        page, "modules/common/trainerDetailsDialog.js", "openTrainerDetailsDialog"
    )
    page.locator("#trainer-details-name").fill("Do not save yet")
    page.locator("#trainer-details-email").fill("not an email")
    page.locator("#trainer-details-save").click()
    page.reload()
    expect(page.locator("#trainer-details-name")).to_have_value("Do not save yet")
    page.locator("#trainer-details-cancel").click()
    _open_module(
        page, "modules/common/trainerDetailsDialog.js", "openTrainerDetailsDialog"
    )
    expect(page.locator("#trainer-details-name")).to_have_value("")


def test_successful_creation_does_not_return_as_an_unsaved_duplicate(
    page, local_server
):
    page.goto(local_server + "exercises/new")
    page.locator("#exercise-name").fill("A saved movement")
    page.locator('#form-exercise button[type="submit"]').click()
    expect(page.locator("#dialog-exercise")).not_to_be_visible()
    page.wait_for_function(
        "async () => { const {getState} = await import(new URL('data/stateStore.js', document.baseURI).href); const {flushWrites} = await import(new URL('data/writeQueue.js', document.baseURI).href); await flushWrites(); return getState().exercises.some(e => e.name === 'A saved movement'); }"
    )
    page.goto(local_server + "exercises/new")
    expect(page.locator("#exercise-name")).to_have_value("")


def test_a_draft_survives_closing_its_tab(page, local_server):
    page.goto(local_server + "exercises/new")
    page.locator("#exercise-name").fill("Closed tab draft")
    context = page.context
    page.close()
    other = context.new_page()
    other.goto(local_server + "exercises/new")
    expect(other.locator("#exercise-name")).to_have_value("Closed tab draft")
    other.close()


def test_session_repeat_and_participants_survive(page, local_server):
    page.goto(local_server + "session/new")
    page.locator("#setup-session-name").fill("Weekly draft")
    page.locator("#setup-repeat").check()
    page.locator('#setup-repeat-days input[data-weekday="1"]').check()
    page.locator('#setup-repeat-days input[data-weekday="5"]').check()
    page.locator("#setup-repeat-until").fill("2030-12-31")
    page.locator("#setup-participant-search").fill("Jane")
    page.locator("#setup-participant-matches button").first.click()
    rows = page.locator(".participant-setup-row")
    chosen = rows.evaluate_all(
        "rows => rows.map(row => ({id:row.dataset.clientId, routine:row.querySelector('select').value}))"
    )
    days = page.locator("#setup-repeat-days input:checked").evaluate_all(
        "fields => fields.map(f => f.dataset.weekday)"
    )
    page.reload()
    expect(page.locator("#setup-repeat")).to_be_checked()
    expect(page.locator("#setup-repeat-until")).to_have_value("2030-12-31")
    assert (
        rows.evaluate_all(
            "rows => rows.map(row => ({id:row.dataset.clientId, routine:row.querySelector('select').value}))"
        )
        == chosen
    )
    assert (
        page.locator("#setup-repeat-days input:checked").evaluate_all(
            "fields => fields.map(f => f.dataset.weekday)"
        )
        == days
    )


def test_routine_structure_and_raw_values_survive(page, local_server):
    page.goto(local_server + "routines/new")
    page.locator("#routine-name").fill("Structured draft")
    page.locator("#routine-ex-picker .picker-item").first.click()
    page.locator("#routine-ex-picker .picker-item").nth(1).click()
    rows = page.locator(".routine-builder-row")
    rows.nth(0).locator(".input-sets").fill("7")
    rows.nth(1).locator(".input-reps").fill("8-12")
    ids = rows.locator(".select-ex").evaluate_all("fields => fields.map(f => f.value)")
    page.reload()
    expect(rows).to_have_count(2)
    expect(rows.nth(0).locator(".input-sets")).to_have_value("7")
    expect(rows.nth(1).locator(".input-reps")).to_have_value("8-12")
    assert (
        rows.locator(".select-ex").evaluate_all("fields => fields.map(f => f.value)")
        == ids
    )


def test_feedback_returns_to_the_same_exercise_with_its_choice(page, local_server):
    page.goto(local_server)
    page.locator(
        ".session-card", has_text="Group Strength & Conditioning"
    ).first.click()
    _open_module(page, "modules/common/feedbackModal.js", "openFeedbackModal")
    page.locator("#feedback-custom-note").fill("Keep this gym note")
    page.locator('input[name="feedback-tag"][value="Joint Pain / Discomfort"]').check()
    page.locator("#feedback-keep-on-record").check()
    exercise = page.locator("#feedback-ex-display-name").text_content()
    page.reload()
    expect(page.locator("#dialog-feedback")).to_be_visible()
    expect(page.locator("#feedback-custom-note")).to_have_value("Keep this gym note")
    expect(
        page.locator('input[name="feedback-tag"][value="Joint Pain / Discomfort"]')
    ).to_be_checked()
    expect(page.locator("#feedback-keep-on-record")).to_be_checked()
    expect(page.locator("#feedback-ex-display-name")).to_have_text(exercise)
