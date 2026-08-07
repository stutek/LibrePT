// src/modules/session/sessionStartTimeDialog.js
// The "this session is starting off schedule" dialog, offered once when the trainer taps Start and
// the wall clock disagrees with the scheduled slot by more than SCHEDULE_DRIFT_TOLERANCE_MS
// (sessionClock.js). A late-running gym is the norm, not an error: the previous group overruns, a
// client turns up at 10:20 for a 10:00 slot, and by the time Start is tapped it is the SCHEDULE
// that is wrong. Left uncorrected the session logs against a slot it did not run in, and every
// countdown on screen is measured from a plan nobody followed.
//
// Deliberately non-blocking: the session has ALREADY started by the time this opens, so the dialog
// only edits the schedule around a session that is running. Dismissing it (X, Escape, or "Keep
// scheduled") keeps the original slot — a trainer on the gym floor is never held up by a modal they
// did not ask for.
//
// Owns `#dialog-session-start-time`'s markup. Both ends are editable rather than just shifted,
// because "we actually started 20 minutes ago and I forgot to tap Start" and "we start now and run
// the planned hour" are both real, and only the trainer knows which.
//
// Takes { t, ... } per open rather than init(deps)-then-open: `t` is the only app-level helper it
// needs, so a boot step would be ceremony around a single argument.

import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { formatClockFromMinutes } from "../common/utils.js";

const DIALOG_ID = "dialog-session-start-time";

// Set per open, read by the listeners bound once below — the callback closes over the schedule of
// the session being started, so it cannot be captured at wiring time.
let applyChoice = null;

function wireStartTimeDialog(dialog) {
  dialog.querySelector("#form-session-start-time").addEventListener("submit", (event) => {
    event.preventDefault();
    applyChoice?.({
      startValue: dialog.querySelector("#session-start-time-start").value,
      endValue: dialog.querySelector("#session-start-time-end").value,
    });
    closeModal(DIALOG_ID);
  });
  for (const dismiss of dialog.querySelectorAll(".modal-close-btn, #btn-session-start-time-keep")) {
    dismiss.addEventListener("click", () => closeModal(DIALOG_ID));
  }
}

function ensureStartTimeDialog(t) {
  const alreadyRendered = !!document.getElementById(DIALOG_ID);
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="session-start-time-title"></h3>
      <button type="button" class="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-session-start-time" class="modal-form">
      <div class="modal-body-scroll">
        <p id="session-start-time-desc" class="dialog-desc"></p>
        <div class="form-row">
          <div class="form-group col">
            <label id="session-start-time-start-label" for="session-start-time-start"></label>
            <input type="time" id="session-start-time-start" class="form-control" required>
          </div>
          <div class="form-group col">
            <label id="session-start-time-end-label" for="session-start-time-end"></label>
            <input type="time" id="session-start-time-end" class="form-control" required>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn secondary-btn" id="btn-session-start-time-keep"></button>
        <button type="submit" class="btn primary-btn" id="btn-session-start-time-apply"></button>
      </div>
    </form>
  </dialog>
`,
  );

  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog) return null;
  if (!alreadyRendered) wireStartTimeDialog(dialog);

  // Re-labelled on every open, not only on creation: the trainer can switch language while a
  // dialog rendered under the old one is still in the DOM.
  dialog.querySelector("#session-start-time-title").textContent = t("session_start_time_title");
  dialog.querySelector("#session-start-time-start-label").textContent = t("label_start_time");
  dialog.querySelector("#session-start-time-end-label").textContent = t("label_end_time");
  dialog.querySelector("#btn-session-start-time-keep").textContent = t("session_start_time_keep");
  dialog.querySelector("#btn-session-start-time-apply").textContent = t("session_start_time_apply");
  return dialog;
}

function toClockValue(epochMs) {
  const date = new Date(epochMs);
  return formatClockFromMinutes(date.getHours() * 60 + date.getMinutes());
}

function describeDrift(driftMs, scheduledLabel, t) {
  return t("session_start_time_desc")
    .replace("{scheduled}", scheduledLabel)
    .replace("{minutes}", String(Math.round(Math.abs(driftMs) / 60000)))
    .replace(
      "{direction}",
      driftMs >= 0 ? t("session_start_time_late") : t("session_start_time_early"),
    );
}

// `onApply({ startValue, endValue })` receives the two raw "HH:MM" field values — turning them into
// a schedule and persisting it belongs to the caller, since this module knows nothing about state.
export function openSessionStartTimeDialog({
  t,
  scheduledLabel,
  driftMs,
  proposedStartMs,
  proposedEndMs,
  onApply,
}) {
  const dialog = ensureStartTimeDialog(t);
  if (!dialog) return;

  dialog.querySelector("#session-start-time-desc").textContent = describeDrift(
    driftMs,
    scheduledLabel,
    t,
  );
  dialog.querySelector("#session-start-time-start").value = toClockValue(proposedStartMs);
  dialog.querySelector("#session-start-time-end").value = toClockValue(proposedEndMs);

  applyChoice = onApply;
  openModal(DIALOG_ID);
}
