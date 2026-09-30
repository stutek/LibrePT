// src/controllers/planPeekController.js — wires the plan-peek blanket gesture (step 3)
// to the active session: works out the active client's previous and next plan, draws each with
// renderPlanSheet into the under-layer elements activeSessionOverlayView.js reserves for them, and
// hands the DOM-only gesture in modules/clipboard/planPeek.js the two elements plus an edit-mode
// guard. Injected/imported the way every controller here is: state and t come through
// activeSessionStore.js's appDeps, buildCircuitUnits from sessionCircuits.js (planSheet.js cannot
// import it directly — it sits a layer above modules/clipboard).
//
// Rendering runs on every board render (called from activeSessionController.js's
// renderActiveGroupBoard, right after activeSessionBoard.js paints), not only when a gesture
// starts: the trainer must never begin a hold and watch the sheets populate underneath them. The
// gesture itself is wired ONCE per overlay mount — `initPlanPeek` is idempotent — but the sheets it
// reveals are always the latest client/plan.
//
// Step 4 — opening what the pull uncovered, through the app's EXISTING entry points only:
// - a previous/next plan opens by its route, `session.client` (`/session/:sessionId/client/:clientId`),
//   the same URL every other way into a session writes. The router's showSessionView then picks the
//   loader by what the id names: a scheduled row goes through launchClipboardDirectly, a history
//   record AND a planning draft through openSessionFromHistory (drafts live in state.history, and that
//   is how the History view and the notification feed reopen one).
// - no next plan: the create-a-plan card opens the client's planning form, the flow the client card's
//   "Plan Program" button opens (`openPlanningForClient`, injected by app.js).
// - Today: the client's session today, derived by clientSessionToday from the same history and
//   schedule — no separate "launched today" record to fall out of step.
// A STARTED session is never left by the gesture (`canOpen`): opening another session replaces the one
// clipboard slot, and a running session's logs would go with it. Uncovering still works — comparing
// is the point of the gesture; leaving is not.

import { libraryExercises } from "../data/exerciseLibrary.js";
import { clientSessionNeighbours, clientSessionToday } from "../domain/clientSessionNeighbours.js";
import { isRestRecord } from "../domain/sessionItemRecord.js";
import {
  buildClientStateFromHistoryLog,
  buildClientStateFromRoutine,
} from "../domain/sessionPlanFactory.js";
import { isClipboardEditMode } from "../modules/clipboard/editModeState.js";
import { initPlanPeek } from "../modules/clipboard/planPeek.js";
import { planSheetKey, renderPlanSheet } from "../modules/clipboard/planSheet.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";
import { buildCircuitUnits } from "./sessionCircuits.js";

// Where the drag anchors from: the scheduled session's own start (a live/upcoming session) or,
// failing that, the clipboard's own start time (a session opened straight from history, which
// carries no sourceSession) — either way `id` only needs to differ from a draft this isn't.
function anchorFor(activeSession) {
  const sourceSession = activeSession?.sourceSession;
  const date =
    sourceSession?.startDate ||
    (activeSession?.startTime ? new Date(activeSession.startTime).toISOString() : "");
  return { date, id: sourceSession?.id || activeSession?.id || null };
}

// One neighbour entry (clientSessionNeighbours.js's `{kind, id, date, record|session}`) normalised
// into what renderPlanSheet + the under-layer header need. Returns null for an empty side.
function planFor(entry, { state, t }) {
  if (!entry) return null;
  if (entry.kind === "session") {
    const clientState = buildClientStateFromRoutine({
      routineId: entry.session.routineId,
      routines: state.routines || [],
      exercises: libraryExercises(state),
      emptyPlanName: t("custom_empty_plan") || "Empty plan, no routine",
    });
    return {
      items: clientState.exercises,
      feedback: [],
      title: entry.session.title || clientState.routineName,
      date: entry.date,
    };
  }
  // "history" or "draft" — both are a stored history/planning snapshot.
  const clientState = buildClientStateFromHistoryLog(entry.record, libraryExercises(state));
  return {
    items: clientState.exercises,
    feedback: entry.record.feedback || [],
    title: clientState.routineName || entry.record.title || t("untitled_session") || "",
    date: entry.date,
  };
}

// The line under the header: which plan this is while the trainer is only looking, and what the
// upward stroke will do once the pull has uncovered enough of it. BOTH wordings are in the markup,
// and planPeek.css shows one by the `is-open-ready` class planPeek.js toggles — so arming the
// gesture changes a class, never re-renders the layer mid-drag.
function buildUnderLabel(restText, openText) {
  const label = document.createElement("div");
  label.className = "plan-peek-under-label";
  const rest = document.createElement("span");
  rest.className = "plan-peek-label-rest";
  rest.textContent = restText;
  const open = document.createElement("span");
  open.className = "plan-peek-label-open";
  open.textContent = openText;
  label.append(rest, open);
  return label;
}

