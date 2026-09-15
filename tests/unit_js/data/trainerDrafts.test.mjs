// Draft isolation and erasure against the real storage format, without a DOM.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { clearWorkspaceKeys } from "../../../src/data/storageNamespace.js";
import {
  forgetClientDrafts,
  forgetTrainerDraft,
  readTrainerDraft,
  trainerDraftToResume,
  writeTrainerDraft,
} from "../../../src/data/trainerDrafts.js";

beforeEach(() => {
  const items = new Map();
  globalThis.localStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
});

test("the same form and subject in two workspaces keep independent drafts", () => {
  writeTrainerDraft("client:one", { values: { name: "Working" } }, "working");
  writeTrainerDraft("client:one", { values: { name: "Sandbox" } }, "sandbox");
  assert.equal(readTrainerDraft("client:one", "working").values.name, "Working");
  clearWorkspaceKeys("sandbox");
  assert.equal(readTrainerDraft("client:one", "sandbox"), null);
  assert.equal(readTrainerDraft("client:one", "working").values.name, "Working");
});

test("discarding one subject keeps the other and its recovery marker", () => {
  writeTrainerDraft("first", { values: { note: "First" } });
  writeTrainerDraft("second", { values: { note: "Second" } });
  forgetTrainerDraft("first");
  assert.equal(readTrainerDraft("first"), null);
  assert.equal(trainerDraftToResume().values.note, "Second");
});

test("erasure reaches drafts and pending backups but keeps another person's work", () => {
  writeTrainerDraft("first", {
    kind: "client",
    context: { clientId: "one" },
    values: { note: "Private" },
  });
  writeTrainerDraft("backup", { kind: "backup-review", extra: { clients: [] } });
  writeTrainerDraft("second", {
    kind: "client",
    context: { clientId: "two" },
    values: { note: "Keep" },
  });
  forgetClientDrafts("one");
  assert.equal(readTrainerDraft("first"), null);
  assert.equal(readTrainerDraft("backup"), null);
  assert.equal(readTrainerDraft("second").values.note, "Keep");
});

test("a refused write is reported to the caller instead of claiming durability", () => {
  globalThis.localStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  assert.throws(() => writeTrainerDraft("one", { values: { note: "Keep me" } }), /Quota/);
});

test("unknown draft versions are not overwritten by a newer edit", () => {
  localStorage.setItem("librept_form_drafts", JSON.stringify({ version: 99, drafts: {} }));
  assert.throws(() => writeTrainerDraft("one", { values: {} }), /Unsupported/);
  assert.equal(JSON.parse(localStorage.getItem("librept_form_drafts")).version, 99);
});
