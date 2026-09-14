// src/controllers/planPeekController.js — wires the plan-peek blanket gesture (TODO §52.2 step 3)
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
// A STARTED session is never left by a pull (`canOpen`): opening another session replaces the one
// clipboard slot, and a running session's logs would go with it. Uncovering still works — comparing
// is the point of the gesture; leaving is not.

import { clientSessionNeighbours, clientSessionToday } from "../domain/clientSessionNeighbours.js";
import {
  buildClientStateFromHistoryLog,
  buildClientStateFromRoutine,
} from "../domain/sessionPlanFactory.js";
import { isClipboardEditMode } from "../modules/clipboard/editModeState.js";
import { initPlanPeek } from "../modules/clipboard/planPeek.js";
import { renderPlanSheet } from "../modules/clipboard/planSheet.js";
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
      exercises: state.exercises || [],
      emptyPlanName: t("custom_empty_plan") || "Custom / Empty Plan",
    });
    return {
      items: clientState.exercises,
      feedback: [],
      title: entry.session.title || clientState.routineName,
      date: entry.date,
    };
  }
  // "history" or "draft" — both are a stored history/planning snapshot.
  const clientState = buildClientStateFromHistoryLog(entry.record, state.exercises || []);
  return {
    items: clientState.exercises,
    feedback: entry.record.feedback || [],
    title: clientState.routineName || entry.record.title || t("untitled_session") || "",
    date: entry.date,
  };
}

// The line under the header that says what releasing will do. BOTH wordings are in the markup, and
// planPeek.css shows one by the `is-release-ready` class planPeek.js toggles — so a pull crossing the
// threshold changes a class, never re-renders the layer mid-drag.
function buildReleaseLabel(restText, releaseText) {
  const label = document.createElement("div");
  label.className = "plan-peek-under-label";
  const rest = document.createElement("span");
  rest.className = "plan-peek-label-rest";
  rest.textContent = restText;
  const release = document.createElement("span");
  release.className = "plan-peek-label-release";
  release.textContent = releaseText;
  label.append(rest, release);
  return label;
}

// No next plan: a card offering to create one (approved with the prototype, 2026-09-14). It looks
// like a button but is not one — nothing under the blanket is tapped; the pull past the threshold is
// what opens the planning form.
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
  el.classList.remove("is-release-ready");

  if (!plan && when === "future") {
    el.appendChild(buildReleaseLabel(t("plan_peek_next"), t("plan_peek_release_create")));
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
    buildReleaseLabel(
      [t(when === "past" ? "plan_peek_previous" : "plan_peek_next"), date]
        .filter(Boolean)
        .join(" · "),
      [t("plan_peek_release_open"), date].filter(Boolean).join(" · "),
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
  });
  document.getElementById("btn-plan-today")?.addEventListener("click", returnToToday);
}
