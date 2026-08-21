// src/controllers/sessionFocusUrl.js — the address bar as a view of where the trainer is standing in
// the session. Single responsibility: BUILD the URL that describes the current focus (or the editor
// row), write it back when the render moves the focus, and move the focus when a card is tapped.
// Injected dependencies: `urlFor`, `toRoute`, `replaceRoute` and `activeRouteName` reach it through
// activeSessionStore.js's appDeps; the ref vocabulary is domain/sessionFocus.js.

import { focusRefForItem } from "../domain/sessionFocus.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { getEditorRowId, isClipboardEditMode } from "../modules/clipboard/editModeState.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

export function sessionFocusPath() {
  const activeSession = getActiveSession();
  if (!activeSession) return null;
  const { urlFor } = getAppDeps();
  if (!urlFor) return null;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  const ids = { sessionId: activeSession.id, clientId };
  // Edit mode is a first-class, deep-linkable state: its URL survives a reload so the trainer lands
  // back in the editor (not the live deck), and the plan edits — persisted on every keystroke — are
  // intact. The client segment names WHOSE plan is open so the right participant is restored, and the
  // row segment names the one just inserted or swapped — otherwise a reload drops the trainer into a
  // long plan with nothing saying which row they were in the middle of.
  if (isClipboardEditMode()) {
    const editorRowId = getEditorRowId();
    return editorRowId
      ? urlFor("session.edit.item", { ...ids, slotId: editorRowId })
      : urlFor("session.edit", ids);
  }
  const cs = activeSession.clientRoutines[clientId];
  const focusRef = focusRefForItem(cs?.exercises?.[cs.activeExerciseIndex]);
  if (!focusRef) return urlFor("session.client", ids);
  // Built, never spelled: the focus segment was renamed once already (superset → circuit), and a
  // hand-written path is what quietly survives the next rename as a dead link. The segment comes
  // from the same function the router resolves it back through, so the round trip cannot drift.
  return urlFor("session.focus", { ...ids, focusType: focusRef.type, focusId: focusRef.id });
}

// The session routes whose URL is the focus itself, and which the focus may therefore rewrite. A
// dialog layered over the session is NOT one of them: it named itself in the address bar, and a
// re-render behind it must not erase that.
const FOCUS_OWNED_ROUTES = ["session", "session.client", "session.focus", "session.edit"];

export function syncSessionFocusUrl() {
  if (!getActiveSession()) return;
  const { toRoute, replaceRoute, activeRouteName } = getAppDeps();
  if (!toRoute || !replaceRoute) return;
  // Asking which route is active is exact. The prefix tests below only ever excluded two paths, so
  // every later route — the plan editor's catalog picker — would have had its URL overwritten by the
  // next render.
  //
  // No active route at all means routing has not run yet: recovery renders the board at boot, ahead
  // of the first resolve. The URL is the source of truth in that window, so writing here would erase
  // the very deep link the router is about to read.
  const routeName = activeRouteName?.();
  if (!routeName) return;
  if (!FOCUS_OWNED_ROUTES.includes(routeName) && routeName !== "session.edit.item") return;
  const current = toRoute(window.location.pathname);
  if (
    !current.startsWith("/session/") ||
    current.startsWith("/session/new") ||
    current.startsWith("/session/setup/")
  )
    return;
  const target = sessionFocusPath();
  // replace, not push: the URL is catching up with the card the trainer is already looking at, and a
  // history entry per card would turn Back into an undo of their own scrolling.
  if (target) replaceRoute(target);
}

export function focusExerciseByIndex(index) {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.activeExerciseIndex = index;
  // The trainer's first tap on any deck card reveals focus for the rest of this live session — see
  // deckAllCollapsed's own comment (clientRoutines' shape, above startWorkoutSession).
  cs.deckAllCollapsed = false;
  activeSession.expandedPastId = null;
  saveActiveSessionToCache();
  renderActiveSessionBoard();
}
