// src/domain/programImport.js — read a programme somebody wrote somewhere else (TODO §29).
//
// Single responsibility: text in, plan items out. Pure — no DOM, no storage, no network.
//
// **Why this can be forgiving: the result lands in the session EDITOR, not in the database.** That
// decision (§29.1) turns "parse correctly" into "parse usefully". A wrong guess is a field the
// trainer retypes; the failure that actually costs them an evening is losing eleven good rows
// because the twelfth was unreadable. So every item is parsed on its own and an unreadable one
// survives as a row that SAYS it is unreadable, carrying its raw text — something to fix, rather
// than a blank or an exception.
//
// **Liberal at the edges, strict at the centre** (§29.2). Markdown fences, prose around the JSON, a
// bare array instead of the envelope, numbers as strings, `"3x10"` — all understood. Field names are
// matched against a NAMED alias table, never by fuzzy similarity: an explicit list can be read,
// tested and argued with, while a similarity score fails unpredictably and nobody can say why
//.
//
// **The format marker earns its place** by separating "this is not our JSON" from "this is ours and
// one field is wrong". Without it, someone else's plausibly-shaped export would be adopted silently.
//
// Injected dependencies: none.

// Declared here and quoted in the prompt the app offers, so the shape a trainer's assistant is asked
// for and the shape this accepts cannot drift apart.
export const PROGRAM_FORMAT = "librept.program/1";

// One entry per field, listing the spellings assistants and spreadsheets actually produce. Order
// matters only in that the first present key wins.
const ALIASES = {
  name: ["name", "exercise", "movement", "title"],
  sets: ["sets", "series", "setCount"],
  reps: ["reps", "repetitions", "rep", "count"],
  weight: ["weight", "load", "kg", "kilograms"],
  unit: ["unit", "units", "loadUnit"],
  rest: ["rest", "restSeconds", "pause"],
  notes: ["notes", "note", "cue", "comment"],
};

// "3x10", "3 × 10", "3X10" — a sets×reps shorthand, in the spellings people write by hand.
const SETS_BY_REPS = /^\s*(\d+)\s*[x×]\s*(\d+)\s*$/i;

/** The first alias present on a raw item, or undefined. */
function pick(raw, field) {
  for (const key of ALIASES[field]) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") return raw[key];
  }
  return undefined;
}

/** A number from whatever arrived — numbers as strings are the commonest difference between two
 * assistants asked for the same thing. Returns undefined rather than NaN, so a caller can tell
 * "absent" from "zero". */
