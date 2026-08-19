// tests/unit_js/modules/syncStatusGlyph.test.mjs — the header cloud's four sync states (TODO §3.11).
//
// Pure mapping, so it runs here rather than in a browser tier. What the states LOOK like belongs to
// tests/medium/test_sync_badge.py; what this pins is which state a given status is in, and the
// promises about the vocabulary itself: that every state is nameable, and that "not connected" is
// never dressed as a fault.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  SYNC_GLYPH_STATES,
  syncGlyphFor,
  syncGlyphState,
} from "../../../src/modules/common/syncStatusGlyph.js";

const connected = { configured: true, connected: true, syncing: false, lastSyncResult: null };

describe("header cloud sync glyph", () => {
  test("a connected, idle grant reads as connected", () => {
    assert.equal(syncGlyphState(connected), SYNC_GLYPH_STATES.IDLE);
  });

  test("declining cloud sync is not reported as a failure", () => {
    // PRIVACY.md tells trainers local-first is the point, so "not connected" is a supported choice.
    // Marking it as a fault would spend the warning vocabulary reserved for a real one.
    for (const status of [
      { ...connected, connected: false },
      { ...connected, configured: false },
    ]) {
      const glyph = syncGlyphFor(status);
      assert.equal(glyph.state, SYNC_GLYPH_STATES.DISCONNECTED);
      assert.notEqual(glyph.state, SYNC_GLYPH_STATES.FAILED);
    }
  });

  test("a failed sync outranks the invitation to connect", () => {
    // A trainer who connected and then failed needs the fault, not "connect your cloud".
    const failed = { ...connected, connected: false, lastSyncResult: { ok: false } };
    assert.equal(syncGlyphState(failed), SYNC_GLYPH_STATES.FAILED);
  });

  test("a sync in flight outranks the failure it may be clearing", () => {
    const retrying = { ...connected, syncing: true, lastSyncResult: { ok: false } };
    assert.equal(syncGlyphState(retrying), SYNC_GLYPH_STATES.SYNCING);
  });

  test("never having synced is not the same as having failed", () => {
    // `lastSyncResult` is null for a whole session until the first sync runs, and a falsy check
    // here would paint a warning triangle over an app that has done nothing wrong.
    assert.equal(syncGlyphState({ ...connected, lastSyncResult: null }), SYNC_GLYPH_STATES.IDLE);
    assert.equal(
      syncGlyphState({ ...connected, lastSyncResult: { ok: true } }),
      SYNC_GLYPH_STATES.IDLE,
    );
  });

  test("an absent status degrades to not-connected rather than throwing", () => {
    // renderSyncBadge runs on every save, including before Drive sync has been booted at all.
    assert.equal(syncGlyphState(), SYNC_GLYPH_STATES.DISCONNECTED);
    assert.equal(syncGlyphState({}), SYNC_GLYPH_STATES.DISCONNECTED);
  });

  test("every state can be spoken, not only shown", () => {
    // The glyph is the only sync signal in the header, and a shape with no words is unreachable on
    // touch and silent to a screen reader.
    for (const state of Object.values(SYNC_GLYPH_STATES)) {
      const glyph = syncGlyphFor(
        {
          [SYNC_GLYPH_STATES.SYNCING]: { ...connected, syncing: true },
          [SYNC_GLYPH_STATES.FAILED]: { ...connected, lastSyncResult: { ok: false } },
          [SYNC_GLYPH_STATES.DISCONNECTED]: { ...connected, connected: false },
          [SYNC_GLYPH_STATES.IDLE]: connected,
        }[state],
      );
      assert.equal(glyph.state, state);
      assert.ok(glyph.labelKey, `${state} has no translation key`);
      assert.ok(glyph.labelFallback, `${state} has no untranslated fallback`);
      assert.ok(glyph.overlayIcon.startsWith("fa-"), `${state} has no icon`);
    }
  });
});
