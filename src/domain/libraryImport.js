// src/domain/libraryImport.js — read a trainer's exercise library, and plan what it adds (TODO §45.5).
//
// Single responsibility: text in, new exercise and circuit records out. Pure — no DOM, no storage.
//
// **Three shapes are read, because they are the three a trainer actually holds**: the app's own
// catalog export (`wger-exercise-interchange`, what a colleague sends when trainers exchange
// catalogs), the short `librept.library/1` shape an assistant or a spreadsheet produces, and a bare
// list of names. Field names go through a NAMED alias table, as in programImport.js: a list can be
// read, tested and argued with, where a similarity score fails in ways nobody can explain.
//
// **An exercise the library already has is not added again.** Same id, or the same name after case
// and spacing are folded (catalogMatch.js's rule) — a second "Bench Press" under a new id is the
// failure §13's taxonomy exists to prevent. The trainer is told which ones were skipped.
//
// **A circuit points at exercises by id**, like a routine does. A name the library does not know
// becomes a new exercise of the same import, so a circuit never refers to nothing.
//
// **A circuit with no name is given one** (ruled 2026-09-23): the word for circuit and its first two
// exercises, in the app's language at the moment of import. A stored circuit always has a name
// (schema 5 requires it), and "Circuit — Squat, Lunge" says what it holds, where "Circuit 3" does not.
//
// Injected dependencies: none.

import { normalise } from "./catalogMatch.js";
import { jsonSpan, toNumber } from "./programImport.js";

export const LIBRARY_FORMAT = "librept.library/1";
const INTERCHANGE_FORMAT = "wger-exercise-interchange";

const ALIASES = {
  exercises: ["exercises", "movements", "library"],
  circuits: ["circuits", "blocks"],
  source: ["source", "author", "from"],
  name: ["name", "exercise", "movement", "title"],
  category: ["category", "muscle", "muscleGroup", "group"],
  equipment: ["equipment"],
  pattern: ["pattern"],
  modality: ["modality"],
  metric: ["metric"],
  series: ["series", "rounds"],
  items: ["exercises", "items", "movements"],
  sets: ["sets"],
  reps: ["reps", "repetitions"],
  weight: ["weight", "load", "kg"],
  rest: ["rest", "restSeconds", "pause"],
};

const EXERCISE_FIELDS = ["category", "equipment", "pattern", "modality", "metric"];
const ITEM_NUMBERS = ["sets", "reps", "weight", "rest"];

