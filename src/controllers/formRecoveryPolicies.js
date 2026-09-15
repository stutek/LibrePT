import { getState } from "../data/stateStore.js";
import {
  openClientEraseDialog,
  openClientExportDialog,
} from "../modules/clients/clientDataRights.js";
import {
  openSignupReview,
  reviewSignupText,
  signupDraftText,
} from "../modules/clients/signupReviewDialog.js";
import { backupDraftSource, restoreBackupDraft } from "../modules/common/backupRestore.js";
import { openFeedbackModal } from "../modules/common/feedbackModal.js";
import { openTrainerDetailsDialog } from "../modules/common/trainerDetailsDialog.js";
import { addRoutineExerciseRow } from "../modules/plans/plansView.js";
import { openProgramImportDialog } from "../modules/plans/programImportDialog.js";
import {
  readSetupDraftStructure,
  restoreSetupDraftStructure,
} from "../modules/session/editSessionControl.js";
import {
  openSessionInviteDialog,
  sessionInviteDraftContext,
} from "../modules/session/sessionInviteDialog.js";
import {
  activeSessionFilters,
  restoreSessionFilters,
} from "../modules/sessionList/sessionFilterBar.js";
// The audited form inventory. Each policy names the form's identity, its opener, and any
// structured content ordinary input values cannot represent. No markup is stored or replayed.
import { getActiveSession } from "./activeSessionStore.js";
import { deleteScheduledSession } from "./sessionLifecycle.js";
import { offerScheduleAdjustment } from "./sessionScheduleAdjustment.js";

const value = (id) => document.getElementById(id)?.value || "";
const click = (id) => document.getElementById(id)?.click();
const clientExists = (id) => getState().clients.some((client) => client.id === id);

function routineRows() {
  return [...document.querySelectorAll(".routine-builder-row")].map((row) => ({
    id: row.querySelector(".select-ex")?.value,
    sets: row.querySelector(".input-sets")?.value,
    reps: row.querySelector(".input-reps")?.value,
    weight: row.querySelector(".input-weight")?.value,
    rest: row.querySelector(".input-rest")?.value,
  }));
}

function restoreRoutineRows(rows, t) {
  if (!Array.isArray(rows)) return;
  const list = document.getElementById("routine-exercises-list");
  list.replaceChildren();
  for (const item of rows) {
    if (!getState().exercises.some((exercise) => exercise.id === item.id)) continue;
    addRoutineExerciseRow({ preset: item, state: getState(), t });
    // Keep raw unfinished numbers as well as parsed values; the ordinary submit validates them.
    const row = list.lastElementChild;
    for (const name of ["sets", "reps", "weight", "rest"]) {
      const field = row.querySelector(`.input-${name}`);
      if (field && item[name] !== undefined) field.value = item[name];
    }
  }
}

