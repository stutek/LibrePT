// tests/unit_js/modules/eventTransports.test.mjs
// How an event leaves the device (src/modules/common/eventTransports.js).
//
// The promise is that the CHOICE is honest — a transport is offered only when it could actually be
// used, and the list is never empty — and that what each one hands over is a working link. The
// platform calls are injected, so none of this needs a browser.

import assert from "node:assert/strict";
import { test } from "node:test";
import { SESSION_INVITE, decodeSessionEvent } from "../../../../src/data/sessionEventPayload.js";
import {
  EVENT_PARAM,
  availableTransports,
  buildEventLink,
  sendEvent,
} from "../../../../src/modules/common/eventTransports.js";

const BASE_URL = "https://stutek.github.io/LibrePT/";
const EVENT = { kind: SESSION_INVITE, sessionId: "s1", title: "Hypertrophy Upper" };

function fakePlatform({ canShare = false } = {}) {
  const calls = { opened: [], shared: [], copied: [] };
  return {
    calls,
    canShare: () => canShare,
    openUrl: (url) => calls.opened.push(url),
    share: (data) => calls.shared.push(data),
    writeText: (text) => calls.copied.push(text),
  };
}

const send = (id, target, platform) =>
  sendEvent(id, EVENT, {
    target,
    baseUrl: BASE_URL,
    subject: "Training session",
    message: "You are booked in",
    platform,
  });

test("a link carries the event to whoever opens it", () => {
  const link = buildEventLink(EVENT, BASE_URL);
  const carried = new URL(link).searchParams.get(EVENT_PARAM);

  assert.deepEqual(decodeSessionEvent(carried), EVENT);
});

test("a client with no phone is never offered a text message", () => {
  const offered = availableTransports({ email: "jane@librept.test" }, fakePlatform()).map(
    (transport) => transport.id,
  );

  assert.ok(!offered.includes("sms"));
  assert.ok(offered.includes("email"));
});

test("the share sheet is offered only where the device has one", () => {
  const withShare = availableTransports({}, fakePlatform({ canShare: true })).map((t) => t.id);
  const without = availableTransports({}, fakePlatform({ canShare: false })).map((t) => t.id);

  assert.ok(withShare.includes("share"));
  assert.ok(!without.includes("share"));
});

test("there is always at least one way out", () => {
  // A trainer with a link on the clipboard can reach channels none of the others can, so a surface
  // built on this list never renders empty — whatever the device and however little is on file.
  const offered = availableTransports({}, fakePlatform()).map((transport) => transport.id);

  assert.deepEqual(offered, ["copy"]);
});

test("the text message goes to the number, with the link in it", () => {
  const platform = fakePlatform();
  const link = send("sms", { phone: "+38640123456" }, platform);

  const [opened] = platform.calls.opened;
  assert.ok(opened.startsWith("sms:"));
  assert.ok(opened.includes(encodeURIComponent("+38640123456")));
  assert.ok(decodeURIComponent(opened).includes(link));
});

test("the mail compose is addressed and prefilled", () => {
  const platform = fakePlatform();
  const link = send("email", { email: "jane@librept.test" }, platform);

  const [opened] = platform.calls.opened;
  assert.ok(opened.startsWith("mailto:jane%40librept.test?"));
  assert.ok(decodeURIComponent(opened).includes("Training session"));
  assert.ok(decodeURIComponent(opened).includes(link));
});

test("the share sheet is handed the link rather than a copy of it in the text", () => {
  // `url` is the field share targets treat as a link — putting it only in `text` makes some of them
  // send an unclickable string.
  const platform = fakePlatform({ canShare: true });
  const link = send("share", {}, platform);

  // What reaches the platform IS this transport's whole contract — a transport produces no value
  // and changes no state, so there is nothing else to observe (§5.8).
  assert.equal(platform.calls.shared[0].url, link);
});

test("copying puts the link itself on the clipboard, nothing else", () => {
  const platform = fakePlatform();
  const link = send("copy", {}, platform);

  // What lands on the clipboard is the entire promise of this transport (§5.8).
  assert.deepEqual(platform.calls.copied, [link]);
});

test("an event that cannot be represented is not sent at all", () => {
  // A caller showing "sent" has to be able to tell the difference.
  const platform = fakePlatform();
  const result = sendEvent("copy", { kind: SESSION_INVITE }, { baseUrl: BASE_URL, platform });

  assert.equal(result, null);
  // The AVOIDED side effect is the behaviour (§5.8): a half-formed link on someone's clipboard is
  // worse than an obvious refusal, because they will paste it and it will not open anything.
  assert.deepEqual(platform.calls.copied, []);
});

test("an unknown transport sends nothing rather than guessing", () => {
  const platform = fakePlatform();

  assert.equal(send("carrier-pigeon", {}, platform), null);
  // The AVOIDED side effect is the behaviour (§5.8): falling back to some other channel would send
  // a client's session details somewhere the trainer did not choose.
  assert.deepEqual(platform.calls.opened, []);
});
