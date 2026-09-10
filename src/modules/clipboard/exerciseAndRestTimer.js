// src/modules/clipboard/exerciseAndRestTimer.js
// The gym-floor timer stack: one labelled countdown per client, stacked on the clipboard, with
// synthesized audio + haptic alerts. Replaces the old single floating rest timer.
//
// Design (per product requirements):
//   • Rest AND exercise timers are labelled with the CLIENT NAME + what's being timed, so a trainer
//     running several people at once can tell the stacked timers apart.
//   • Count-up (elapsed) timers: when seconds is 0 the timer counts UP from zero (a stopwatch)
//     instead of counting down — useful for warmups/cooldowns with no prescribed duration.
//   • ONE active timer per client — starting a new one for a client replaces theirs.
//   • At zero a timer does NOT stop at "DONE": it keeps counting into NEGATIVE (overtime, shown red),
//     beeping once as it crosses zero.
//   • Timers PERSIST across clipboard reloads (localStorage). Each stores its absolute end time, so
//     after a reload the remaining time is recomputed from the wall clock — elapsed time while away
//     still counts (and can already be negative).
//   • The only control is dismiss (✕); there is no pause / ±15s — a running timer just runs.
//
//   • A timer belongs to a WORKSPACE, and the clocks do not stop when the trainer steps out of one
//     (TODO §40.11). One rule covers it: **the trainer's own work always beeps, wherever they are;
//     the sandbox beeps only in the sandbox.** So a rest period does not pass unheard because
//     somebody went to look something up in the demo — that being exactly when they would — and a
//     demonstration never interrupts real work. A timer that finishes in the trainer's own work
//     while they are in the sandbox also NAMES itself, because "a timer somewhere finished" is not
//     something anybody can act on.
//
// deps: { t } (translator; the controller resolves client name/id and passes them to startTimer),
//       { onReturnToWork } (leaves the sandbox for the workspace the expired timer belongs to)

import {
  readForWorkspace,
  readVersionScoped,
  writeForWorkspace,
  writeVersionScoped,
} from "../../data/storageNamespace.js";
import { SANDBOX, WORKING, activeWorkspace } from "../../data/workspace.js";
import { openSandboxTimerDialog } from "../common/sandboxDialogs.js";
import { escapeHTML } from "../common/utils.js";

// Version-scoped: a persisted timer carries the running build's session/focus shape. Also
// workspace-scoped (TODO §40.1), which is what lets the two sets of clocks exist side by side.
const STORE_KEY = "librept_active_timers";

let deps = {};
// clientId -> timer: { clientId, clientName, label, type:'rest'|'exercise', sessionId, focusRef,
//   endTime, originalDuration, beeped,        — countdown mode (seconds > 0)
//   startTime, countUp                        — count-up mode (seconds === 0)
//   stopped, frozenSeconds                    — set once the owning exercise/circuit is finished
// }
// sessionId identifies the owning live session; focusRef (null | { type: 'exercise'|'circuit', id })
// identifies the exercise/circuit card the timer was started from, so a card click can navigate back.
// Countdown timers derive remaining from (endTime - now) and may go negative.
// Count-up timers derive elapsed from (now - startTime) and never beep.
// A stopped timer no longer ticks — it holds at frozenSeconds (whatever remaining/elapsed was at the
// moment it was stopped) — but stays in the stack, dismiss-only, until the trainer taps ✕.
let timers = {};
// The OTHER workspace's timers: ticked, never drawn. They are what makes a rest period survive the
// trainer stepping into the sandbox — the stack shows the workspace they are looking at, while the
// clocks of the one they left keep running underneath (TODO §40.11).
let otherTimers = {};
let tickIntervalId = null;
// Set once per expiry, so the card that names an expired timer is not reopened every second while
// it is on screen.
let announcing = false;

export function initRestTimer(d) {
  deps = d || {};
}

// Wire the stack's delegated dismiss control once. Restoration of persisted timers is driven by the
// session lifecycle (see restoreSessionTimers, called from recoverActiveSession).
export function setupRestTimer() {
  const stack = document.getElementById("clipboard-timer-stack");
  if (!stack) return;
  stack.addEventListener("click", (e) => {
    const card = e.target.closest(".timer-card[data-client]");
    if (!card) return;
    const clientId = card.dataset.client;
    if (e.target.closest("button[data-act='close']")) {
      closeTimer(clientId);
      return;
    }
    const timer = timers[clientId];
    if (timer && deps.onFocusTimer) deps.onFocusTimer(timer);
  });
}

