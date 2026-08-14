// tests/unit_js/data/calendarFreeBusy.test.mjs
// Google Calendar freeBusy client (TODO §1.3/§1.5, src/data/calendarFreeBusy.js).
//
// The promise worth pinning is not "it parses JSON" — it is that a room whose calendar could not be
// read never comes back looking free. Google reports that failure per-calendar inside an HTTP 200,
// so the tempting shape (return busy arrays, ignore the rest) produces an occupied room drawn as
// available, and a trainer booking on top of someone else's session.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CalendarApiError,
  GOOGLE_CALENDAR_FREEBUSY_SCOPE,
  queryFreeBusy,
} from "../../../src/data/calendarFreeBusy.js";
import { isAuthFailure } from "../../../src/data/googleApiError.js";

const RANGE = { timeMin: "2026-08-14T00:00:00Z", timeMax: "2026-08-21T00:00:00Z" };

function stubFetch(payload, { ok = true, status = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    };
  };
  return { fetchImpl, calls };
}

test("busy intervals come back per calendar", async () => {
  const { fetchImpl } = stubFetch({
    calendars: {
      "room-a": { busy: [{ start: "2026-08-14T09:00:00Z", end: "2026-08-14T10:00:00Z" }] },
    },
  });
  const result = await queryFreeBusy("tok", { calendarIds: ["room-a"], ...RANGE }, { fetchImpl });
  assert.deepEqual(result.busyByCalendar["room-a"], [
    { start: "2026-08-14T09:00:00Z", end: "2026-08-14T10:00:00Z" },
  ]);
  assert.deepEqual(result.unreadable, []);
});

test("a calendar reporting errors is unreadable, not free", async () => {
  const { fetchImpl } = stubFetch({
    calendars: {
      "room-a": { busy: [] },
      "room-b": { errors: [{ reason: "notFound" }] },
    },
  });
  const result = await queryFreeBusy(
    "tok",
    { calendarIds: ["room-a", "room-b"], ...RANGE },
    { fetchImpl },
  );
  assert.deepEqual(result.unreadable, [{ calendarId: "room-b", reason: "notFound" }]);
  assert.equal(
    "room-b" in result.busyByCalendar,
    false,
    "an unreadable room must not read as free",
  );
});

test("one unreadable calendar does not blank the others", async () => {
  // Google answers a partial failure with 200 and a per-calendar errors array. Treating that as a
  // failed request would drop every room's shading because one room was not shared with us.
  const { fetchImpl } = stubFetch({
    calendars: {
      "room-a": { busy: [{ start: "2026-08-14T09:00:00Z", end: "2026-08-14T10:00:00Z" }] },
      "room-b": { errors: [{ reason: "notFound" }] },
    },
  });
  const result = await queryFreeBusy(
    "tok",
    { calendarIds: ["room-a", "room-b"], ...RANGE },
    { fetchImpl },
  );
  assert.equal(result.busyByCalendar["room-a"].length, 1);
  assert.equal(result.unreadable.length, 1);
});

test("a requested calendar Google omits entirely is unreadable, not free", async () => {
  const { fetchImpl } = stubFetch({ calendars: { "room-a": { busy: [] } } });
  const result = await queryFreeBusy(
    "tok",
    { calendarIds: ["room-a", "room-ghost"], ...RANGE },
    { fetchImpl },
  );
  assert.deepEqual(result.unreadable, [{ calendarId: "room-ghost", reason: "notInResponse" }]);
});

test("a readable but idle calendar is free, not unreadable", async () => {
  // The other half of the distinction: an empty busy array is a real answer and must not be
  // confused with not having got one.
  const { fetchImpl } = stubFetch({ calendars: { "room-a": { busy: [] } } });
  const result = await queryFreeBusy("tok", { calendarIds: ["room-a"], ...RANGE }, { fetchImpl });
  assert.deepEqual(result.busyByCalendar["room-a"], []);
  assert.deepEqual(result.unreadable, []);
});

test("every requested calendar is asked for in one request", async () => {
  // Batching is the point of freeBusy — one round trip for the whole occupancy view rather than one
  // per room, which on a gym's worth of rooms is the difference between a view and a stall.
  const { fetchImpl, calls } = stubFetch({ calendars: {} });
  await queryFreeBusy("tok", { calendarIds: ["room-a", "room-b"], ...RANGE }, { fetchImpl });
  assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body.items, [{ id: "room-a" }, { id: "room-b" }]);
  assert.equal(body.timeMin, RANGE.timeMin);
  assert.equal(body.timeMax, RANGE.timeMax);
});

test("no calendars means no request at all", async () => {
  const { fetchImpl, calls } = stubFetch({ calendars: {} });
  const result = await queryFreeBusy("tok", { calendarIds: [], ...RANGE }, { fetchImpl });
  assert.equal(calls.length, 0, "an empty room list must not cost a round trip");
  assert.deepEqual(result, { busyByCalendar: {}, unreadable: [] });
});

test("a dead grant surfaces as an auth failure the caller can act on", async () => {
  // 401 means reconnect and nothing else will fix it — the same predicate the Drive client uses,
  // which is why it lives in googleApiError.js rather than being written twice.
  const { fetchImpl } = stubFetch({ error: "invalid credentials" }, { ok: false, status: 401 });
  await assert.rejects(
    () => queryFreeBusy("tok", { calendarIds: ["room-a"], ...RANGE }, { fetchImpl }),
    (error) => {
      assert.ok(error instanceof CalendarApiError);
      assert.equal(isAuthFailure(error), true);
      return true;
    },
  );
});

test("the scope stays the narrowest one Google publishes", () => {
  // Widening this to `calendar` or `calendar.events` would make every trainer's session titles and
  // client names readable by anyone holding a room-calendar grant (TODO §1.5).
  assert.equal(GOOGLE_CALENDAR_FREEBUSY_SCOPE, "https://www.googleapis.com/auth/calendar.freebusy");
});
