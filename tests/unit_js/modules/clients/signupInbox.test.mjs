// tests/unit_js/modules/clients/signupInbox.test.mjs
// A submission arriving without anybody going looking for it (src/modules/clients/signupInbox.js) —
// TODO §38.22.
//
// Asked 2026-08-30: "a PWA import rabi shranjevanje datoteke iz message-a in nato odpiranje?" It did:
// save the attachment out of the messaging app, open LibrePT, open the menu, choose "Review a
// client's file", find the file in the picker. Five acts for a file already on the phone.
//
// No DOM here — the module takes the two seams of the review dialog as arguments, so what it does can
// be checked against a fake window and a fake cache. Whether the dialog then reads the submission
// correctly is signupReviewDialog's own tests.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  arrivedWithASubmission,
  receiveSharedSubmissions,
  takeSharedSubmission,
} from "../../../../src/modules/clients/signupInbox.js";

/** A window with an address, a cache the service worker may have written to, and a history. */
function fakeView({ url = "https://gym.example/LibrePT/index.html", held = null } = {}) {
  const store = new Map(held === null ? [] : [["shared-submission", held]]);
  const replaced = [];
  return {
    location: { href: url },
    history: {
      replaceState: (_state, _title, next) => replaced.push(next),
    },
    caches: {
      open: async () => ({
        match: async (key) => {
          const value = store.get(key);
          return value === undefined ? undefined : { text: async () => value };
        },
        delete: async (key) => store.delete(key),
      }),
    },
    replaced,
    store,
  };
}

const FILE = '{"v":1,"name":"Ana Novak"}';

test("a page opened normally is not carrying a submission", () => {
  assert.equal(arrivedWithASubmission(fakeView()), false);
});

test("the address says when a share landed here", () => {
  const view = fakeView({ url: "https://gym.example/LibrePT/index.html?open=signup" });
  assert.equal(arrivedWithASubmission(view), true);
});

test("the submission is taken OUT of the inbox as it is read", async () => {
  // The marker survives a reload, so a submission left in the inbox would re-open the dialog every
  // time the trainer refreshed — a box they have to dismiss again and again.
  const view = fakeView({ held: FILE });

  assert.equal(await takeSharedSubmission(view), FILE);
  assert.equal(await takeSharedSubmission(view), null);
});

test("a share opens the review with what was shared", async () => {
  const view = fakeView({ url: "https://gym.example/LibrePT/?open=signup", held: FILE });
  const opened = [];
  const read = [];

  const handled = await receiveSharedSubmissions({
    openReview: () => opened.push(true),
    reviewText: (text) => read.push(text),
    view,
  });

  assert.equal(handled, true);
  assert.deepEqual(opened, [true]);
  assert.deepEqual(read, [FILE]);
});

test("the marker is cleared once the submission has been taken", async () => {
  const view = fakeView({ url: "https://gym.example/LibrePT/?open=signup", held: FILE });

  await receiveSharedSubmissions({ openReview: () => {}, reviewText: () => {}, view });

  assert.equal(view.replaced.length, 1, "the address is rewritten once");
  assert.ok(!view.replaced[0].includes("open=signup"), view.replaced[0]);
});

test("an empty inbox opens nothing", async () => {
  // The address can say a share happened while the cache says otherwise — a second tab, a cleared
  // storage, a browser that refuses it. Opening an empty dialog would be the app inventing an event.
  const view = fakeView({ url: "https://gym.example/LibrePT/?open=signup" });
  let opened = 0;

  const handled = await receiveSharedSubmissions({
    openReview: () => {
      opened += 1;
    },
    reviewText: () => {},
    view,
  });

  assert.equal(handled, false);
  assert.equal(opened, 0);
});

test("a browser with no cache storage falls through rather than throwing", async () => {
  // Private windows and blocked site data. The menu's file picker is still there, which is the whole
  // reason it stays (§38.22).
  const view = { location: { href: "https://gym.example/LibrePT/?open=signup" }, history: {} };

  assert.equal(await takeSharedSubmission(view), null);
  assert.equal(
    await receiveSharedSubmissions({ openReview: () => {}, reviewText: () => {}, view }),
    false,
  );
});

test("a file the operating system hands over opens the same review", async () => {
  // The other arrival: the trainer taps the .json itself. It comes through launchQueue rather than
  // as a POST, and may arrive after boot has finished — so the consumer is registered whatever the
  // address says.
  const view = fakeView();
  let consumer = null;
  view.launchQueue = {
    setConsumer: (fn) => {
      consumer = fn;
    },
  };
  const read = [];

  await receiveSharedSubmissions({
    openReview: () => {},
    reviewText: (text) => read.push(text),
    view,
  });
  assert.ok(consumer, "nothing registered for a tapped file");

  await consumer({ files: [{ getFile: async () => ({ text: async () => FILE }) }] });
  assert.deepEqual(read, [FILE]);
});