// ---- lifecycle -------------------------------------------------------------------------------

// Start the timer for a client. One active timer per client, so a start button guards an existing
// one: if it still has time left (>= 0) we do NOT reset it — the card flashes a warning instead; if
// it has already run into overtime (< 0) we reset it to the new duration and blink an acknowledge.
// When seconds is 0 (or falsy) the timer runs in count-UP mode — an elapsed stopwatch with no
// target, useful for dynamic warmups and cooldowns where no countdown value is prescribed.
export function startTimer({
  clientId,
  clientName = "",
  label = "",
  type = "rest",
  seconds,
  sessionId = null,
  focusRef = null,
}) {
  if (!clientId) return;
  const countUp = !seconds || seconds <= 0;
  const existing = timers[clientId];
  if (existing && !existing.countUp && !existing.stopped && remainingOf(existing) >= 0) {
    flashCard(clientId, "flash-warning"); // still counting down — refuse to restart
    return;
  }
  if (countUp) {
    timers[clientId] = {
      clientId,
      clientName,
      label,
      type,
      sessionId,
      focusRef,
      startTime: Date.now(),
      countUp: true,
    };
  } else {
    timers[clientId] = {
      clientId,
      clientName,
      label,
      type,
      sessionId,
      focusRef,
      endTime: Date.now() + seconds * 1000,
      originalDuration: seconds,
      beeped: false,
    };
  }
  persist();
  renderStack();
  ensureTicking();
  if (existing) flashCard(clientId, "flash-ack"); // acknowledged the overtime and reset
}

// Play a brief (~1s) attention animation on a timer card without disturbing its countdown.
function flashCard(clientId, cls) {
  const card = document.querySelector(
    `#clipboard-timer-stack .timer-card[data-client="${cssEscape(clientId)}"]`,
  );
  if (!card) return;
  card.classList.remove("flash-warning", "flash-ack");
  void card.offsetWidth; // restart the animation if the same class was just applied
  card.classList.add(cls);
  setTimeout(() => card.classList.remove(cls), 1000);
}

const cssEscape = (s) =>
  window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");

export function clearAllTimers() {
  timers = {};
  persist();
  renderStack();
  // Only THIS workspace's timers were cleared. A session starting in the sandbox must not silence a
  // rest period running in the trainer's own work (TODO §40.11).
  if (allTimers().length === 0) stopTicking();
}

// Rehydrate the stack from localStorage (called when a session is recovered on reload). Each timer
// recomputes its remaining time from the stored absolute end time.
export function restoreSessionTimers() {
  timers = parseTimers(
    safely(() => readVersionScoped(STORE_KEY)),
    activeWorkspace(),
  );
  otherTimers = parseTimers(
    safely(() => readForWorkspace(STORE_KEY, otherWorkspace())),
    otherWorkspace(),
  );
  renderStack();
  ensureTicking();
}

// The workspace the trainer is NOT in. There are two, so this is a name rather than a lookup.
function otherWorkspace() {
  return activeWorkspace() === SANDBOX ? WORKING : SANDBOX;
}

function safely(read) {
  try {
    return read();
  } catch (e) {
    console.warn("Could not read timers:", e);
    return null;
  }
}

// Every timer is STAMPED with the workspace it was read out of, rather than trusting a mark inside
// the stored record: the store it came from IS the fact, and a second copy of it could disagree.
function parseTimers(raw, workspace) {
  const parsed = {};
  if (!raw) return parsed;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return parsed;
    for (const timer of list) {
      if (timer?.clientId) parsed[timer.clientId] = { ...timer, workspace };
    }
  } catch (e) {
    console.warn("Could not restore timers:", e);
  }
  return parsed;
}

/** Re-read both sets after the workspace changed under us (TODO §40.3): what was the other
 * workspace's is now the stack, and what was the stack is now ticking underneath. The interval is
 * deliberately NOT stopped — a running rest period must survive the switch that caused this. */
export function rebindTimersToWorkspace() {
  restoreSessionTimers();
}

