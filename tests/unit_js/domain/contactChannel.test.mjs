// tests/unit_js/domain/contactChannel.test.mjs
// Reading the one contact detail a trainer was just given (src/domain/contactChannel.js, TODO §26.3).
//
// The promise: a trainer types what they were told — a number read off a screen, an address said out
// loud — and the app works out how to reach it. Getting this wrong is not cosmetic: it either opens
// the wrong app, or refuses a perfectly good number over a space.

import assert from "node:assert/strict";
import { test } from "node:test";
import { contactChannelFor, dialledForm } from "../../../src/domain/contactChannel.js";

test("a number the way people actually write one is a number", () => {
  for (const written of [
    "+386 41 234 567",
    "041 234 567",
    "041-234-567",
    "(041) 234 567",
    "+38641234567",
  ]) {
    assert.equal(contactChannelFor(written), "sms", written);
  }
});

test("an address is an address", () => {
  assert.equal(contactChannelFor("ana@example.com"), "email");
  assert.equal(contactChannelFor("  ana.novak@studio.example.si "), "email");
});

test("a line still being typed offers nowhere to send to", () => {
  // The send control is out of reach until there is somewhere to send: better than a mail app
  // opening addressed to half an address.
  for (const unfinished of ["", "   ", "ana@", "ana@example", "@example.com", "04", "ana"]) {
    assert.equal(contactChannelFor(unfinished), null, JSON.stringify(unfinished));
  }
});

test("what gets dialled keeps the international prefix and nothing else", () => {
  // A trainer who typed +386 meant it: without it the message reaches whoever holds that number in
  // the sender's own country.
  assert.equal(dialledForm("+386 41 234 567"), "+38641234567");
  assert.equal(dialledForm("(041) 234-567"), "041234567");
});
