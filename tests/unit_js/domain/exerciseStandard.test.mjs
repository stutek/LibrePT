// tests/unit_js/modules/common/exerciseStandard.test.mjs
// The open-standard crosswalk (TODO §13.1, UC6 §6): LibrePT's movement taxonomy mapped to the wger
// dataset so catalog exports stay universally interchangeable. These tests cover the pure mapping
// model (category/equipment → wger canonical names, the honest nulls where the standard has no
// equivalent, the interchange record + CSV shape).

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/domain/exerciseStandard.js";

test("crosswalk maps categories and equipment to wger", () => {
  const r = {
    core: m.wgerCategoryOf({ category: "Core" }),
    chest: m.wgerCategoryOf({ category: "Chest" }),
    cardio: m.wgerCategoryOf({ category: "Cardio" }),
    recovery: m.wgerCategoryOf({ category: "Recovery" }),
    barbell: m.wgerEquipmentOf({ equipment: "Barbell" }),
    bodyweight: m.wgerEquipmentOf({ equipment: "Bodyweight" }),
    cable: m.wgerEquipmentOf({ equipment: "Cable" }),
    machine: m.wgerEquipmentOf({ equipment: "Machine" }),
    categoriesAreWgerNative: m.WGER_CATEGORIES.includes("Abs"),
  };
  // Muscle groups map onto wger's ExerciseCategory names; Core folds into wger's "Abs".
  assert.equal(r.core, "Abs");
  assert.equal(r.chest, "Chest");
  // wger has no Cardio or flexibility/Recovery category — mapping is an honest null, not a guess.
  assert.equal(r.cardio, null);
  assert.equal(r.recovery, null);
  // Equipment maps to wger's canonical labels; bodyweight is wger's literal "none" label.
  assert.deepEqual(r.barbell, ["Barbell"]);
  assert.deepEqual(r.bodyweight, ["none (bodyweight exercise)"]);
  // Cable / Machine are not in wger's default equipment set → an empty (unmapped) list, not wrong.
  assert.deepEqual(r.cable, []);
  assert.deepEqual(r.machine, []);
  assert.equal(r.categoriesAreWgerNative, true);
});

test("interchange record preserves librept axes and flags gaps", () => {
  const cardio = m.toInterchangeExercise({
    id: "x1",
    name: "Assault Bike",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "calories",
  });
  const legacy = m.toInterchangeExercise({
    id: "x2",
    name: "Barbell Bench Press",
    category: "Chest",
    equipment: "Barbell",
    pattern: "Horizontal Push",
  });
  const unmapped = m.unmappedTerms();

  // A cardio erg: wger-native fields are null/empty (no equivalent), but nothing LibrePT-specific
  // is lost — pattern, modality and metric survive under the x_librept extension.
  assert.equal(cardio.category, null);
  assert.deepEqual(cardio.equipment, []);
  assert.equal(cardio.x_librept.modality, "cardio");
  assert.equal(cardio.x_librept.metric, "calories");
  assert.equal(cardio.x_librept.pattern, "Conditioning");
  // A legacy strength lift with no modality field defaults to strength on export.
  assert.equal(legacy.category, "Chest");
  assert.deepEqual(legacy.equipment, ["Barbell"]);
  assert.equal(legacy.x_librept.modality, "strength");
  // The interchange gap is a documented, testable fact.
  assert.deepEqual(new Set(unmapped.categories), new Set(["Cardio", "Recovery"]));
  assert.deepEqual(new Set(unmapped.equipment), new Set(["Cable", "Machine"]));
});

test("csv export has header and quotes cells", () => {
  const csv = m.catalogToCsv([
    {
      id: "x1",
      name: "Row, Barbell",
      category: "Back",
      equipment: "Barbell",
      pattern: "Horizontal Pull",
    },
  ]);
  const lines = csv.split("\n");
  assert.equal(
    lines[0],
    "name,wger_category,wger_equipment,librept_id,librept_category,librept_equipment,pattern,modality,metric",
  );
  // A name containing a comma must be quoted so the CSV stays parseable.
  assert.equal(
    lines[1].startsWith('"Row, Barbell",Back,Barbell,x1,Back,Barbell,Horizontal Pull,strength,'),
    true,
  );
});