export function formRecoveryPolicies({ t, navigateToPath }) {
  return [
    {
      id: "backup-review",
      root: "dialog-backup",
      read: backupDraftSource,
      restore: restoreBackupDraft,
      reopen: () => navigateToPath("/backup"),
      completeOn: "#btn-restore-confirm",
      cancel: "#btn-restore-cancel",
    },
    { id: "client-search", root: "view-client-directory", resume: false, reopen: () => {} },
    {
      id: "exercise-search",
      root: "view-exercises",
      resume: false,
      reopen: () => {},
      read: () => document.querySelector("#view-exercises [data-filter].active")?.dataset.filter,
      restore: (filter) => {
        for (const button of document.querySelectorAll("#view-exercises [data-filter]")) {
          if (button.dataset.filter === filter) button.click();
        }
      },
    },
    {
      id: "session-filters",
      root: "view-clients",
      resume: false,
      reopen: () => {},
      read: activeSessionFilters,
      restore: restoreSessionFilters,
    },
    {
      id: "client",
      root: "dialog-client",
      subject: () => value("client-form-id") || "new",
      context: () => ({ clientId: value("client-form-id") }),
      reopen: ({ clientId }) => {
        if (clientId && !clientExists(clientId)) return;
        click(clientId ? "btn-edit-client" : "btn-add-client");
      },
    },
    { id: "exercise", root: "dialog-exercise", reopen: () => navigateToPath("/exercises/new") },
    {
      id: "routine",
      root: "dialog-routine",
      subject: () => value("routine-form-id") || "new",
      context: () => ({ routineId: value("routine-form-id") }),
      read: routineRows,
      restore: (rows) => restoreRoutineRows(rows, t),
      reopen: ({ routineId }) => {
        if (routineId && !getState().routines.some((routine) => routine.id === routineId)) return;
        navigateToPath(routineId ? `/routines/${encodeURIComponent(routineId)}` : "/routines/new");
      },
    },
    {
      id: "session-setup",
      root: "form-workout-setup",
      subject: () => readSetupDraftStructure().subject,
      read: readSetupDraftStructure,
      restore: restoreSetupDraftStructure,
      reopen: () => {}, // Its existing route opens it before the recovery pass.
    },
    {
      id: "trainer",
      root: "dialog-trainer-details",
      reopen: openTrainerDetailsDialog,
      completeOn: "#trainer-details-save",
      exclude: [],
      cancel: "#trainer-details-cancel",
    },
    {
      id: "trainer-splash",
      root: "splash-trainer-details",
      reopen: () => {},
      completeOn: "#splash-trainer-save",
    },
    {
      id: "program-import",
      root: "dialog-program-import",
      reopen: openProgramImportDialog,
      completeOn: "#program-import-open",
    },
    { id: "intake-invite", root: "dialog-intake-invite", reopen: () => click("btn-invite-client") },
    {
      id: "session-invite",
      root: "dialog-session-invite",
      subject: () => JSON.stringify(sessionInviteDraftContext()),
      context: sessionInviteDraftContext,
      reopen: (context) => openSessionInviteDialog(context),
    },
    {
      id: "feedback",
      root: "dialog-feedback",
      subject: () =>
        JSON.stringify([
          getActiveSession()?.id,
          value("feedback-client-id"),
          document.getElementById("dialog-feedback")?.dataset.exerciseId,
        ]),
      context: () => ({
        sessionId: getActiveSession()?.id,
        clientId: value("feedback-client-id"),
        exerciseId: document.getElementById("dialog-feedback")?.dataset.exerciseId,
      }),
      reopen: ({ clientId, exerciseId }) => {
        const active = getActiveSession();
        if (
          active?.activeClientId === clientId &&
          active.clientRoutines[clientId]?.exercises.some((exercise) => exercise.id === exerciseId)
        )
          openFeedbackModal(exerciseId);
      },
    },
    ...[
      ["client-export", openClientExportDialog],
      ["client-erase", openClientEraseDialog],
    ].map(([id, reopen]) => ({
      id,
      root: `dialog-${id}`,
      subject: () => document.getElementById(`dialog-${id}`)?.dataset.clientId,
      context: () => ({ clientId: document.getElementById(`dialog-${id}`)?.dataset.clientId }),
      exclude: ["#client-erase-confirm", "#client-export-passphrase"],
      reopen: ({ clientId }) => {
        if (clientExists(clientId)) reopen(clientId);
      },
    })),
    {
      id: "adjustment",
      root: "dialog-apply-adjustment",
      subject: () => value("adjust-update-id"),
      context: () => ({ updateId: value("adjust-update-id") }),
      read: () => ({ swapId: value("adjust-exercise-swap") }),
      afterRestore: (extra) => {
        if (!extra?.swapId) return;
        document.getElementById("adjust-exercise-swap").value = extra.swapId;
        for (const button of document.querySelectorAll("#adjust-swap-picker .picker-item")) {
          button.classList.toggle("selected", button.dataset.id === extra.swapId);
        }
      },
      reopen: ({ updateId }) => {
        if (getState().planUpdates.some((update) => update.id === updateId))
          navigateToPath(`/adjustments/${encodeURIComponent(updateId)}`);
      },
    },
    {
      id: "start-time",
      root: "dialog-session-start-time",
      subject: () => getActiveSession()?.id,
      context: () => ({ sessionId: getActiveSession()?.id }),
      reopen: () => offerScheduleAdjustment({ onDeleteSession: deleteScheduledSession }),
      cancel: "#btn-session-start-time-keep",
    },
    {
      id: "signup-review",
      root: "dialog-signup-review",
      read: signupDraftText,
      restore: (text) => {
        if (typeof text === "string") reviewSignupText(text);
      },
      reopen: openSignupReview,
      completeOn: "#signup-review-save",
    },
  ];
}
