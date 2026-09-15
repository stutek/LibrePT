"""Every input-owning module has an explicit recovery policy (TODO §50.1).

This inventory catches new surfaces; e2e/test_form_recovery.py proves real recovery.
Shared controls and deliberate exclusions are classified, never silently skipped.
"""

import re


SURFACES = {
    "controllers/clientFormsController.js": "client",
    "controllers/exerciseFormsController.js": "exercise",
    "controllers/routineFormsController.js": "routine",
    "modules/session/editSessionView.js": "session-setup",
    "modules/session/editSessionControl.js": "session-setup participant rows",
    "modules/session/sessionRepeatControls.js": "session-setup weekdays",
    "modules/session/sessionInviteDialog.js": "session-invite",
    "modules/session/sessionStartTimeDialog.js": "start-time",
    "modules/sessionList/sessionFilterBar.js": "session-filters",
    "modules/sessionList/sessionCard.js": "elapsed-duration",
    "modules/clients/intakeInviteDialog.js": "intake-invite",
    "modules/clients/signupReviewDialog.js": "signup-review parsed file and choices",
    "modules/clients/clientsView.js": "client-search",
    "modules/clients/clientConsentSection.js": "client fields; consent excluded",
    "modules/clients/clientDataRights.js": "client-export/client-erase; secrets and confirmation excluded",
    "modules/exercises/exercisePicker.js": "shared picker inside its owning form",
    "modules/exercises/exercisesView.js": "exercise-search",
    "modules/plans/planAdjustments.js": "adjustment",
    "modules/plans/plansView.js": "routine rows",
    "modules/plans/programImportDialog.js": "program-import, including file-derived text",
    "modules/common/trainerDetailsDialog.js": "trainer and trainer-splash",
    "modules/common/feedbackModal.js": "feedback",
    "modules/common/backupRestore.js": "backup-review, requiring fresh confirmation",
    "modules/intake/intakeView.js": "tab-only intake, consent excluded",
    "modules/clipboard/clipboardEditor.js": "live cache, no separate business-data draft",
    "modules/clipboard/circuitCard.js": "live cache on input",
    "modules/clipboard/activeSessionOverlayView.js": "retired add-exercise dialog, no reachable control",
    "modules/common/applicationHeader.js": "theme/language persist as preferences",
    "modules/common/encryptedFileReader.js": "explicit exclusion: decryption secret and private file",
    "modules/common/dataWipeDialog.js": "explicit exclusion: destructive selection is reconsidered",
    "modules/common/dateField.js": "shared field; owning form stores raw input",
    "modules/common/timeField.js": "shared field; owning form stores raw input",
    "modules/common/steppedField.js": "shared field; owning form stores raw input",
    "modules/common/populateDropdownSelectors.js": "shared options, not a separate form",
    "modules/common/theme.js": "persisted preference",
    "domain/repsAndLoad.js": "shared metric markup, owned by routine or clipboard",
    "domain/circuitGrouping.js": "comment about selectors, no input owner",
    "domain/sessionClock.js": "comment about time controls, no input owner",
    "i18n/index.js": "comment about language control, no input owner",
    "modules/demo/storyTour.js": "comment about a demonstrated control, no separate form",
}


def test_every_input_owner_has_a_recovery_policy(src_dir):
    pattern = re.compile(
        r"<(?:input|textarea|select)\b|createElement\([\"'](?:input|textarea|select)[\"']"
    )
    found = {
        path.relative_to(src_dir).as_posix()
        for path in src_dir.rglob("*.js")
        if pattern.search(path.read_text())
    }
    assert found == set(SURFACES), (
        f"Classify new or removed form owners: {found ^ set(SURFACES)}"
    )
    assert all(SURFACES.values())


def test_every_real_html_form_has_a_named_recovery_decision(src_dir):
    known = {
        "form-client",
        "form-exercise",
        "form-routine",
        "form-workout-setup",
        "form-feedback",
        "form-apply-adjustment",
        "form-session-start-time",
        "intake-form",
        "form-add-session-exercise",
    }
    found = set()
    for path in src_dir.rglob("*.js"):
        found.update(re.findall(r'<form\s+id="([\w-]+)"', path.read_text()))
    assert found == known, (
        f"Declare the new form's policy and add a reload scenario: {found ^ known}"
    )
