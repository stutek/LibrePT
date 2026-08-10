// tests/live/driveAppData.live.test.mjs — the real src/data/driveAppData.js against the real Google
// Drive API, with a real token (TODO §1.5/§3.3).
//
// **This imports the production module, not a reimplementation of it.** Node 18+ ships a global
// `fetch`, and every function in driveAppData.js takes `fetchImpl` defaulting to exactly that — so
// omitting the injection is all it takes to point the shipping code at the live API. A hand-written
// HTTP client here would test the test, which is the failure mode this tier exists to avoid.
//
// **What this covers that tests/unit_js/data/driveAppData.test.mjs cannot.** That suite pins request
// SHAPE against a stub and catches every regression WE can cause; it cannot see Google changing
// something — an endpoint deprecated, a scope reclassified, `appDataFolder` semantics altered,
// multipart upload growing a new requirement. Those move on Google's schedule, uncorrelated with our
// pushes, which is why this runs as a scheduled canary rather than a deploy gate.
//
// **Idempotent by construction, so there is nothing to clean up.** It drives the same
// find → create-if-absent → update → download round trip the app performs, against the same single
// `SYNC_FILENAME`, so a thousand runs leave exactly one file behind. `appDataFolder` is invisible in
// the account's Drive UI and scoped to this OAuth client, so that file is unreachable by anything
// else — a delete step would add a failure mode (a half-cleaned run breaking the next one) to buy
// nothing.

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import {
  createSyncFile,
  downloadSyncFile,
  findSyncFile,
  updateSyncFile,
} from "../../src/data/driveAppData.js";
import { resolveAccessToken, skipReason } from "./_credentials.mjs";

const accessToken = await resolveAccessToken();

describe("Drive appDataFolder round trip", { skip: skipReason(accessToken) }, () => {
  let fileId = null;

  before(async () => {
    const existing = await findSyncFile(accessToken);
    fileId = existing?.id ?? (await createSyncFile(accessToken, { probe: "initial" })).id;
    assert.ok(fileId, "expected a sync file id after find-or-create");
  });

  test("an updated file downloads back byte-for-byte", async () => {
    // A per-run marker, so a stale read from a previous run can never masquerade as a fresh write.
    const written = { probe: `live-${Date.now()}`, records: [{ id: "c1", name: "Live Probe" }] };
    await updateSyncFile(accessToken, fileId, written);
    assert.deepEqual(await downloadSyncFile(accessToken, fileId), written);
  });

  test("the file is discoverable by name within appDataFolder", async () => {
    const found = await findSyncFile(accessToken);
    assert.equal(found?.id, fileId);
    // modifiedTime is what driveSyncService's conflict detection reads; assert Google still sends it.
    assert.match(found.modifiedTime, /^\d{4}-\d{2}-\d{2}T/);
  });

  after(async () => {
    // Leave the file in a recognisable state for anyone opening the account to debug a red canary.
    if (fileId) await updateSyncFile(accessToken, fileId, { probe: "idle", records: [] });
  });
});
