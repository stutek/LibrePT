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

import { clientSessionNeighbours } from "../domain/clientSessionNeighbours.js";
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
  meta.textContent = [plan.date ? plan.date.slice(0, 10) : "", clientName]
    .filter(Boolean)
    .join(" · ");
  head.appendChild(meta);

  const tab = document.createElement("span");
  tab.className = "plan-peek-under-tab";
  tab.textContent = clientName || "";
  head.appendChild(tab);

  return head;
}

function renderUnderLayer(el, entry, { clientId, clientName, when, appDeps }) {
  if (!el) return;
  el.textContent = "";
  const plan = planFor(entry, appDeps);
  el.classList.toggle("has-plan", !!plan);
  if (!plan) return;

  el.appendChild(buildUnderHeader(plan, clientName));
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

  const clientId = activeSession.activeClientId || activeSession.participants[0];
  const client = (state.clients || []).find((c) => c.id === clientId);
  const clientName = client ? client.name : "";
  const { previous, next } = clientSessionNeighbours(state, clientId, anchorFor(activeSession));

  renderUnderLayer(pastEl, previous, { clientId, clientName, when: "past", appDeps });
  renderUnderLayer(futureEl, next, { clientId, clientName, when: "future", appDeps });
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
  });
}
