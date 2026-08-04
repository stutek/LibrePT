// tests/unit_js/data/driveAppData.test.mjs
// Google Drive appDataFolder REST client (TODO §1.5/§3.3, src/data/driveAppData.js). Every call takes
// an injectable `fetchImpl`, so these pin the request SHAPE (method, URL, headers, body) against a
// stub with no real network call or access token — never against the live Drive API.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/data/driveAppData.js";

test("find sync file scopes the query to appdatafolder and the filename", async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return {
      ok: true,
      json: async () => ({ files: [{ id: "file123", modifiedTime: "2026-08-01T00:00:00Z" }] }),
    };
  };
  const file = await m.findSyncFile("tok-abc", { fetchImpl });
  assert.deepEqual(file, { id: "file123", modifiedTime: "2026-08-01T00:00:00Z" });
  assert.equal(seen.url.includes("spaces=appDataFolder"), true);
  assert.equal(seen.url.includes("q="), true);
  assert.equal(seen.options.headers.Authorization, "Bearer tok-abc");
});

test("find sync file returns null when nothing exists yet", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ files: [] }) });
  const result = await m.findSyncFile("tok", { fetchImpl });
  assert.equal(result, null);
});

test("download sync file requests alt media with bearer token", async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return { ok: true, json: async () => ({ clients: [{ id: "c1" }] }) };
  };
  const content = await m.downloadSyncFile("tok-xyz", "file123", { fetchImpl });
  assert.deepEqual(content, { clients: [{ id: "c1" }] });
  assert.equal(seen.url.endsWith("/files/file123?alt=media"), true);
  assert.equal(seen.options.headers.Authorization, "Bearer tok-xyz");
});

test("create sync file posts multipart with appdatafolder parent", async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return { ok: true, json: async () => ({ id: "new-file-id" }) };
  };
  const result = await m.createSyncFile("tok", { clients: [] }, { fetchImpl });
  assert.deepEqual(result, { id: "new-file-id" });
  assert.equal(seen.options.method, "POST");
  assert.equal(seen.url.includes("uploadType=multipart"), true);
  assert.equal(
    seen.options.headers["Content-Type"].startsWith("multipart/related; boundary="),
    true,
  );
  assert.equal(seen.options.body.includes("appDataFolder"), true);
  assert.equal(seen.options.body.includes(m.SYNC_FILENAME), true);
  assert.equal(seen.options.body.includes('"clients":[]'), true);
});

test("update sync file patches media only with json body", async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return { ok: true, json: async () => ({}) };
  };
  await m.updateSyncFile("tok", "file123", { clients: [{ id: "c1" }] }, { fetchImpl });
  assert.equal(seen.url.endsWith("/files/file123?uploadType=media"), true);
  assert.equal(seen.options.method, "PATCH");
  assert.equal(seen.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(seen.options.body), { clients: [{ id: "c1" }] });
});

test("a non ok response throws with status and url in the message", async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, text: async () => "forbidden" });
  let threw = false;
  let message = null;
  try {
    await m.findSyncFile("tok", { fetchImpl });
  } catch (e) {
    threw = true;
    message = e.message;
  }
  assert.equal(threw, true);
  assert.equal(message.includes("403"), true);
});
