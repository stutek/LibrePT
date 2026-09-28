// tests/unit_js/modules/common/repsAndLoad.test.mjs
// Unit-level coverage for helper/repsAndLoad.js. Reps and load are polymorphic (count/range/time/max;
// kg/level/band/bw), so the parse/format/derive helpers are the single source of truth every
// authoring surface relies on.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/domain/repsAndLoad.js";

test("reps and load helpers", () => {
  const parseReps = [m.parseReps("10"), m.parseReps("8-12"), m.parseReps("max"), m.parseReps("")];
  const isFailure = [m.isFailureReps("max"), m.isFailureReps("AMRAP"), m.isFailureReps("10")];
  const formatReps = [m.formatReps("max"), m.formatReps(10), m.formatReps("")];
  const parseLoad = [m.parseLoad("40"), m.parseLoad("Medium"), m.parseLoad("")];
  const unit = [
    m.loadUnitForEquipment("Cable"),
    m.loadUnitForEquipment("Band"),
    m.loadUnitForEquipment("Bodyweight"),
    m.loadUnitForEquipment("Barbell"),
  ];
  const formatLoad = [
    m.formatLoad(40, "kg"),
    m.formatLoad(3, "level"),
    m.formatLoad(0, "bw"),
    m.formatLoad(5, "bw"),
    m.formatLoad("Heavy", "band"),
  ];
  const hasLoad = [
    m.hasLoad(0, "bw"),
    m.hasLoad(0, "kg"),
    m.hasLoad(5, "kg"),
    m.hasLoad("", "band"),
    m.hasLoad("Light", "band"),
  ];
  const tier = [
    m.repsTier("Squat", "kg"),
    m.repsTier("Squat", "bw"),
    m.repsTier("Vertical Pull", "bw"),
    m.repsTier("Core", "kg"),
    m.repsTier("Mobility", "kg"),
    m.repsTier("Isolation", "kg"),
    m.repsTier(undefined, "bw"),
    m.repsTier(undefined, "kg"),
  ];
  const presetList = [m.repsPresetListId("Squat", "kg"), m.repsPresetListId("Mobility", "kg")];
  const presetsFor = m.repsPresetsFor("Squat", "kg");
  const tiers = m.REPS_TIERS;

  // Reps: pure numbers become Number; tokens stay strings; empty → default 10.
  assert.deepEqual(parseReps, [10, "8-12", "max", 10]);
  assert.deepEqual(isFailure, [true, true, false]);
  assert.deepEqual(formatReps, ["Max", "10", "—"]);

  // Load: numeric → Number, band label stays string, empty → 0.
  assert.deepEqual(parseLoad, [40, "Medium", 0]);
  // Equipment → load unit (unlisted equipment is kilograms).
  assert.deepEqual(unit, ["level", "band", "bw", "kg"]);
  // Display strings per unit.
  assert.deepEqual(formatLoad, ["40 kg", "Lvl 3", "BW", "BW+5kg", "Heavy"]);
  // Visibility: bodyweight always shows; kg needs a positive value; band needs a label.
  assert.deepEqual(hasLoad, [true, false, true, false, true]);

  // Reps tier tracks pattern × load: loaded squat = strength; bodyweight squat shifts to endurance;
  // a bodyweight vertical pull (pull-up) stays strength; core = endurance; mobility = time; loaded
  // isolation = hypertrophy; no-pattern falls back to load (bw → endurance, else strength).
  assert.deepEqual(tier, [
    "strength",
    "endurance",
    "strength",
    "endurance",
    "time",
    "hypertrophy",
    "endurance",
    "strength",
  ]);
  assert.deepEqual(presetList, ["reps-presets", "reps-presets-time"]);
  assert.deepEqual(presetsFor, ["3", "5", "8", "10", "max"]);
  assert.deepEqual(tiers.endurance, ["10", "20", "50", "max"]);
});

test("every preset list a field can name is one the page is given", () => {
  const html = m.repsPresetsDatalistHTML();
  for (const [pattern, unit] of [
    ["Squat", "kg"],
    ["Carry", "kg"],
    ["Plank", "kg"],
    ["Squat", "bw"],
  ]) {
    const id = m.repsPresetListId(pattern, unit);
    assert.ok(html.includes(`<datalist id="${id}">`), `no datalist for ${id}`);
  }
  for (const values of Object.values(m.REPS_TIERS)) {
    for (const v of values) assert.ok(html.includes(`<option value="${v}">`), v);
  }
});

test("a band load is chosen from the band strengths, with the saved one selected", () => {
  const html = m.loadInputHTML({
    unit: "band",
    value: "Medium",
    cls: "row-load",
    escapeHTML: String,
  });
  assert.match(html, /^<select class="row-load"/);
  for (const level of m.BAND_LEVELS) assert.ok(html.includes(`>${level}</option>`), level);
  assert.ok(html.includes('value="Medium" selected'));
  assert.ok(!html.includes('value="Light" selected'));
});

test("every other load is a number field that says its unit", () => {
  const cases = { kg: "kg", level: "Level", bw: "+kg (BW)" };
  for (const [unit, label] of Object.entries(cases)) {
    const html = m.loadInputHTML({ unit, value: 5, cls: "row-load", escapeHTML: String });
    assert.match(html, /^<input type="number"/, unit);
    assert.ok(html.includes(`placeholder="${label}"`), unit);
    assert.ok(html.includes('value="5"'), unit);
    assert.equal(m.loadFieldMeta(unit).label, label);
  }
  assert.equal(m.loadFieldMeta("band").kind, "band");
});

test("an empty load stays empty rather than becoming zero", () => {
  for (const value of ["", undefined, null]) {
    const html = m.loadInputHTML({ unit: "kg", value, cls: "c", escapeHTML: String });
    assert.ok(html.includes('value=""'), String(value));
  }
});

test("a load value goes through the caller's escaping", () => {
  const html = m.loadInputHTML({
    unit: "kg",
    value: '"><script>',
    cls: "c",
    escapeHTML: (s) => s.replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  });
  assert.ok(!html.includes("<script>"));
});