// No next plan: a card offering to create one (approved with the prototype, 2026-09-14). It looks
// like a button but is not one — nothing under the blanket is tapped; the upward stroke after the
// pull is what opens the planning form.
function buildCreateCard(clientName, t) {
  const card = document.createElement("div");
  card.className = "plan-peek-create-card";
  const text = document.createElement("strong");
  text.textContent = t("plan_peek_no_next").replace("{client}", clientName);
  const cell = document.createElement("span");
  cell.className = "plan-peek-create-cell";
  cell.textContent = t("plan_peek_create");
  card.append(text, cell);
  return card;
}

function isoDay(date) {
  return date ? String(date).slice(0, 10) : "";
}

// Which movement the trainer is standing at, as a comparison key — read from the SESSION, never from
// the deck's DOM: the active exercise is state, and the card that shows it is one rendering of that
// state. Returns "" for a rest, which names no movement to line anything up with.
function focusedExerciseKey(activeSession, clientId) {
  const clientState = activeSession.clientRoutines?.[clientId];
  const item = clientState?.exercises?.[clientState?.activeExerciseIndex];
  return item && !isRestRecord(item) ? planSheetKey(item.name) : "";
}

// Slide the uncovered plan until the SAME movement sits level with the card in focus (Simon,
// 2026-09-30). Without this the neighbour opens at its own top, and "what did they lift last time"
// — the number read most often on the gym floor — could be anywhere on the sheet relative to the
// exercise asking the question.
//
// The offset is measured, so it rides on a custom property, the one thing docs/ARCHITECTURE.md's
// "look lives only in CSS" carves out for a runtime number (`--plan-pull` in planPeek.js is the
// same case). planPeek.css owns what the property DOES.
//
// No matching movement, no rest to align to, or nothing rendered yet: the offset is cleared and the
// sheet shows from its top, as it always did.
function alignSheetToFocus(el, key) {
  const sheet = el?.querySelector(".plan-sheet");
  if (!sheet) return;
  const row = key
    ? sheet.querySelector(`.plan-sheet-row[data-exercise-name="${CSS.escape(key)}"]`)
    : null;
  const card = document.querySelector(
    "#active-exercise-scroll-deck .exercise-deck-card.is-active, #active-exercise-scroll-deck .exercise-deck-card.in-focus",
  );
  if (!row || !card) {
    sheet.style.removeProperty("--peek-align");
    return;
  }
  // Both boxes are read with the sheet already offset by whatever it carried, so the shift is
  // measured from where the row IS rather than from where it started.
  const current = Number.parseFloat(sheet.style.getPropertyValue("--peek-align")) || 0;
  const shift = card.getBoundingClientRect().top - row.getBoundingClientRect().top;
  sheet.style.setProperty("--peek-align", `${Math.round(current + shift)}px`);
}

// The neighbour's own title bar + tab (ruled 2026-09-14: "the plan underneath shows its own").
// Built with createElement/textContent throughout — a routine or plan title is trainer-authored
// text (docs/ARCHITECTURE.md "UI invariants": no innerHTML from user text).
function buildUnderHeader(plan, clientName) {
  const head = document.createElement("div");
  head.className = "plan-peek-under-head";

  const title = document.createElement("strong");
  title.className = "plan-peek-under-title";
  title.textContent = plan.title || "";
  head.appendChild(title);

  const meta = document.createElement("span");
  meta.className = "plan-peek-under-meta";
  // ISO date everywhere (AGENT_RULES.md "Product constraints"), never a locale-formatted string.
  meta.textContent = [isoDay(plan.date), clientName].filter(Boolean).join(" · ");
  head.appendChild(meta);

  const tab = document.createElement("span");
  tab.className = "plan-peek-under-tab";
  tab.textContent = clientName || "";
  head.appendChild(tab);

  return head;
}

function renderUnderLayer(el, entry, { clientId, clientName, when, appDeps }) {
  if (!el) return;
  const { t } = appDeps;
  el.textContent = "";
  const plan = planFor(entry, appDeps);
  el.classList.toggle("has-plan", !!plan);
  el.classList.toggle("has-create-card", !plan && when === "future");
  el.classList.remove("is-open-ready");

  if (!plan && when === "future") {
    el.appendChild(buildUnderLabel(t("plan_peek_next"), t("plan_peek_up_create")));
    el.appendChild(buildCreateCard(clientName, t));
    return;
  }
  if (!plan) {
    const empty = document.createElement("p");
    empty.className = "plan-peek-under-empty";
    empty.textContent = t("plan_peek_no_previous");
    el.appendChild(empty);
    return;
  }

  el.appendChild(buildUnderHeader(plan, clientName));
  const date = isoDay(plan.date);
  el.appendChild(
    buildUnderLabel(
      [t(when === "past" ? "plan_peek_previous" : "plan_peek_next"), date]
        .filter(Boolean)
        .join(" · "),
      [t("plan_peek_up_open"), date].filter(Boolean).join(" · "),
    ),
  );
  el.appendChild(
    renderPlanSheet({
      items: plan.items,
      feedback: plan.feedback,
      clientId,
      when,
      t: appDeps.t,
      buildCircuitUnits,
    }),
  );
}

