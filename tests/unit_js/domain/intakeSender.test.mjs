// tests/unit_js/domain/intakeSender.test.mjs
// Who an intake link says it came from (src/domain/intakeSender.js, TODO §26.3).
//
// The promise is modest and worth stating exactly: this gives the person receiving a link something
// to CHECK — the name in the message, the name on the page and the person they just spoke to should
// all agree — and it never claims to prove anything. Everything read back is a stranger's text.

import assert from "node:assert/strict";
import { test } from "node:test";
import { senderFragment, senderFromFragment } from "../../../src/domain/intakeSender.js";

test("what the trainer typed survives the trip to the client's phone", () => {
  const link = senderFragment({ name: "Sam Trainer", phone: "+386 40 111 222" });

  assert.deepEqual(senderFromFragment(link), {
    name: "Sam Trainer",
    phone: "+386 40 111 222",
    email: "",
  });
});

test("it rides in the fragment, which no server ever sees", () => {
  // The trainer's own number is personal data, and a query string lands in access logs and in the
  // Referer of anything the page links to. A `#` goes nowhere.
  const link = senderFragment({ name: "Sam", phone: "040111222" });

  assert.ok(link.startsWith("#"), link);
});

test("an install that does not know the trainer says nothing at all", () => {
  // Rather than "sent by —", which looks like something was checked.
  assert.equal(senderFragment({}), "");
  assert.equal(senderFragment({ name: "  ", phone: "" }), "");
  assert.equal(senderFromFragment("#lang=sl"), null);
  assert.equal(senderFromFragment(""), null);
});

test("half a signature is still worth showing", () => {
  // A trainer who filled in a name but no number is the ordinary case: the name alone is still
  // something the reader can compare.
  assert.deepEqual(senderFromFragment(senderFragment({ name: "Sam" })), {
    name: "Sam",
    phone: "",
    email: "",
  });
});

test("a crafted link cannot push the page around", () => {
  // The fragment is part of a URL anybody can edit, so it is hostile input: it is displayed, never
  // trusted, and it is capped so a wall of text cannot bury what the page itself says.
  const long = senderFromFragment(
    senderFragment({ name: "A".repeat(500), phone: "9".repeat(200) }),
  );

  assert.ok(long.name.length <= 80, long.name.length);
  assert.ok(long.phone.length <= 40, long.phone.length);
});

test("the address travels too, so the saved contact is worth saving", () => {
  // Added 2026-09-11: the client often never sees the trainer's number at all — an invitation sent
  // by email, forwarded, or shared through an app that keeps the link and drops the text. The page
  // is then the only place the contact appears, and a contact without an address is half of one.
  const link = senderFragment({
    name: "Sam Trainer",
    phone: "+386 40 111 222",
    email: "sam@example.com",
  });

  assert.deepEqual(senderFromFragment(link), {
    name: "Sam Trainer",
    phone: "+386 40 111 222",
    email: "sam@example.com",
  });
});

test("a link sent before the address rode along still reads", () => {
  // Two-part fragments are in messages already sent, and a link stops working the day it is opened,
  // not the day it is written.
  assert.deepEqual(senderFromFragment("#from=Sam%20Trainer%7C040111222"), {
    name: "Sam Trainer",
    phone: "040111222",
    email: "",
  });
});
