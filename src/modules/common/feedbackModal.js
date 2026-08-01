// components/feedbackModal.js
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

import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";

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

  $id("feedback-client-id").value = activeClientId;
  $id("feedback-exercise-name").value = curEx.name;
  $id("feedback-client-display-name").textContent = client.name;
  $id("feedback-ex-display-name").textContent = curEx.name;
  $id("feedback-custom-note").value = "";

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
    recordIcon.className = "fa-solid fa-microphone";
    recordIcon.style.color = "";
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
      <div class="form-group" style="margin-top: 16px;">
        <label style="display: flex; align-items: center; justify-content: space-between;">
          <span id="label-voice-note" data-i18n="voice_note_label">Privacy-First Voice Note</span>
          <span class="badge badge-emerald" style="font-size: 8px; padding: 1px 4px;">Local Only</span>
        </label>
        <div class="voice-recorder-widget" style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 4px;">
          <button type="button" id="btn-voice-record" class="btn secondary-btn" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.05); color: var(--primary); border-color: var(--border-color); flex-shrink: 0;">
            <i class="fa-solid fa-microphone" id="voice-record-icon" style="font-size: 16px;"></i>
          </button>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div id="voice-record-status" style="font-size: 11px; font-weight: 600; color: var(--text-muted);" data-i18n="voice_ready">Ready to record voice memo</div>
            <!-- Mock audio wave visualization -->
            <div id="voice-audio-wave" class="audio-wave-container hidden" style="display: flex; align-items: center; gap: 2px; height: 16px; margin-top: 4px;">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </div>
            <!-- Audio player review if recorded -->
            <div id="voice-audio-player" class="audio-player-mini hidden" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <button type="button" id="btn-play-voice-preview" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 0;"><i class="fa-solid fa-circle-play" style="font-size: 16px;"></i></button>
              <div style="font-size: 10px; color: var(--text-color); font-family: monospace;">voice_memo.wav (0:04)</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="feedback-custom-note">Custom Details / Notes</label>
        <input type="text" id="feedback-custom-note" placeholder="e.g. Left knee clicks, reduced load..." class="form-control">
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
          recordIcon.className = "fa-solid fa-stop";
          recordIcon.style.color = "#ef4444"; // red indicating recording active
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
          recordIcon.className = "fa-solid fa-microphone";
          recordIcon.style.color = "";
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
          playIcon.className = "fa-solid fa-circle-pause";
          if (recordStatus) recordStatus.textContent = t("voice_playing");

          setTimeout(() => {
            playIcon.className = "fa-solid fa-circle-play";
            if (recordStatus) recordStatus.textContent = t("voice_transcription_done");
          }, 3000);
        } else {
          playIcon.className = "fa-solid fa-circle-play";
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
      renderPendingPlanAdjustments();
      closeModal("dialog-feedback");
    });
  }
}