/** Redraws the previous/next plan sheets for whichever client is on screen. Safe to call whenever
 *  the board renders, whether or not the blanket gesture is wired yet — no-ops when either the
 *  session or the under-layer elements are missing (edit mode still renders them: only the DRAG is
 *  disabled while editing, so leaving stale sheets underneath would show yesterday's plan next to
 *  today's mid-edit). */
export function refreshPlanPeek() {
  const activeSession = getActiveSession();
  const pastEl = document.getElementById("plan-peek-under-past");
  const futureEl = document.getElementById("plan-peek-under-future");
  if (!activeSession || !pastEl || !futureEl) return;
  const appDeps = getAppDeps();
  const { state } = appDeps;
  if (!state) return;

  const clientId = activeClientOf(activeSession);
  const client = (state.clients || []).find((c) => c.id === clientId);
  const clientName = client ? client.name : "";
  const { previous, next } = clientSessionNeighbours(state, clientId, anchorFor(activeSession));

  renderUnderLayer(pastEl, previous, { clientId, clientName, when: "past", appDeps });
  renderUnderLayer(futureEl, next, { clientId, clientName, when: "future", appDeps });
  refreshTodayButton(activeSession, clientId, state);

  // Alignment is NOT done here. It is geometry, and at render time the deck has not finished
  // placing its cards — it scrolls the active one into view a tenth of a second later, which left
  // the peek 12px out. It is measured when the peek begins instead (`onPeekBegin`).
}

function activeClientOf(activeSession) {
  return activeSession.activeClientId || activeSession.participants[0];
}

// Is the clipboard showing this entry? A launched scheduled session carries every merged slot's id
// in sourceSession.ids (buildSessionMeta); a reopened record or draft is the record's own id.
function isShowing(activeSession, entry) {
  const source = activeSession.sourceSession;
  const ids = [activeSession.id, source?.id, ...(source?.ids || [])];
  return ids.includes(entry.id);
}

// Today shows only when there is a today to go back to and the clipboard is showing something else.
function refreshTodayButton(activeSession, clientId, state) {
  const button = document.getElementById("btn-plan-today");
  if (!button) return;
  const today = clientSessionToday(state, clientId, Date.now());
  button.classList.toggle("hidden", !today || isShowing(activeSession, today));
}

/** Line both uncovered plans up with the movement in focus. Called as the peek BEGINS, because that
 *  is when the deck has finished moving and when the layers are about to be seen. */
function alignBothSheetsToFocus() {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const key = focusedExerciseKey(activeSession, activeClientOf(activeSession));
  alignSheetToFocus(document.getElementById("plan-peek-under-past"), key);
  alignSheetToFocus(document.getElementById("plan-peek-under-future"), key);
}

function openRoute(sessionId, clientId) {
  const { navigateToPath, urlFor } = getAppDeps();
  navigateToPath?.(urlFor("session.client", { sessionId, clientId }));
}

function openNeighbour(side) {
  const activeSession = getActiveSession();
  const { state, openPlanningForClient } = getAppDeps();
  if (!activeSession || !state) return;
  const clientId = activeClientOf(activeSession);
  const { previous, next } = clientSessionNeighbours(state, clientId, anchorFor(activeSession));
  const entry = side === "past" ? previous : next;
  if (entry) openRoute(entry.id, clientId);
  else if (side === "future") openPlanningForClient?.(clientId);
}

function returnToToday() {
  const activeSession = getActiveSession();
  const { state } = getAppDeps();
  if (!activeSession || !state) return;
  const clientId = activeClientOf(activeSession);
  const today = clientSessionToday(state, clientId, Date.now());
  if (today) openRoute(today.id, clientId);
}

/** Wires the drag itself onto the blanket. Called once from setupActiveSession(); `initPlanPeek`
 *  is idempotent so a re-render never double-wires it. */
export function initPlanPeekController() {
  const blanket = document.getElementById("active-session-blanket");
  if (!blanket) return;
  initPlanPeek(blanket, {
    getUnderLayers: () => ({
      past: document.getElementById("plan-peek-under-past"),
      future: document.getElementById("plan-peek-under-future"),
    }),
    // The reorder drag in clipboardEditor.js owns the same pointer surface while editing.
    isDisabled: () => isClipboardEditMode(),
    canOpen: () => !getActiveSession()?.started,
    onOpen: openNeighbour,
    onPeekBegin: alignBothSheetsToFocus,
  });
  document.getElementById("btn-plan-today")?.addEventListener("click", returnToToday);
}
