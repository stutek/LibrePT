// components/feedbackModal.js
// Controls the feedback modal dialog (#dialog-feedback), handles custom outcome tagging,
// and manages the mock local voice note recorder / speech-to-text transcription.
//
// deps: {
//   getState(),
//   getActiveSession(),
//   t,
//   generateShortUUID(),
//   saveActiveSessionToCache(),
//   saveToLocalStorage(),
//   renderPendingPlanAdjustments()
// }

import { $id, closeModal, openModal } from "../helper/dom.js";

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

export function setupFeedbackForms() {
  const fbModal = $id("dialog-feedback");
  if (!fbModal) return;

  const fbForm = $id("form-feedback");
  const {
    t,
    generateShortUUID,
    saveActiveSessionToCache,
    saveToLocalStorage,
    renderPendingPlanAdjustments,
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
        id: generateShortUUID(),
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
