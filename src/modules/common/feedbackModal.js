// src/modules/common/feedbackModal.js
// Controls the feedback modal dialog (#dialog-feedback): a tag and the trainer's own typed note.
//
// There is no voice note, by ruling (2026-09-27): the microphone never goes into this app, for
// privacy. A mock recorder stood here and wrote a sentence nobody had said into the client's
// record ("… reported good form and speed on …"), under a file name for audio that never existed.
// `hasVoiceNote` stays readable on old records (quickSignals.js) and nothing here writes it.
//
// deps: {
//   getState(),
//   getActiveSession(),
//   t,
//   newRecordId(),
//   saveActiveSessionToCache(),
//   saveToLocalStorage(),
//   renderPendingPlanAdjustments()
// }

import { localDateString } from "../../data/calendarDay.js";
import { FEEDBACK_TAGS, feedbackTagText } from "../../domain/feedbackTags.js";
import { notesWithGymNote } from "../../domain/gymNotes.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";
import { clientDisplayName } from "./utils.js";

let deps = null;

export function initFeedbackModal(d) {
  deps = d;
}

export function openFeedbackModal(exId) {
  const activeSession = deps.getActiveSession();
  const state = deps.getState();
  if (!activeSession) return;
  const activeClientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[activeClientId];
  if (!clientState || clientState.exercises.length === 0) return;

  const curEx =
    (exId && clientState.exercises.find((e) => e.id === exId)) ||
    clientState.exercises[clientState.activeExerciseIndex];
  const client = state.clients.find((c) => c.id === activeClientId);
  const { t } = deps;

  $id("feedback-client-id").value = activeClientId;
  $id("feedback-exercise-name").value = curEx.name;
  $id("feedback-client-display-name").textContent = clientDisplayName(client);
  $id("feedback-ex-display-name").textContent = curEx.name;
  $id("feedback-custom-note").value = "";
  $id("feedback-keep-on-record").checked = false;
  $id("feedback-keep-on-record-label").textContent = t("feedback_keep_on_record");

  openModal("dialog-feedback", { resetForm: true, formId: "form-feedback" });
}

const CHIP_EMOJI = {
  note: "📝",
  too_easy: "🚀",
  too_hard: "⚠️",
  form_break: "🔬",
  joint_pain: "🔥",
  progression: "💪",
};

// One chip per known tag, built from the tag list so the words shown and the value stored cannot
// drift apart — they did: the chip read "Form Break - Focus Required" and saved "Form Break -
// Watch Position". The words come from the dictionary when the markup is translated.
function feedbackChipsHTML() {
  return FEEDBACK_TAGS.map(
    ({ id, tag, key }, index) => `          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="${tag}"${index === 0 ? " checked" : ""}>
            <span>${CHIP_EMOJI[id]} <span data-i18n="${key}"></span></span>
          </label>`,
  ).join("\n");
}

