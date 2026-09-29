// src/domain/libraryImport.js — read a trainer's exercise library, and plan what it adds.
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
// failure the exercise library's taxonomy exists to prevent. The trainer is told which ones were
// skipped.
//
// **A circuit already in the library is not added again.** Present means its id is held by a circuit,
// or a circuit of the same folded name holds the same exercises, targets and rounds. The same name
// with another prescription is a different circuit and is added: skipping it would lose the trainer's
// changes without a word. Skipped circuits are listed apart, in `circuitDuplicates`.
//
// **A circuit and a routine point at exercises by id.** In the file they name them; a name the library
// does not know becomes a new exercise of the same import, so neither ever refers to nothing. A
// routine keeps its entries' grouping (circuitId, circuitTitle, circuitSeries, comboGroupId), and a
// routine whose name the trainer already has is a duplicate. Routines carry no source: schema 5 gives
// a routine no such field, so an imported routine is the trainer's own.
//
// **A circuit with no name is given one** (ruled 2026-09-23): the word for circuit and its first two
// exercises, in the app's language at the moment of import. A stored circuit always has a name
// (schema 5 requires it), and "Circuit — Squat, Lunge" says what it holds, where "Circuit 3" does not.
//
// Injected dependencies: none.

import { normalise } from "./catalogMatch.js";
import { jsonSpan, toNumber } from "./programImport.js";
import { parseLoad, parseReps } from "./repsAndLoad.js";

export const LIBRARY_FORMAT = "librept.library/1";
const INTERCHANGE_FORMAT = "wger-exercise-interchange";

const ALIASES = {
  exercises: ["exercises", "movements", "library"],
  circuits: ["circuits", "blocks"],
  routines: ["routines", "templates"],
  description: ["description", "notes"],
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

const EXERCISE_FIELDS = ["category", "equipment", "pattern", "modality", "metric", "source"];
const ITEM_NUMBERS = ["sets", "rest"];
// Reps and load are read by the app's own rules (repsAndLoad.js), because the app takes text there:
// "8-12", "max", "30s" for reps, "BW" or "Medium" for load.
const ITEM_TARGETS = { reps: parseReps, weight: parseLoad };
// How a routine's entries are grouped. Kept as they are: they are tokens local to the routine's own
// entries, not ids of other records.
const ROUTINE_GROUPING = ["circuitId", "circuitTitle", "comboGroupId"];

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

/** The target as the app stores a typed one, or undefined when the app has no such value: only text
 * and non-negative numbers can be typed into the field. */
function readTarget(value, parse) {
  if (typeof value === "string") return value.trim() ? parse(value) : undefined;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return parse(value);
  return undefined;
}

/** A circuit's entry: which exercise, and the targets that came with it. A reps or load value the
 * app cannot hold goes to `unreadable` at `position`, and the rest of the entry is kept. */
function readItem(raw, unreadable, position) {
  const exercise = readExercise(raw);
  if (!exercise) return null;
  const item = { name: exercise.name };
  for (const field of ITEM_NUMBERS) {
    const value = toNumber(raw?.[field] ?? pick(raw, field));
    if (value !== undefined) item[field] = value;
  }
  for (const [field, parse] of Object.entries(ITEM_TARGETS)) {
    const given = raw?.[field] ?? pick(raw, field);
    if (given === undefined || (typeof given === "string" && !given.trim())) continue;
    const value = readTarget(given, parse);
    if (value !== undefined) item[field] = value;
    else unreadable.push({ position: `${position} · ${field}`, raw: given });
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
  routines: [],
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
  const rawRoutines = isList ? [] : pick(parsed, "routines") || [];
  if (![rawExercises, rawCircuits, rawRoutines].every(Array.isArray))
    return refused("no_exercises");
  if (rawExercises.length + rawCircuits.length + rawRoutines.length === 0) {
    return refused("no_exercises");
  }

  const unreadable = [];
  return {
    ok: true,
    reason: "",
    detail: "",
    source: isList ? "" : text(pick(parsed, "source")) || "",
    exercises: readExercises(rawExercises, unreadable),
    circuits: readCircuits(rawCircuits, unreadable),
    routines: readRoutines(rawRoutines, unreadable),
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
      const position = `circuit ${index + 1} · ${itemIndex + 1}`;
      const item = readItem(rawItem, unreadable, position);
      if (item) items.push(item);
      else unreadable.push({ position, raw: rawItem });
    });
    if (items.length === 0) {
      unreadable.push({ position: `circuit ${index + 1}`, raw });
      return;
    }
    const circuit = { items };
    // The id from our own export: how a circuit already in the library is recognised.
    const id = text(raw.id);
    if (id) circuit.id = id;
    const source = text(pick(raw, "source"));
    if (source) circuit.source = source;
    const name = text(pick(raw, "name"));
    if (name) circuit.name = name;
    const series = toNumber(pick(raw, "series"));
    if (series !== undefined) circuit.series = series;
    circuits.push(circuit);
  });
  return circuits;
}

