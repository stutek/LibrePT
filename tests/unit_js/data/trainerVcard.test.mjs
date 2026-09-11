// tests/unit_js/data/trainerVcard.test.mjs
// The trainer's own contact, as a file the client's phone can save (src/data/trainerVcard.js,
// TODO §26.3).
//
// The promise: a client who reached the intake page can put the trainer in their address book
// without copying a number off the screen. What this file must not do is produce a card a phone
// refuses to open — which is why the structure, the escaping and the line length are pinned here
// rather than left to a reader of RFC 6350.

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTrainerVcard, trainerVcardFileName } from "../../../src/data/trainerVcard.js";

/** The card as a phone reads it: folded lines joined back up, one property per entry. */
function unfoldedLines(card) {
  return card
    .replace(/\r\n[ \t]/g, "")
    .replace(/\r\n$/, "")
    .split("\r\n");
}

test("a saved card carries the name, the number and the address", () => {
  const card = buildTrainerVcard({
    name: "Sam Trainer",
    phone: "+386 40 111 222",
    email: "sam@example.com",
  });

  const lines = unfoldedLines(card);
  assert.equal(lines[0], "BEGIN:VCARD");
  assert.equal(lines[1], "VERSION:3.0");
  assert.ok(lines.includes("FN:Sam Trainer"), card);
  assert.ok(lines.includes("TEL;TYPE=CELL:+386 40 111 222"), card);
  assert.ok(lines.includes("EMAIL;TYPE=INTERNET:sam@example.com"), card);
  assert.equal(lines.at(-1), "END:VCARD");
});

test("every line ends the way the format says, or a phone opens nothing", () => {
  // RFC 6350 §3.2: CRLF, not LF. A card written with bare newlines is the single most common reason
  // a `.vcf` imports as one garbled contact or not at all.
  const card = buildTrainerVcard({ name: "Sam", phone: "040111222" });

  assert.ok(card.endsWith("END:VCARD\r\n"), JSON.stringify(card.slice(-20)));
  assert.equal(card.includes("\n\r"), false);
  assert.equal(/[^\r]\n/.test(card), false, card);
});

test("half a contact is still worth saving", () => {
  // The ordinary case is a trainer who filled in a name and a number and no address.
  const lines = unfoldedLines(buildTrainerVcard({ name: "Sam", phone: "040111222" }));

  assert.ok(lines.includes("FN:Sam"));
  assert.equal(
    lines.some((line) => line.startsWith("EMAIL")),
    false,
  );
});

test("a contact with no name is not offered at all", () => {
  // `FN` is mandatory in vCard 3.0, and a card whose only name is a phone number lands in the
  // address book as a nameless entry the client cannot find again. Nothing is better than that:
  // the number on the page is still tappable.
  assert.equal(buildTrainerVcard({ phone: "040111222" }), null);
  assert.equal(buildTrainerVcard({ name: "   " }), null);
  assert.equal(buildTrainerVcard({}), null);
  assert.equal(buildTrainerVcard(), null);
});

test("a name with punctuation in it does not break the card apart", () => {
  // §3.4 gives TEXT values the same four escapes the calendar file uses. Unescaped, a comma turns
  // one value into two and a newline ends the property early — with the rest of the card as
  // whatever the parser makes of the remains.
  const card = buildTrainerVcard({ name: "Novak, Sam; PT\nStudio\\Ljubljana", phone: "1" });

  assert.ok(card.includes("FN:Novak\\, Sam\\; PT\\nStudio\\\\Ljubljana"), card);
  assert.equal(unfoldedLines(card).length, 6, card);
});

test("a long name is folded, not truncated and not left over-long", () => {
  // §3.2 again: content lines are folded at 75 octets. Slovene letters are two octets each, so the
  // count is of bytes and the split may never fall inside one — half a character is a card a strict
  // parser rejects.
  const name = "Češkovič".repeat(12);
  const card = buildTrainerVcard({ name, phone: "040111222" });

  for (const line of card.split("\r\n")) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75, `${line.length}: ${line}`);
  }
  assert.ok(unfoldedLines(card).includes(`FN:${name}`), card);
});

test("the filename says whose card it is and can never be a path", () => {
  // The trainer's name arrives from a link fragment a stranger can edit, and this string becomes a
  // file on the client's own phone — the same rule the submission file is written under.
  assert.equal(trainerVcardFileName({ name: "Sam Trainer" }), "sam-trainer.vcf");
  assert.equal(trainerVcardFileName({ name: "../../etc/passwd" }), "etc-passwd.vcf");
  assert.equal(trainerVcardFileName({}), "trainer.vcf");
});
