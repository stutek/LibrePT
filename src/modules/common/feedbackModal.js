// src/modules/common/feedbackModal.js
// Controls the feedback modal dialog (#dialog-feedback), handles custom outcome tagging,
// and manages the mock local voice note recorder / speech-to-text transcription.
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

import { notesWithGymNote } from "../../domain/gymNotes.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";
import { finishTrainerFormDraft } from "./trainerFormDraft.js";

let deps = null;

let feedbackIsRecording = false;
let feedbackHasVoiceNote = false;

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

  $id("dialog-feedback").dataset.exerciseId = curEx.id;

  $id("feedback-client-id").value = activeClientId;
  $id("feedback-exercise-name").value = curEx.name;
  $id("feedback-client-display-name").textContent = client.name;
  $id("feedback-ex-display-name").textContent = curEx.name;
  $id("feedback-custom-note").value = "";
  $id("feedback-keep-on-record").checked = false;
  $id("feedback-keep-on-record-label").textContent = t("feedback_keep_on_record");

  // Reset voice recorder state
  feedbackIsRecording = false;
  feedbackHasVoiceNote = false;
  const audioWave = $id("voice-audio-wave");
  const audioPlayer = $id("voice-audio-player");
  const recordIcon = $id("voice-record-icon");
  const recordStatus = $id("voice-record-status");
  if (audioWave) {
    audioWave.classList.add("hidden");
    audioWave.classList.remove("recording");
  }
  if (audioPlayer) audioPlayer.classList.add("hidden");
  if (recordStatus) recordStatus.textContent = t("voice_ready");
  if (recordIcon) {
    recordIcon.className = "fa-solid fa-microphone voice-record-icon";
  }

  openModal("dialog-feedback", { resetForm: true, formId: "form-feedback" });
}

