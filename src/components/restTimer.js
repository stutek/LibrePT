// components/restTimer.js
// Component that manages the gym floor rest timer overlay, synthesized audio alerts, and haptic feedback.
//
// deps: {
//   getActiveExercise()
// }

let deps = null;

const restTimer = {
  intervalId: null,
  secondsRemaining: 0,
  isActive: false,
  originalDuration: 60,
};

export function initRestTimer(d) {
  deps = d;
}

export function setupRestTimer() {
  const panel = document.getElementById("floating-rest-timer");
  const timerLabel = document.getElementById("timer-countdown");
  const toggleBtn = document.getElementById("btn-timer-toggle");

  // Timing is a per-card action now (a rest card runs its own duration; an exercise/superset card
  // has a ⏱ button) — there is no session-global "start timer" button. The panel below is just the
  // running-countdown UI (pause / ±15s / close); cards call triggerRestTimer() to open it.
  const closeBtn = document.getElementById("btn-close-timer");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.classList.add("hidden");
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (restTimer.isActive) {
        pauseRestTimer();
      } else {
        resumeRestTimer();
      }
    });
  }

  const plusBtn = document.getElementById("btn-timer-plus");
  if (plusBtn) {
    plusBtn.addEventListener("click", () => {
      adjustRestTimer(15);
    });
  }

  const minusBtn = document.getElementById("btn-timer-minus");
  if (minusBtn) {
    minusBtn.addEventListener("click", () => {
      adjustRestTimer(-15);
    });
  }
}

export function triggerRestTimer(durationSeconds) {
  if (restTimer.intervalId) clearInterval(restTimer.intervalId);

  restTimer.secondsRemaining = durationSeconds;
  restTimer.originalDuration = durationSeconds;
  restTimer.isActive = true;

  const panel = document.getElementById("floating-rest-timer");
  if (panel) panel.classList.remove("hidden");

  updateTimerUI();

  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function tickRestTimer() {
  if (restTimer.secondsRemaining > 0) {
    restTimer.secondsRemaining--;
    updateTimerUI();
  } else {
    // Rest Complete Beep & Vibrations
    clearInterval(restTimer.intervalId);
    restTimer.isActive = false;
    restTimer.intervalId = null;
    updateTimerUI();

    playTimerAlert();
    const timerLabel = document.getElementById("timer-countdown");
    if (timerLabel) timerLabel.textContent = "DONE!";
  }
}

function updateTimerUI() {
  const timerLabel = document.getElementById("timer-countdown");
  const toggleBtn = document.getElementById("btn-timer-toggle");

  if (timerLabel) timerLabel.textContent = `${restTimer.secondsRemaining}s`;

  if (toggleBtn) {
    if (restTimer.isActive) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  }
}

function pauseRestTimer() {
  if (restTimer.intervalId) {
    clearInterval(restTimer.intervalId);
    restTimer.intervalId = null;
  }
  restTimer.isActive = false;
  updateTimerUI();
}

function resumeRestTimer() {
  if (restTimer.secondsRemaining <= 0) return;
  restTimer.isActive = true;
  updateTimerUI();
  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function adjustRestTimer(seconds) {
  restTimer.secondsRemaining += seconds;
  if (restTimer.secondsRemaining < 0) restTimer.secondsRemaining = 0;
  updateTimerUI();
}

function playTimerAlert() {
  // Mobile Haptic Vibration
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  // Synthesized audio beep via Web Audio API (cross-browser offline friendly)
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Play double beep
    const playBeep = (time, frequency, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, time);
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    playBeep(now, 880, 0.25); // high A tone
    playBeep(now + 0.3, 880, 0.4); // slightly longer tone
  } catch (e) {
    console.error("Error synthesizing rest timer alert sound:", e);
  }
}
