# tests/e2e/test_program_import_to_editor.py
# A programme brought in from elsewhere arrives in the plan editor with what it prescribed.
#
# The dialog's own promises are pinned in tests/medium/test_program_import_dialog.py, which stops at
# the hand-over. This walks the rest in the real app: the plan the dialog hands over became the
# clipboard's plan as it was, in the import's own shape, so the editor showed "[object Object]" for
# the sets and every exercise opened with no load.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

PROGRAMME = {
    "format": "librept.program/1",
    "title": "Upper Body A",
    "items": [
        {
            "name": "Barbell Bench Press",
            "sets": 3,
            "reps": 5,
            "weight": 60,
            "unit": "kg",
        },
        {"rest": 90},
        {"name": "Bulgarian Split Squat With A Towel", "sets": 2, "reps": 8},
    ],
}

PLAN = """async () => {
  const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
  const session = ctrl.getActiveSession();
  const plan = session.clientRoutines[session.activeClientId];
  return plan.exercises.filter((item) => item.type !== 'rest').map((item) => ({
    name: item.name,
    sets: item.setsTargetCount,
    reps: String(item.repsTarget),
    weight: item.weightTarget,
    logged: (plan.logs[item.id] || []).map((set) => [String(set.reps), set.weight]),
  }));
}"""


def test_an_imported_programme_opens_with_its_sets_reps_and_loads(page, local_server):
    page.goto(local_server + "routines")
    page.click("#btn-import-program")
    page.wait_for_selector("#dialog-program-import[open]")
    page.fill("#program-import-text", json.dumps(PROGRAMME))
    page.select_option("#program-import-client", index=1)
    page.click("#program-import-open")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    plan = page.evaluate(PLAN)

    assert plan == [
        {
            "name": "Barbell Bench Press",
            "sets": 3,
            "reps": "5",
            "weight": 60,
            "logged": [["5", 60]] * 3,
        },
        {
            "name": "Bulgarian Split Squat With A Towel",
            "sets": 2,
            "reps": "8",
            "weight": 0,
            "logged": [["8", 0]] * 2,
        },
    ], plan
    assert "[object Object]" not in page.inner_text("#active-session-overlay")
