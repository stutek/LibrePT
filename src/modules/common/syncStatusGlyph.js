// src/modules/common/syncStatusGlyph.js
// Single responsibility: turn a Drive sync status into the header cloud icon's vocabulary — which
// glyph sits over the cloud, which state class it carries, and what that state is CALLED
// (TODO §3.11).
//
// **Pure on purpose.** It touches no DOM, so the four states can be pinned in tests/unit_js/ without
// a browser, and applicationHeader.js is left with nothing but the rendering. The four are
// deliberately exhaustive and ordered: a sync in flight outranks the failure it may be clearing, and
// a failure outranks "not connected" because a trainer who connected and then failed needs the
// fault, not the invitation.
//
// **"Not connected" now reads as unhealthy** (TODO §28.8, the maintainer's ruling on 2026-08-18).
// It used to be deliberately muted: PRIVACY.md makes local-first a supported choice, so declining
// cloud sync is no fault. In practice that produced a line nobody read as a problem, while the state
// it described — every client record in one evictable place — is worth seeing across a gym. The
// slashed cloud keeps its own name and label and takes warning amber; danger red stays reserved for
// a sync that actually FAILED, so the ladder still has two distinct rungs.
//
// **Every state also carries a LABEL**, not just a colour and a shape. A glyph alone is a hover
// tooltip's problem in another costume: unreachable on touch, and invisible to
// a screen reader. applicationHeader.js resolves the key and puts it in the button's aria-label.
//
// Injected dependencies: none — a pure mapping over the object driveSyncStatus() returns.

export const SYNC_GLYPH_STATES = Object.freeze({
  SYNCING: "syncing",
  FAILED: "failed",
  DISCONNECTED: "disconnected",
  IDLE: "idle",
});

const GLYPHS = Object.freeze({
  [SYNC_GLYPH_STATES.SYNCING]: {
    // fa-spin rather than a hand-rolled keyframe: this is transient motion representing work
    // actually happening, and Font Awesome's own stylesheet already cuts it to a single 1ms
    // iteration under `prefers-reduced-motion: reduce`, so the guard cannot drift out of sync with
    // the animation it guards.
    overlayIcon: "fa-solid fa-arrows-rotate fa-spin",
    stateClass: "is-syncing",
    labelKey: "drive_sync_syncing",
    labelFallback: "Syncing…",
  },
  [SYNC_GLYPH_STATES.FAILED]: {
    overlayIcon: "fa-solid fa-triangle-exclamation",
    stateClass: "is-failed",
    labelKey: "drive_sync_glyph_failed",
    labelFallback: "Last sync failed",
  },
  [SYNC_GLYPH_STATES.DISCONNECTED]: {
    overlayIcon: "fa-solid fa-slash",
    stateClass: "is-disconnected",
    labelKey: "drive_sync_glyph_disconnected",
    labelFallback: "Cloud sync not connected",
  },
  [SYNC_GLYPH_STATES.IDLE]: {
    overlayIcon: "fa-solid fa-arrows-rotate",
    stateClass: "is-idle",
    labelKey: "drive_sync_glyph_idle",
    labelFallback: "Cloud sync connected",
  },
});

/** Which of the four states a status object is in. Exported for tests and for callers that need the
 * state without the glyph (tap-to-sync asks whether a tap should sync or open the dialog). */
export function syncGlyphState({ configured, connected, syncing, lastSyncResult } = {}) {
  if (syncing) return SYNC_GLYPH_STATES.SYNCING;
  // `ok === false` specifically, not a falsy check: `lastSyncResult` is null before the first sync
  // of a session, and a session that has not synced YET has not failed.
  if (lastSyncResult?.ok === false) return SYNC_GLYPH_STATES.FAILED;
  if (!configured || !connected) return SYNC_GLYPH_STATES.DISCONNECTED;
  return SYNC_GLYPH_STATES.IDLE;
}

/** `{ state, overlayIcon, stateClass, labelKey, labelFallback }` for a driveSyncStatus() object. */
export function syncGlyphFor(status) {
  const state = syncGlyphState(status);
  return { state, ...GLYPHS[state] };
}
