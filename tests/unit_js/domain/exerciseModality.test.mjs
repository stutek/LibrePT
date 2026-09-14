// tests/unit_js/modules/common/exerciseModality.test.mjs
// The exercise MODALITY axis (TODO §13.3 / §17.1): a movement is not always sets × reps × load.
// Cardio is logged against an effort metric (time/distance/calories/watts), stretch & balance
// against a hold-time. These tests cover the pure metric-formatting model that the focus card /
// plans / history all render through.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/domain/exerciseModality.js";

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

test("compactTargetString: the one wording the live card and the plan sheet share (TODO §52.2)", () => {
  const strength = m.compactTargetString({
    setsTarget: 4,
    repsTarget: 6,
    metric: "reps",
    modality: "strength",
    weightTarget: 60,
    loadUnit: "kg",
  });
  const isometric = m.compactTargetString({
    setsTarget: 3,
    repsTarget: "0:45",
    metric: "hold",
    modality: "isometric",
    weightTarget: 20,
    loadUnit: "kg",
  });
  const cardio = m.compactTargetString({
    setsTarget: 1,
    repsTarget: 20,
    metric: "calories",
    modality: "cardio",
  });
  const stretch = m.compactTargetString({
    setsTarget: 2,
    repsTarget: "0:30",
    metric: "hold",
    modality: "stretch",
  });
  assert.equal(strength, "S4 × R6 × 60 kg");
  assert.equal(isometric, "S3 × 0:45 × 20 kg");
  assert.equal(cardio, "S1 × 20 cal");
  // stretch carries no load axis, even with a weightTarget left over on the item
  assert.equal(stretch, "S2 × 0:30");
  // no weight recorded: the load axis is dropped, not shown as "0 kg" or "× "
  assert.equal(
    m.compactTargetString({ setsTarget: 3, repsTarget: 10, modality: "strength", weightTarget: 0 }),
    "S3 × R10",
  );
});