function closeTimer(clientId) {
  delete timers[clientId];
  persist();
  renderStack();
  // The other workspace's clocks count here too: dismissing the last card on screen must not stop a
  // rest period still running in the work the trainer stepped away from (TODO §40.11).
  if (allTimers().length === 0) stopTicking();
}

// Freeze a client's timer in place — e.g. once the exercise/circuit it belongs to is marked
// finished, so a rest timer for work that's already done doesn't keep ticking (or counting into
// overtime) for a card the trainer has already moved past. Unlike closeTimer this does NOT remove
// it from the stack: the trainer still sees it (dimmed, holding its final value) and must tap ✕
// to actually dismiss it, so nothing about the session's timing history disappears silently.
export function stopTimer(clientId) {
  const timer = timers[clientId];
  if (!timer || timer.stopped) return;
  timer.frozenSeconds = timer.countUp ? elapsedOf(timer) : remainingOf(timer);
  timer.stopped = true;
  persist();
  renderStack();
  flashCard(clientId, "flash-ack");
}

// Only stop the client's active timer if it was started against this exact exercise/circuit — so
// finishing one card doesn't freeze an unrelated timer already running for something else.
export function stopTimerIfMatches(clientId, focusRef) {
  const timer = timers[clientId];
  if (!timer || !timer.focusRef || !focusRef) return;
  // "superset" is the pre-rename spelling of a circuit focus; a timer started by an older build and
  // restored from cache must still be stopped by the circuit that owns it.
  const sameType =
    timer.focusRef.type === focusRef.type ||
    [timer.focusRef.type, focusRef.type].every((t) => t === "circuit" || t === "superset");
  if (sameType && timer.focusRef.id === focusRef.id) {
    stopTimer(clientId);
  }
}

// ---- ticking ---------------------------------------------------------------------------------

const remainingOf = (timer) =>
  timer.countUp
    ? null
    : timer.stopped
      ? timer.frozenSeconds
      : Math.round((timer.endTime - Date.now()) / 1000);
const elapsedOf = (timer) =>
  timer.countUp
    ? timer.stopped
      ? timer.frozenSeconds
      : Math.round((Date.now() - timer.startTime) / 1000)
    : null;

function ensureTicking() {
  if (tickIntervalId || allTimers().length === 0) return;
  tickIntervalId = setInterval(tick, 1000);
}

const allTimers = () => [...Object.values(timers), ...Object.values(otherTimers)];
function stopTicking() {
  if (tickIntervalId) clearInterval(tickIntervalId);
  tickIntervalId = null;
}

function tick() {
  if (allTimers().length === 0) {
    stopTicking();
    return;
  }
  let crossedZero = false;
  for (const timer of Object.values(timers)) {
    if (timer.countUp) continue; // count-up timers never beep
    if (!timer.beeped && remainingOf(timer) <= 0) {
      timer.beeped = true;
      crossedZero = true;
    }
  }
  if (crossedZero) {
    persist(); // remember the beep so a reload past zero doesn't re-alert
    playTimerAlert();
  }
  tickTheOtherWorkspace();
  updateTimes();
}

// The workspace the trainer is not looking at. One rule decides what they hear (TODO §40.11): the
// trainer's OWN work beeps wherever they are and says whose rest is over; the sandbox's timers
// expire in silence while they are back at work. Either way the crossing is recorded, so returning
// does not replay an alert for a timer that finished an hour ago.
function tickTheOtherWorkspace() {
  const expired = [];
  for (const timer of Object.values(otherTimers)) {
    if (timer.countUp || timer.beeped) continue;
    if (remainingOf(timer) > 0) continue;
    timer.beeped = true;
    expired.push(timer);
  }
  if (expired.length === 0) return;
  persistOtherWorkspace();

  const fromTheirOwnWork = expired.filter((timer) => timer.workspace === WORKING);
  if (fromTheirOwnWork.length === 0 || announcing) return;
  playTimerAlert();
  announceExpiredWork(fromTheirOwnWork[0]);
}

function announceExpiredWork(timer) {
  announcing = true;
  const done = () => {
    announcing = false;
  };
  openSandboxTimerDialog({
    t: (key) => t(key, key),
    // The words a trainer can act on: whose rest, and what it was for.
    which: [timer.clientName, timer.label].filter(Boolean).join(" — "),
    onReturn: () => {
      done();
      deps.onReturnToWork?.(timer.workspace);
    },
    onDiscard: () => {
      done();
      delete otherTimers[timer.clientId];
      persistOtherWorkspace();
    },
  });
}