function pick(raw, field) {
  for (const key of ALIASES[field]) {
    const value = raw?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

/** One exercise from a string, an alias-keyed object, or an interchange record. Null when it names
 * nothing — a row with a muscle group but no movement cannot be guessed. */
function readExercise(raw) {
  if (typeof raw === "string") return text(raw) ? { name: raw.trim() } : null;
  const name = text(pick(raw, "name"));
  if (!name) return null;
  // The app's own export keeps LibrePT's axes under x_librept, beside wger's mapped names.
  const librept = raw.x_librept && typeof raw.x_librept === "object" ? raw.x_librept : null;
  const exercise = librept && text(librept.id) ? { id: librept.id.trim(), name } : { name };
  for (const field of EXERCISE_FIELDS) {
    const value = text(librept ? librept[field] : pick(raw, field));
    // "strength" is the default and the catalog omits it; storing it would make an imported
    // exercise differ from the same one typed in the app.
    if (value && !(field === "modality" && value === "strength")) exercise[field] = value;
  }
  return exercise;
}

/** A circuit's entry: which exercise, and the targets that came with it. */
function readItem(raw) {
  const exercise = readExercise(raw);
  if (!exercise) return null;
  const item = { name: exercise.name };
  for (const field of ITEM_NUMBERS) {
    const value = toNumber(raw?.[field] ?? pick(raw, field));
    if (value !== undefined) item[field] = value;
  }
  return item;
}

// A refusal is a CODE plus the detail it needs, never a sentence: the dialog says it in the app's
// language, and an English sentence from here would reach a Slovenian trainer as English.
const refused = (reason, detail = "") => ({
  ok: false,
  reason,
  detail,
  source: "",
  exercises: [],
  circuits: [],
  unreadable: [],
});

/**
 * Read pasted or uploaded text into `{ ok, reason, detail, source, exercises, circuits, unreadable }`.
 * `reason` is one of empty | no_data | not_json | other_format | no_exercises.
 * Every unreadable entry is reported with its position — "3" for the third exercise, "circuit 2 · 4"
 * for the fourth entry of the second circuit — and the readable ones are kept.
 */
export function readLibrary(input) {
  const envelope = parseEnvelope(input);
  if (!envelope.ok) return refused(envelope.reason, envelope.detail);
  const { parsed, isList } = envelope;

  const rawExercises = isList ? parsed : pick(parsed, "exercises") || [];
  const rawCircuits = isList ? [] : pick(parsed, "circuits") || [];
  if (!Array.isArray(rawExercises) || !Array.isArray(rawCircuits)) return refused("no_exercises");
  if (rawExercises.length === 0 && rawCircuits.length === 0) return refused("no_exercises");

  const unreadable = [];
  return {
    ok: true,
    reason: "",
    detail: "",
    source: isList ? "" : text(pick(parsed, "source")) || "",
    exercises: readExercises(rawExercises, unreadable),
    circuits: readCircuits(rawCircuits, unreadable),
    unreadable,
  };
}

/** The JSON inside the text, or the reason there is none we accept. */
function parseEnvelope(input) {
  if (typeof input !== "string" || !input.trim()) return { ok: false, reason: "empty" };
  const span = jsonSpan(input);
  if (!span) return { ok: false, reason: "no_data" };
  let parsed;
  try {
    parsed = JSON.parse(span);
  } catch (error) {
    return { ok: false, reason: "not_json", detail: error.message };
  }
  const isList = Array.isArray(parsed);
  const format = isList ? undefined : parsed?.format;
  if (format && format !== LIBRARY_FORMAT && format !== INTERCHANGE_FORMAT) {
    return { ok: false, reason: "other_format", detail: format };
  }
  return { ok: true, parsed, isList };
}

function readExercises(rawExercises, unreadable) {
  const exercises = [];
  rawExercises.forEach((raw, index) => {
    const exercise = readExercise(raw);
    if (exercise) exercises.push(exercise);
    else unreadable.push({ position: String(index + 1), raw });
  });
  return exercises;
}

function readCircuits(rawCircuits, unreadable) {
  const circuits = [];
  rawCircuits.forEach((raw, index) => {
    const items = [];
    const rawItems = pick(raw, "items");
    (Array.isArray(rawItems) ? rawItems : []).forEach((rawItem, itemIndex) => {
      const item = readItem(rawItem);
      if (item) items.push(item);
      else unreadable.push({ position: `circuit ${index + 1} · ${itemIndex + 1}`, raw: rawItem });
    });
    if (items.length === 0) {
      unreadable.push({ position: `circuit ${index + 1}`, raw });
      return;
    }
    const circuit = { items };
    const name = text(pick(raw, "name"));
    if (name) circuit.name = name;
    const series = toNumber(pick(raw, "series"));
    if (series !== undefined) circuit.series = series;
    circuits.push(circuit);
  });
  return circuits;
}

/**
 * The new records a read library adds to `library` (the trainer's whole library, catalog included):
 * `{ exercises, circuits, duplicates }`. `source` is written on every new record, or left off when
 * empty — no source means the trainer's own. `newId` is injected so a test is deterministic.
 */
export function planLibraryImport(parsed, library, { source, newId, circuitWord = "Circuit" }) {
  const byName = new Map(
    (library || []).map((exercise) => [normalise(exercise.name), exercise.id]),
  );
  const ids = new Set((library || []).map((exercise) => exercise.id));
  const withSource = (record) => (source ? { ...record, source } : record);
  const exercises = [];
  const duplicates = [];

  const add = (exercise) => {
    const id = exercise.id && !ids.has(exercise.id) ? exercise.id : newId();
    const record = withSource({ ...exercise, id });
    exercises.push(record);
    ids.add(id);
    byName.set(normalise(exercise.name), id);
    return id;
  };

  for (const exercise of parsed.exercises || []) {
    if ((exercise.id && ids.has(exercise.id)) || byName.has(normalise(exercise.name))) {
      duplicates.push(exercise.name);
      continue;
    }
    add(exercise);
  }

  const circuits = (parsed.circuits || []).map((circuit) => {
    const entries = circuit.items.map(({ name, ...targets }) => ({
      id: byName.get(normalise(name)) ?? add({ name }),
      ...targets,
    }));
    const record = {
      id: newId(),
      name:
        circuit.name ||
        `${circuitWord} — ${circuit.items
          .slice(0, 2)
          .map((item) => item.name)
          .join(", ")}`,
    };
    if (circuit.series !== undefined) record.series = circuit.series;
    return withSource({ ...record, exercises: entries });
  });

  return { exercises, circuits, duplicates };
}

/**
 * A working example, offered in the box so a trainer has something to follow rather than a format
 * to interpret. A test reads it back: an example that no longer reads would teach the wrong shape.
 */
export function libraryTemplate() {
  return `${JSON.stringify(
    {
      format: LIBRARY_FORMAT,
      source: "Ana Novak",
      exercises: [
        {
          name: "Landmine Press",
          category: "Shoulders",
          equipment: "Barbell",
          pattern: "Vertical Push",
        },
        { name: "Sled Push", category: "Legs", equipment: "Machine", pattern: "Conditioning" },
      ],
      circuits: [
        {
          name: "Finisher",
          rounds: 3,
          exercises: [
            { name: "Sled Push", reps: 20 },
            { name: "Push-Ups", reps: 15, rest: 60 },
          ],
        },
      ],
    },
    null,
    2,
  )}\n`;
}