/** A routine's entry: an item, plus how it is grouped within the routine. */
function readRoutineEntry(raw, unreadable, position) {
  const item = readItem(raw, unreadable, position);
  if (!item || typeof raw !== "object") return item;
  for (const field of ROUTINE_GROUPING) {
    const value = text(raw[field]);
    if (value) item[field] = value;
  }
  const series = toNumber(raw.circuitSeries);
  if (series !== undefined) item.circuitSeries = series;
  return item;
}

function readRoutines(rawRoutines, unreadable) {
  const routines = [];
  rawRoutines.forEach((raw, index) => {
    const name = text(pick(raw, "name"));
    const rawItems = pick(raw, "items");
    const items = [];
    (Array.isArray(rawItems) ? rawItems : []).forEach((rawItem, itemIndex) => {
      const position = `routine ${index + 1} · ${itemIndex + 1}`;
      const item = readRoutineEntry(rawItem, unreadable, position);
      if (item) items.push(item);
      else unreadable.push({ position, raw: rawItem });
    });
    // A routine needs a name to be found again, and something in it to be worth adding.
    if (!name || items.length === 0) {
      unreadable.push({ position: `routine ${index + 1}`, raw });
      return;
    }
    const routine = { name, items };
    const description = text(pick(raw, "description"));
    if (description) routine.description = description;
    routines.push(routine);
  });
  return routines;
}

/** What makes two circuits the same: the folded name, the rounds, and every entry's exercise and
 * targets in order. Keys are sorted so the order they were written in does not matter. */
function prescriptionOf(circuit) {
  const entries = (circuit.exercises || []).map((entry) =>
    JSON.stringify(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))),
  );
  return JSON.stringify([normalise(circuit.name), circuit.series ?? null, entries]);
}

/** A circuit's name, or one made of its first two exercises when the file gave none. */
function circuitName(circuit, circuitWord) {
  if (circuit.name) return circuit.name;
  return `${circuitWord} — ${circuit.items
    .slice(0, 2)
    .map((item) => item.name)
    .join(", ")}`;
}

/** The prescription of a circuit from the file, or null when it names an exercise the library lacks:
 * such a circuit cannot equal one already in the library. */
function filePrescription(circuit, name, byName) {
  const known = circuit.items.map((item) => byName.get(normalise(item.name)));
  if (!known.every(Boolean)) return null;
  return prescriptionOf({
    name,
    series: circuit.series,
    exercises: circuit.items.map(({ name: _name, ...targets }, i) => ({
      id: known[i],
      ...targets,
    })),
  });
}

/**
 * The circuits a read library adds, and the names of those already present. A circuit is present when
 * its id is held by a circuit, or when a circuit of the same name holds the same exercises with the
 * same targets and rounds. The same name with another prescription is a different circuit and is
 * added: skipping it would lose the trainer's changes without a word.
 */