export function renderFeedbackDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-feedback"),
    `
<dialog id="dialog-feedback" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3>Log Client Feedback</h3>
      <button class="modal-close-btn" aria-label="Close feedback modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-feedback" method="dialog" class="modal-form">
      <input type="hidden" id="feedback-client-id">
      <input type="hidden" id="feedback-exercise-name">
      
      <div class="form-group">
        <label>Feedback for <span id="feedback-client-display-name" class="text-emerald font-semibold">Jane Doe</span> on <span id="feedback-ex-display-name" class="text-emerald font-semibold">Bench Press</span></label>
        
        <div class="feedback-chips-selector">
          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="Too Easy - Increase Load" checked>
            <span>🚀 Too Easy - Increase Load</span>
          </label>
          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="Too Hard - Reduce Load">
            <span>⚠️ Too Hard - Reduce Load</span>
          </label>
          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="Form Break - Watch Position">
            <span>🔬 Form Break - Focus Required</span>
          </label>
          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="Joint Pain / Discomfort">
            <span>🔥 Joint Pain / Discomfort</span>
          </label>
          <label class="feedback-chip-option">
            <input type="radio" name="feedback-tag" value="Completed reps easily">
            <span>💪 Good Progression</span>
          </label>
        </div>
      </div>

      <!-- Privacy-First Voice Note Group -->
      <div class="form-group feedback-voice-group">
        <label class="feedback-voice-label">
          <span id="label-voice-note" data-i18n="voice_note_label">Privacy-First Voice Note</span>
          <span class="badge badge-emerald feedback-local-badge">Local Only</span>
        </label>
        <div class="voice-recorder-widget">
          <button type="button" id="btn-voice-record" class="btn secondary-btn voice-record-btn">
            <i class="fa-solid fa-microphone voice-record-icon" id="voice-record-icon"></i>
          </button>
          <div class="voice-status-col">
            <div id="voice-record-status" class="voice-record-status-text" data-i18n="voice_ready">Ready to record voice memo</div>
            <!-- Mock audio wave visualization -->
            <div id="voice-audio-wave" class="audio-wave-container hidden">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </div>
            <!-- Audio player review if recorded -->
            <div id="voice-audio-player" class="audio-player-mini hidden">
              <button type="button" id="btn-play-voice-preview" class="voice-preview-btn"><i class="fa-solid fa-circle-play voice-preview-icon"></i></button>
              <div class="voice-memo-filename">voice_memo.wav (0:04)</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-custom-note">Custom Details / Notes</label>
        <input type="text" id="feedback-custom-note" placeholder="e.g. Left knee clicks, reduced load..." class="form-control">
      </div>

      <!-- Mid-session capture that OUTLIVES the session (TODO §35.3c). A twinge mentioned between
           rounds changes how this person is programmed for months; logged only as an alert it waits
           on the Pending Review screen and is resolved away. Ticking this appends it to the client's
           own record, which is the text every future plan is written against. Off by default: most
           signals are about today's load, and a record that collects everything is one nobody
           reads. The whole row is the target, not the 16px box. -->
      <div class="form-group">
        <label class="feedback-keep-row" for="feedback-keep-on-record">
          <input type="checkbox" id="feedback-keep-on-record">
          <span id="feedback-keep-on-record-label">Keep this on the client's record</span>
        </label>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
        <button type="submit" class="btn primary-btn">Log Alert</button>
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
    t,
    newRecordId,
    saveActiveSessionToCache,
    saveToLocalStorage,
    renderPendingPlanAdjustments,
    enforceQuickSignalExclusivity,
  } = deps;

  // Voice recording mock handlers
  const recordBtn = $id("btn-voice-record");
  if (recordBtn) {
    recordBtn.addEventListener("click", () => {
      const recordIcon = $id("voice-record-icon");
      const recordStatus = $id("voice-record-status");
      const audioWave = $id("voice-audio-wave");
      const audioPlayer = $id("voice-audio-player");
      const state = deps.getState();

      if (!feedbackIsRecording) {
        // Start snemanje / record
        feedbackIsRecording = true;
        feedbackHasVoiceNote = false;
        if (recordIcon) {
          // is-recording (feedbackModal.css) colors the icon var(--danger) while recording.
          recordIcon.className = "fa-solid fa-stop voice-record-icon is-recording";
        }
        if (recordStatus) recordStatus.textContent = t("voice_recording");
        if (audioWave) {
          audioWave.classList.remove("hidden");
          audioWave.classList.add("recording");
        }
        if (audioPlayer) audioPlayer.classList.add("hidden");
      } else {
        // Stop recording
        feedbackIsRecording = false;
        feedbackHasVoiceNote = true;
        if (recordIcon) {
          recordIcon.className = "fa-solid fa-microphone voice-record-icon";
        }
        if (recordStatus) recordStatus.textContent = t("voice_processing");
        if (audioWave) {
          audioWave.classList.remove("recording");
          audioWave.classList.add("hidden");
        }

        // Mock speech transcription after delay
        setTimeout(() => {
          if (recordStatus) recordStatus.textContent = t("voice_transcription_done");
          if (audioPlayer) audioPlayer.classList.remove("hidden");

          const exName = $id("feedback-exercise-name").value || "exercise";
          const clientName = $id("feedback-client-display-name").textContent || "Client";

          let generatedTranscript = "";
          if (state.lang === "sl") {
            generatedTranscript = `Glasovna opomba (lokalno): ${clientName} poroča o dobrem počutju pri vaji ${exName}.`;
          } else {
            generatedTranscript = `Voice note (local): ${clientName} reported good form and speed on ${exName}.`;
          }

          const currentNoteInput = $id("feedback-custom-note");
          if (currentNoteInput) {
            if (currentNoteInput.value) {
              currentNoteInput.value += ` (${generatedTranscript})`;
            } else {
              currentNoteInput.value = generatedTranscript;
            }
            currentNoteInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 1200);
      }
    });
  }

  const playPreviewBtn = $id("btn-play-voice-preview");
  if (playPreviewBtn) {
    playPreviewBtn.addEventListener("click", () => {
      const playIcon = playPreviewBtn.querySelector("i");
      const recordStatus = $id("voice-record-status");
      if (playIcon) {
        if (playIcon.classList.contains("fa-circle-play")) {
          playIcon.className = "fa-solid fa-circle-pause voice-preview-icon";
          if (recordStatus) recordStatus.textContent = t("voice_playing");

          setTimeout(() => {
            playIcon.className = "fa-solid fa-circle-play voice-preview-icon";
            if (recordStatus) recordStatus.textContent = t("voice_transcription_done");
          }, 3000);
        } else {
          playIcon.className = "fa-solid fa-circle-play voice-preview-icon";
          if (recordStatus) recordStatus.textContent = t("voice_transcription_done");
        }
      }
    });
  }

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
        hasVoiceNote: feedbackHasVoiceNote,
        resolved: false,
      };

      state.planUpdates.push(newFeedback);

      // Kept on the person, not only on the session (TODO §35.3c). A twinge mentioned between
      // rounds is the kind of thing that changes programming for months, and an alert on the
      // Pending Review screen is resolved away within the week. Appended to the notes the trainer
      // already writes by hand — the same text the client focus panel shows while their next plan
      // is being shaped. Deliberately NOT setting `hasInjury`: which tags mean "injury" would be a
      // guess made from a string, and the trainer's own record is where that call belongs.
      if (client && $id("feedback-keep-on-record").checked) {
        client.notes = notesWithGymNote(client.notes, {
          on: new Date().toISOString().slice(0, 10),
          exerciseName: exName,
          tag: newFeedback.tag,
        });
      }

      // Save to active session so it carries into client history log
      if (activeSession) {
        if (!activeSession.feedback) {
          activeSession.feedback = [];
        }
        // Too Easy / Too Hard are mutually exclusive everywhere a PT can log them, not just the
        // quick-tap buttons — this modal offers the same two tags as its own radio choices
        // (default-checked to "Too Easy"), so without this a submission here could leave both
        // active at once alongside an existing quick-tap on the opposite tag.
        enforceQuickSignalExclusivity?.(clientId, exName, tagVal);
        activeSession.feedback.push({
          id: newFeedback.id,
          clientId: clientId,
          exerciseName: exName,
          tag: tagVal,
          note: customNote,
          hasVoiceNote: feedbackHasVoiceNote,
        });
        saveActiveSessionToCache();
      }

      saveToLocalStorage();
      finishTrainerFormDraft("dialog-feedback");
      renderPendingPlanAdjustments();
      closeModal("dialog-feedback");
    });
  }
}