// ---- rendering -------------------------------------------------------------------------------

function persist() {
  try {
    writeVersionScoped(STORE_KEY, JSON.stringify(Object.values(timers)));
  } catch (e) {
    console.warn("Could not persist timers:", e);
  }
}

// Written back to the key it came out of, never to the active one — the whole point of the second
// set is that it belongs somewhere else.
function persistOtherWorkspace() {
  try {
    writeForWorkspace(STORE_KEY, otherWorkspace(), JSON.stringify(Object.values(otherTimers)));
  } catch (e) {
    console.warn("Could not persist the other workspace's timers:", e);
  }
}

function fmt(seconds) {
  const neg = seconds < 0;
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${neg ? "-" : ""}${m}:${String(s).padStart(2, "0")}`;
}

const t = (key, fallback) => (deps.t ? deps.t(key) || fallback : fallback);

function timerCardHTML(timer) {
  const isUp = timer.countUp;
  const display = isUp ? fmt(elapsedOf(timer)) : fmt(remainingOf(timer));
  const overtime = !isUp && !timer.stopped && remainingOf(timer) < 0;
  const icon = timer.stopped
    ? "fa-check"
    : timer.type === "exercise"
      ? "fa-dumbbell"
      : "fa-hourglass-half";
  const typeLabel =
    timer.label ||
    (timer.type === "exercise" ? t("exercise", "Exercise") : t("rest_label", "Rest"));
  return `
    <div class="timer-card${overtime ? " overtime" : ""}${isUp ? " count-up" : ""}${timer.stopped ? " stopped" : ""}" data-client="${escapeHTML(timer.clientId)}">
      <div class="timer-card-head">
        <span class="timer-card-label">
          <span class="timer-card-who"><i class="fa-solid ${icon}"></i> <strong>${escapeHTML(timer.clientName || "")}</strong></span>
          <span class="timer-card-type">${escapeHTML(typeLabel)}</span>
        </span>
        <button type="button" class="timer-close" data-act="close" aria-label="${t("close", "Close")}"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="timer-card-time">${display}</div>
    </div>`;
}

function renderStack() {
  const stack = document.getElementById("clipboard-timer-stack");
  if (!stack) return;
  const list = Object.values(timers);
  stack.classList.toggle("hidden", list.length === 0);
  // Remember which clients already had a visible card so we only animate new arrivals.
  const prevIds = new Set(
    [...stack.querySelectorAll(".timer-card[data-client]")].map((el) => el.dataset.client),
  );
  // Newest on top so a just-started timer is where the trainer looks.  Count-up timers use
  // startTime instead of endTime, so normalise with a fallback.
  stack.innerHTML = list
    .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
    .map(timerCardHTML)
    .join("");
  // Slide-in entrance only for cards that weren't already on screen.
  for (const card of stack.querySelectorAll(".timer-card[data-client]")) {
    if (!prevIds.has(card.dataset.client)) {
      card.classList.add("timer-card-enter");
      card.addEventListener("animationend", () => card.classList.remove("timer-card-enter"), {
        once: true,
      });
    }
  }
}

// Lightweight per-second update: only the time text + overtime state, so we don't rebuild the DOM
// every tick.
function updateTimes() {
  const stack = document.getElementById("clipboard-timer-stack");
  if (!stack) return;
  for (const card of stack.querySelectorAll(".timer-card")) {
    const timer = timers[card.dataset.client];
    if (!timer) continue;
    const timeEl = card.querySelector(".timer-card-time");
    if (timer.countUp) {
      if (timeEl) timeEl.textContent = fmt(elapsedOf(timer));
    } else {
      const rem = remainingOf(timer);
      if (timeEl) timeEl.textContent = fmt(rem);
      card.classList.toggle("overtime", rem < 0);
    }
  }
}

// ---- alerts ----------------------------------------------------------------------------------

function playTimerAlert() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
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
    playBeep(now, 880, 0.25);
    playBeep(now + 0.3, 880, 0.4);
  } catch (e) {
    console.error("Error synthesizing timer alert sound:", e);
  }
}