function planCircuits(fileCircuits, existingCircuits, context) {
  const { byName, ids, takenIds, newId, add, withSource, circuitWord } = context;
  const circuitIds = new Set(existingCircuits.map((circuit) => circuit.id));
  const prescriptions = new Set(existingCircuits.map(prescriptionOf));
  const circuitDuplicates = [];
  const circuits = [];
  for (const circuit of fileCircuits) {
    const name = circuitName(circuit, circuitWord);
    // Checked before any exercise is created: a circuit that turns out to be present must not leave
    // new exercises behind.
    const present =
      (circuit.id && circuitIds.has(circuit.id)) ||
      prescriptions.has(filePrescription(circuit, name, byName));
    if (present) {
      circuitDuplicates.push(name);
      continue;
    }
    const exercises = circuit.items.map(({ name: itemName, ...targets }) => ({
      id: byName.get(normalise(itemName)) ?? add({ name: itemName }),
      ...targets,
    }));
    const free = circuit.id && !ids.has(circuit.id) && !takenIds.has(circuit.id);
    const record = { id: free ? circuit.id : newId() };
    if (circuit.source) record.source = circuit.source;
    record.name = name;
    if (circuit.series !== undefined) record.series = circuit.series;
    const added = withSource({ ...record, exercises });
    circuits.push(added);
    circuitIds.add(added.id);
    ids.add(added.id);
    prescriptions.add(prescriptionOf(added));
  }
  return { circuits, circuitDuplicates };
}

/**
 * The new records a read library adds to `library` (the trainer's whole library, catalog included):
 * `{ exercises, circuits, routines, duplicates, circuitDuplicates }`. `circuits` in the options are
 * the trainer's circuits; `circuitDuplicates` names the file's circuits already among them. `source`
 * is written on every new record, or left off when empty — no source means the trainer's own.
 * `newId` is injected so a test is deterministic.
 *
 * `takenIds` are the ids every other record already holds (recordProjections.js's
 * `recordIdsInUse`). All records of one schema share one key in the store, so an exercise kept under
 * a client's id would replace that client. A file's id is kept only when nothing holds it.
 */
export function planLibraryImport(
  parsed,
  library,
  {
    source,
    newId,
    circuitWord = "Circuit",
    takenIds = new Set(),
    routineNames = [],
    circuits: existingCircuits = [],
  },
) {
  const byName = new Map(
    (library || []).map((exercise) => [normalise(exercise.name), exercise.id]),
  );
  const ids = new Set((library || []).map((exercise) => exercise.id));
  const withSource = (record) => (source && !record.source ? { ...record, source } : record);
  const exercises = [];
  const duplicates = [];

  const add = (exercise) => {
    const free = exercise.id && !ids.has(exercise.id) && !takenIds.has(exercise.id);
    const id = free ? exercise.id : newId();
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

  const { circuits, circuitDuplicates } = planCircuits(parsed.circuits || [], existingCircuits, {
    byName,
    ids,
    takenIds,
    newId,
    add,
    withSource,
    circuitWord,
  });

  // `routineNames` are the names of the trainer's routines, already folded with catalogMatch's rule.
  const knownRoutines = new Set(routineNames);
  const routines = [];
  for (const routine of parsed.routines || []) {
    const key = normalise(routine.name);
    if (knownRoutines.has(key)) {
      duplicates.push(routine.name);
      continue;
    }
    knownRoutines.add(key);
    // Entries first, as a circuit's are: an exercise the routine adds takes its id before the routine.
    const entries = routine.items.map(({ name, ...entry }) => ({
      id: byName.get(normalise(name)) ?? add({ name }),
      ...entry,
    }));
    routines.push({
      id: newId(),
      name: routine.name,
      ...(routine.description ? { description: routine.description } : {}),
      exercises: entries,
    });
  }

  return { exercises, circuits, routines, duplicates, circuitDuplicates };
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
      routines: [
        {
          name: "Upper body",
          description: "Presses and rows.",
          exercises: [
            { name: "Landmine Press", sets: 3, reps: 10, weight: 20, rest: 90 },
            { name: "Push-Ups", sets: 3, reps: 15, rest: 60 },
          ],
        },
      ],
    },
    null,
    2,
  )}\n`;
}