function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Strip what an assistant wraps around JSON when it is being helpful: a ```json fence, or a
 * sentence before and after. Falls back to the widest {...} or [...] span in the text. */
function jsonSpan(text) {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const lastObject = candidate.lastIndexOf("}");
  const lastArray = candidate.lastIndexOf("]");
  const end = Math.max(lastObject, lastArray);
  return end > start ? candidate.slice(start, end + 1) : null;
}

/** An unreadable row: kept, marked, and carrying what it could not read. */
function unreadableItem(raw, newId) {
  return {
    id: newId(),
    type: "exercise",
    name: "",
    sets: [],
    unreadable: true,
    raw: typeof raw === "string" ? raw : JSON.stringify(raw),
  };
}

/**
 * A working example of the format, offered to the trainer as a download (decided 2026-08-18) so
 * they have something to follow rather than a schema to interpret.
 *
 * It is generated from this module rather than kept as a fixture file, and a test parses it: an
 * example that stopped being readable would be the app handing out a demonstration of how to fail.
 * It deliberately shows a title, a load with its unit, a rest, and a movement with no load — the
 * four things a first-time reader otherwise has to guess at.
 */
export function programTemplate() {
  return `${JSON.stringify(
    {
      format: PROGRAM_FORMAT,
      title: "Upper Body — Week 1",
      items: [
        { name: "Barbell Bench Press", sets: 4, reps: 5, weight: 60, unit: "kg" },
        { rest: 120 },
        { name: "Bent-Over Row", sets: 4, reps: 8, weight: 45, unit: "kg" },
        { name: "Push-Up", sets: 3, reps: 12 },
      ],
    },
    null,
    2,
  )}\n`;
}

/** A first-class rest, the same shape the deck and editor already use (TODO §8.6). */
function restItem(seconds, newId) {
  return { id: newId(), type: "rest", rest: seconds };
}

function exerciseItem(raw, newId) {
  const name = pick(raw, "name");
  // The one field an exercise cannot do without: a row with reps but no movement names nothing, and
  // guessing a name would put words in the trainer's programme.
  if (typeof name !== "string" || !name.trim()) return unreadableItem(raw, newId);

  const rawSets = pick(raw, "sets");
  const shorthand = typeof rawSets === "string" ? rawSets.match(SETS_BY_REPS) : null;
  const setCount = shorthand ? Number(shorthand[1]) : (toNumber(rawSets) ?? 1);
  const reps = shorthand ? Number(shorthand[2]) : toNumber(pick(raw, "reps"));
  const weight = toNumber(pick(raw, "weight"));

  const item = {
    id: newId(),
    type: "exercise",
    name: name.trim(),
    // Expanded per set rather than kept as a target triplet, because that is what the live editor
    // and the deck read once a session exists (tests/medium/_harness.py's exercise_item).
    sets: Array.from({ length: Math.max(1, Math.min(setCount, 20)) }, () => ({
      reps,
      weight,
      completed: false,
    })),
  };
  const unit = pick(raw, "unit");
  if (typeof unit === "string") item.loadUnit = unit.trim();
  const notes = pick(raw, "notes");
  if (typeof notes === "string") item.note = notes.trim();
  return item;
}

function toItem(raw, newId) {
  if (!raw || typeof raw !== "object") return unreadableItem(raw, newId);
  const rest = toNumber(pick(raw, "rest"));
  // A rest is recognised by carrying ONLY a rest — an exercise with a rest between its sets is
  // still an exercise, and turning it into a pause would silently drop the movement.
  if (rest !== undefined && pick(raw, "name") === undefined) return restItem(rest, newId);
  return exerciseItem(raw, newId);
}

const refused = (reason) => ({ ok: false, reason, title: "", items: [], unreadable: [] });

/**
 * Read pasted or uploaded text into `{ ok, reason, title, items }`.
 *
 * `newId` is injected so ids stay deterministic in a test and unique in the app; the default is a
 * good-enough local counter, because these ids address rows in an editor that has not saved
 * anything yet — a record that reaches storage is minted by the editor's own save.
 */
export function readProgram(text, { newId = defaultIdMinter() } = {}) {
  if (typeof text !== "string" || !text.trim()) return refused("nothing to read");

  const span = jsonSpan(text);
  if (!span) return refused("no programme data found in that text");

  let parsed;
  try {
    parsed = JSON.parse(span);
  } catch (error) {
    return refused(`that is not readable as a programme (${error.message})`);
  }

  const isBareArray = Array.isArray(parsed);
  if (!isBareArray && parsed?.format && parsed.format !== PROGRAM_FORMAT) {
    return refused(`that file says it is ${parsed.format}, not ${PROGRAM_FORMAT}`);
  }

  const rawItems = isBareArray ? parsed : parsed?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return refused("that programme lists no exercises");
  }

  const items = rawItems.map((raw) => toItem(raw, newId));
  return {
    ok: true,
    reason: "",
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    items,
    // EVERY failure, with its position, reported together (decided 2026-08-18): a trainer who lands
    // in the editor and only then notices three blank rows has been handed a puzzle, while one told
    // "3 of 12 lines could not be read, here they are" can fix the paste or go in knowing what to
    // repair. Positions are 1-based because they are read by a person counting lines.
    unreadable: items
      .map((item, index) => ({ position: index + 1, raw: item.raw, unreadable: item.unreadable }))
      .filter((row) => row.unreadable)
      .map(({ position, raw }) => ({ position, raw })),
  };
}

function defaultIdMinter() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `imported-${Date.now().toString(36)}-${sequence}`;
  };
}