export function renderFeedbackDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-feedback"),
    `
<dialog id="dialog-feedback" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 data-i18n="log_client_feedback">Log Client Feedback</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close feedback modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-feedback" method="dialog" class="modal-form">
      <input type="hidden" id="feedback-client-id">
      <input type="hidden" id="feedback-exercise-name">
      
      <div class="form-group">
        <!-- The two names are filled on every open (openFeedbackModal). -->
        <label><span data-i18n="feedback_for">Feedback for</span> <span id="feedback-client-display-name" class="text-emerald font-semibold"></span> <span data-i18n="feedback_on">on</span> <span id="feedback-ex-display-name" class="text-emerald font-semibold"></span></label>
        
        <div class="feedback-chips-selector">
${feedbackChipsHTML()}
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-custom-note" data-i18n="custom_details">Custom Details / Notes</label>
        <input type="text" id="feedback-custom-note" data-i18n-placeholder="feedback_note_placeholder" placeholder="e.g. Left knee clicks, reduced load..." class="form-control">
      </div>

      <!-- Mid-session capture that OUTLIVES the session. A twinge mentioned between
           rounds changes how this person is programmed for months; logged only as an alert it waits
           on the Pending Review screen and is resolved away. Ticking this appends it to the client's
           own record, which is the text every future plan is written against. Off by default: most
           signals are about today's load, and a record that collects everything is one nobody
           reads. The whole row is the target, not the 16px box. -->
      <div class="form-group">
        <label class="feedback-keep-row" for="feedback-keep-on-record">
          <input type="checkbox" id="feedback-keep-on-record">
          <span id="feedback-keep-on-record-label" data-i18n="feedback_keep_on_record">Keep this on the client's record</span>
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel" data-i18n="btn_cancel">Cancel</button>
        <button type="submit" class="btn primary-btn" data-i18n="btn_log_alert">Log Alert</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupFeedbackForms() {
  renderFeedbackDialog();
  const fbModal = $id("dialog-feedback");
  if (!fbModal) return;

  const fbForm = $id("form-feedback");
  const {
    newRecordId,
    saveActiveSessionToCache,
    saveToLocalStorage,
    renderPendingPlanAdjustments,
    enforceQuickSignalExclusivity,
  } = deps;

  const cancelBtn = fbModal.querySelector(".modal-cancel");
  const closeBtn = fbModal.querySelector(".modal-close-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal("dialog-feedback"));
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal("dialog-feedback"));

  if (fbForm) {
    fbForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const state = deps.getState();
      const activeSession = deps.getActiveSession();
      const clientId = $id("feedback-client-id").value;
      const exName = $id("feedback-exercise-name").value;
      const customNote = $id("feedback-custom-note").value;
      const tagVal = fbForm.querySelector('input[name="feedback-tag"]:checked').value;

      const client = state.clients.find((c) => c.id === clientId);

      const newFeedback = {
        id: newRecordId(),
        clientId: clientId,
        clientName: client ? client.name : "Unknown Client",
        date: new Date().toISOString(),
        exerciseName: exName,
        tag: tagVal + (customNote ? ` - ${customNote}` : ""),
        resolved: false,
      };

      state.planUpdates.push(newFeedback);

      // Kept on the person, not only on the session. A twinge mentioned between
      // rounds is the kind of thing that changes programming for months, and an alert on the
      // Pending Review screen is resolved away within the week. Appended to the notes the trainer
      // already writes by hand — the same text the client focus panel shows while their next plan
      // is being shaped. Deliberately NOT setting `hasInjury`: which tags mean "injury" would be a
      // guess made from a string, and the trainer's own record is where that call belongs.
      if (client && $id("feedback-keep-on-record").checked) {
        // In the trainer's language, as the Pending Review screen says it. The notes are text the
        // trainer reads before the next session, and the stored tag is an English identifier.
        const said = feedbackTagText(tagVal, deps.t) + (customNote ? ` - ${customNote}` : "");
        client.notes = notesWithGymNote(client.notes, {
          on: localDateString(),
          exerciseName: exName,
          tag: said,
        });
      }

      // Save to active session so it carries into client history log
      if (activeSession) {
        if (!activeSession.feedback) {
          activeSession.feedback = [];
        }
        // Too Easy / Too Hard are mutually exclusive everywhere a PT can log them, not just the
        // quick-tap buttons — this modal offers the same two tags as its own radio choices, so
        // without this a submission here could leave both
        // active at once alongside an existing quick-tap on the opposite tag.
        enforceQuickSignalExclusivity?.(clientId, exName, tagVal);
        activeSession.feedback.push({
          id: newFeedback.id,
          clientId: clientId,
          exerciseName: exName,
          tag: tagVal,
          note: customNote,
        });
        saveActiveSessionToCache();
      }

      saveToLocalStorage();
      renderPendingPlanAdjustments();
      closeModal("dialog-feedback");
    });
  }
}
