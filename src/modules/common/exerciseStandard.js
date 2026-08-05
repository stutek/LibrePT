// src/modules/common/exerciseStandard.js — crosswalk from LibrePT's movement taxonomy to an
// established open standard (the wger Workout Manager dataset), so the catalog exports are
// universally interchangeable with external research / coaching tools (TODO §13.1, UC6 §6).
//
// Why wger and not ExRx: wger is genuinely open (AGPL, open dataset) and interchange-friendly,
// whereas ExRx is a proprietary reference. The one honest interchange KEY is the canonical *name*
// of a category / equipment item — wger's own numeric primary keys are per-instance and unstable,
// so mapping by name is what actually round-trips between two wger installs, let alone into ours.
//
// LibrePT is a SUPERSET of wger's taxonomy: it adds a biomechanical `pattern` axis and a richer
// `modality` axis (see exerciseModality.js) that wger has no field for. This crosswalk maps the two
// axes that DO align (category → wger ExerciseCategory, equipment → wger Equipment) by canonical
// name, preserves everything LibrePT-specific under a namespaced `x_librept` extension so nothing is
// lost on round-trip, and is deliberately explicit about the terms the standard has no equivalent for
// (Cardio/Recovery are not wger categories; Cable/Machine are not wger default equipment).

// wger's default ExerciseCategory fixtures (canonical names).
export const WGER_CATEGORIES = ["Abs", "Arms", "Back", "Calves", "Chest", "Legs", "Shoulders"];

// wger's default Equipment fixtures (canonical names). Bodyweight is wger's literal "none" label.
export const WGER_EQUIPMENT = [
  "Barbell",
  "SZ-Bar",
  "Dumbbell",
  "Gym mat",
  "Swiss Ball",
  "Pull-up bar",
  "none (bodyweight exercise)",
  "Bench",
  "Incline bench",
  "Kettlebell",
];

// LibrePT category (primary muscle group) → wger ExerciseCategory. `null` = the standard has no
// equivalent: wger has no Cardio or flexibility/Recovery category (cardio/mobility are modelled by
// the movement, not a category), so those export with a null category and rely on x_librept.
export const CATEGORY_TO_WGER = {
  Chest: "Chest",
  Back: "Back",
  Legs: "Legs",
  Shoulders: "Shoulders",
  Arms: "Arms",
  Core: "Abs",
  Recovery: null,
  Cardio: null,
};

// LibrePT equipment → wger Equipment. `null` = not in wger's default equipment set: wger ships no
// Cable or Machine equipment, so those export unmapped rather than being force-fit to a wrong tag.
export const EQUIPMENT_TO_WGER = {
  Barbell: "Barbell",
  Dumbbell: "Dumbbell",
  Cable: null,
  Machine: null,
  Bodyweight: "none (bodyweight exercise)",
};

// Reverse lookups for importing a wger record back into LibrePT. Built from the forward maps (only
// the pairs that actually map), plus best-effort fallbacks for wger-only terms LibrePT folds together
// (wger splits Calves off Legs and offers bar/kettlebell variants LibrePT buckets more coarsely).
export const WGER_TO_CATEGORY = {
  Abs: "Core",
  Arms: "Arms",
  Back: "Back",
  Calves: "Legs",
  Chest: "Chest",
  Legs: "Legs",
  Shoulders: "Shoulders",
};

export const WGER_TO_EQUIPMENT = {
  Barbell: "Barbell",
  "SZ-Bar": "Barbell",
  Dumbbell: "Dumbbell",
  Kettlebell: "Dumbbell",
  "Pull-up bar": "Bodyweight",
  "Gym mat": "Bodyweight",
  "none (bodyweight exercise)": "Bodyweight",
  Bench: null,
  "Incline bench": null,
  "Swiss Ball": null,
};

// The wger ExerciseCategory name for a LibrePT exercise, or null when the standard has no equivalent.
export function wgerCategoryOf(ex) {
  return CATEGORY_TO_WGER[ex?.category] ?? null;
}

// The wger Equipment names for a LibrePT exercise, as an array (wger's equipment is many-to-many);
// empty when the movement's equipment has no wger equivalent (Cable / Machine).
export function wgerEquipmentOf(ex) {
  const mapped = EQUIPMENT_TO_WGER[ex?.equipment];
  return mapped ? [mapped] : [];
}

