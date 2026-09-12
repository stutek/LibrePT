// tests/unit_js/data/demoText.test.mjs
// The demo data's own words (src/data/demoText.js), and the one property the whole approach rests
// on: a demo string with no translation must come back as itself, never as a blank or a key.
//
// The dictionary is keyed by the seed's English text rather than by a name, so the risk is a
// mismatch nobody notices — a seed string edited by one character stops matching and silently ships
// English inside a Slovenian demo. `every seeded string a trainer reads has a Slovenian form` walks
// the actual seed modules and fails when that happens, which is the only place it can be caught
// cheaply.

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CLIENTS } from "../../../src/data/clients.js";
import { DEMO_TEXT, localiseDemoText } from "../../../src/data/demoText.js";
import { DEFAULT_PLAN_UPDATES } from "../../../src/data/planUpdates.js";
import { DEFAULT_ROUTINES } from "../../../src/data/routines.js";
import { DEFAULT_SESSIONS } from "../../../src/data/sessions.js";

test("a translated demo string comes back in the chosen language", () => {
  assert.equal(localiseDemoText("Morning Conditioning", "sl"), "Jutranja kondicija");
  assert.equal(localiseDemoText("city park", "sl"), "mestni park");
});

test("anything without a translation is left exactly as it is", () => {
  // English is the seed's own language, so it has no table at all — and a language the app does not
  // speak must not blank the demo out either.
  assert.equal(localiseDemoText("Morning Conditioning", "en"), "Morning Conditioning");
  assert.equal(localiseDemoText("Morning Conditioning", "de"), "Morning Conditioning");
  assert.equal(localiseDemoText("Barbell Bench Press", "sl"), "Barbell Bench Press");
  assert.equal(localiseDemoText("", "sl"), "");
  assert.equal(localiseDemoText(undefined, "sl"), undefined);
});

test("a place with a name keeps it; a place described in words is translated", () => {
  // "Trib gym base" is what the gym is called. Translating it would rename someone's business.
  assert.equal(localiseDemoText("Trib gym base", "sl"), "Trib gym base");
  assert.equal(localiseDemoText("playground outside", "sl"), "zunanje igrišče");
});

test("every seeded string a trainer reads has a Slovenian form", () => {
  const sl = DEMO_TEXT.sl;
  const missing = [];
  const need = (value) => {
    if (typeof value === "string" && value.trim() && !sl[value]) missing.push(value);
  };

  for (const session of DEFAULT_SESSIONS) {
    need(session.title);
    need(session.location);
  }
  for (const routine of DEFAULT_ROUTINES) need(routine.name);
  for (const client of DEFAULT_CLIENTS) {
    need(client.goals);
    need(client.notes);
    need(client.injury);
  }
  for (const update of DEFAULT_PLAN_UPDATES) need(update.tag);

  assert.deepEqual(
    missing.filter((value) => value !== "Trib gym base"),
    [],
    "these seed strings are shown to the trainer but have no entry in DEMO_TEXT.sl",
  );
});
