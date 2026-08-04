// tests/unit_js/modules/common/exerciseModality.test.mjs
// The exercise MODALITY axis (TODO §13.3 / §17.1): a movement is not always sets × reps × load.
// Cardio is logged against an effort metric (time/distance/calories/watts), stretch & balance
// against a hold-time. These tests cover the pure metric-formatting model that the focus card /
// plans / history all render through.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../../src/modules/common/exerciseModality.js";

test("metric formatting model renders the right units", () => {
  const results = {
    watts: m.formatMetricValue(200, "watts"),
    meters: m.formatMetricValue(500, "distance"),
    km: m.formatMetricValue(1500, "distance"),
    cals: m.formatMetricValue(20, "calories"),
    hold: m.formatMetricValue("30s", "hold"),
    clock: m.formatMetricValue("20:00", "time"),
    strengthMetric: m.primaryMetricOf({ modality: "strength" }),
    cardioMetric: m.primaryMetricOf({ modality: "cardio", metric: "watts" }),
    legacyDefault: m.modalityOf({}),
  };
  assert.equal(results.watts, "200 W");
  assert.equal(results.meters, "500 m");
  assert.equal(results.km, "1.5 km");
  assert.equal(results.cals, "20 cal");
  assert.equal(results.hold, "0:30");
  assert.equal(results.clock, "20:00");
  assert.equal(results.strengthMetric, "reps");
  assert.equal(results.cardioMetric, "watts");
  // a legacy exercise with no modality field must default to strength
  assert.equal(results.legacyDefault, "strength");
});

test("isometric agility and extended cardio metrics", () => {
  const r = {
    pace: m.formatMetricValue("5:00", "pace"),
    bpm: m.formatMetricValue(150, "heartrate"),
    isoMetric: m.primaryMetricOf({ modality: "isometric" }),
    agilityDefault: m.primaryMetricOf({ modality: "agility" }),
    agilityDistance: m.primaryMetricOf({ modality: "agility", metric: "distance" }),
    isoLoad: m.usesLoad("isometric"),
    strengthLoad: m.usesLoad("strength"),
    cardioLoad: m.usesLoad("cardio"),
    agilityLoad: m.usesLoad("agility"),
    agilityOpts: m.metricOptionsFor("agility"),
    cardioHasPace: m.metricOptionsFor("cardio").includes("pace"),
    strengthOpts: m.metricOptionsFor("strength"),
  };
  assert.equal(r.pace, "5:00 /km");
  assert.equal(r.bpm, "150 bpm");
  // isometric logs a hold-time
  assert.equal(r.isoMetric, "hold");
  assert.equal(r.agilityDefault, "time");
  assert.equal(r.agilityDistance, "distance");
  // Load axis: strength + isometric carry load; cardio + agility do not.
  assert.equal(r.isoLoad, true);
  assert.equal(r.strengthLoad, true);
  assert.equal(r.cardioLoad, false);
  assert.equal(r.agilityLoad, false);
  assert.deepEqual(r.agilityOpts, ["time", "distance", "reps"]);
  assert.equal(r.cardioHasPace, true);
  // fixed-metric modalities offer no metric choice
  assert.equal(r.strengthOpts, null);
});