// One LibrePT catalog entry → a wger-interchange record. The wger-native fields (name, category,
// equipment) map by canonical name; every LibrePT-specific axis is preserved under `x_librept` so a
// round-trip loses nothing. `instructions` is intentionally dropped — the catalog deprecates it.
export function toInterchangeExercise(ex) {
  return {
    name: ex.name,
    category: wgerCategoryOf(ex),
    equipment: wgerEquipmentOf(ex),
    x_librept: {
      id: ex.id,
      category: ex.category,
      equipment: ex.equipment,
      pattern: ex.pattern ?? null,
      modality: ex.modality ?? "strength",
      metric: ex.metric ?? null,
    },
  };
}

// The whole catalog wrapped in a self-describing interchange envelope. The envelope names the format
// and version so an external importer can recognise it, and states plainly where LibrePT extends
// beyond wger — no magic, the mapping is legible in the file itself.
export function catalogToInterchange(exercises) {
  return {
    format: "wger-exercise-interchange",
    version: 1,
    generated: new Date().toISOString(),
    note:
      "category & equipment mapped to wger canonical names; a null value means the wger standard " +
      "has no equivalent. LibrePT's biomechanical pattern and modality axes are preserved under " +
      "x_librept (wger has no field for them).",
    exercises: exercises.map(toInterchangeExercise),
  };
}

// Excel, LibreOffice and Sheets evaluate a cell whose text begins with = + - @ (or a leading tab /
// carriage return), so a movement NAME can execute on open — CWE-1236, spreadsheet formula
// injection. That is not theoretical here on two counts: names are free text a trainer types, and a
// restored backup is untrusted input that lands in the same field, so a hostile catalog survives an
// export and fires in whoever opens it. This function is the ONLY cell sink (catalogToCsv below is
// the only CSV producer), so neutralising here covers the format.
//
// A leading apostrophe is the standard mitigation: spreadsheets read the rest of the cell as literal
// text. It does change the exported bytes, which is why the LOSSLESS machine path is the JSON
// interchange (catalogToInterchange) — this CSV exists to be read by a human in a spreadsheet, so
// fidelity yields to not executing. Quoting alone is not a fix: a quoted CSV cell is still parsed
// as a formula.
const SPREADSHEET_FORMULA_TRIGGER = /^[=+\-@\t\r]/;

// RFC-4180-ish CSV cell: quote when the value contains a comma, quote, or newline; double inner quotes.
function csvCell(value) {
  const raw = value == null ? "" : String(value);
  const neutralised = SPREADSHEET_FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(neutralised) ? `"${neutralised.replace(/"/g, '""')}"` : neutralised;
}

const CSV_HEADER = [
  "name",
  "wger_category",
  "wger_equipment",
  "librept_id",
  "librept_category",
  "librept_equipment",
  "pattern",
  "modality",
  "metric",
];

// The catalog as an interchange CSV: one row per movement, both the wger-mapped and the raw LibrePT
// columns side by side so the crosswalk is inspectable in any spreadsheet. Multi-valued wger
// equipment is joined with "; " to stay inside a single cell.
export function catalogToCsv(exercises) {
  const rows = exercises.map((ex) => {
    const wc = wgerCategoryOf(ex);
    return [
      ex.name,
      wc ?? "",
      wgerEquipmentOf(ex).join("; "),
      ex.id,
      ex.category ?? "",
      ex.equipment ?? "",
      ex.pattern ?? "",
      ex.modality ?? "strength",
      ex.metric ?? "",
    ]
      .map(csvCell)
      .join(",");
  });
  return [CSV_HEADER.join(","), ...rows].join("\n");
}

// The LibrePT vocabulary terms that the wger standard has no equivalent for — surfaced explicitly so
// the interchange gap is a documented, testable fact rather than a silent lossy mapping.
export function unmappedTerms() {
  return {
    categories: Object.keys(CATEGORY_TO_WGER).filter((k) => CATEGORY_TO_WGER[k] === null),
    equipment: Object.keys(EQUIPMENT_TO_WGER).filter((k) => EQUIPMENT_TO_WGER[k] === null),
  };
}
