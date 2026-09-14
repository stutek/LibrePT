// src/modules/clipboard/planSheet.js — the read-only plan sheet drawn UNDER the live clipboard
// (TODO §52.2 step 2): one client's plan for one session, dense and unopenable, revealed while the
// trainer holds the current plan aside (the drag itself is step 3 — this module only draws).
//
// Built with document.createElement + textContent throughout: exercise names, circuit titles and
// any note text are user-authored, and docs/ARCHITECTURE.md's UI invariants forbid innerHTML from
// that text. `buildCircuitUnits` is INJECTED rather than imported: it lives in
// controllers/sessionCircuits.js, a layer above modules/clipboard (agent_tools/import_layers.py),
// so the caller (the step-3 controller) passes its own reference — the exact pattern
// exerciseDeckOfCards.js already uses for the same function.
//
// **The sheet shows what was PLANNED, never what was performed** (ruled 2026-09-14): no ticks, no
// logged values. A signal icon only says a feedback entry exists for that row.

import { compactTargetString } from "../../domain/exerciseModality.js";
import { hasExerciseNote } from "../../domain/quickSignals.js";
import { isRestRecord } from "../../domain/sessionItemRecord.js";

const TOO_EASY_TAG = "Too Easy - Increase Load";
const TOO_HARD_TAG = "Too Hard - Reduce Load";

// Whether a feedback entry names this client + exercise and carries this exact tag — deliberately
// NOT quickSignals.js's hasQuickSignal, which only counts an untouched quick-tap: a row that was
// both tagged and noted must still show both icons, and the sheet never toggles anything, so there
// is no "safe to un-tap" question to answer here.
function hasTag(feedback, clientId, exerciseName, tag) {
  return (feedback || []).some(
    (entry) =>
      entry.clientId === clientId && entry.exerciseName === exerciseName && entry.tag === tag,
  );
}

function makeIcon(glyph, label, kind) {
  const icon = document.createElement("i");
  icon.className = `fa-solid ${glyph} plan-sheet-signal plan-sheet-signal-${kind}`;
  icon.setAttribute("aria-label", label);
  return icon;
}

// The signal icons for one exercise row, in the active card's own glyphs (exerciseCard.js):
// fa-feather too easy, fa-weight-hanging too hard, fa-note-sticky a written or voice note. Any
// combination may apply at once, or none.
function buildSignalIcons({ feedback, clientId, name, t }) {
  const icons = [];
  if (hasTag(feedback, clientId, name, TOO_EASY_TAG)) {
    icons.push(makeIcon("fa-feather", t("signal_too_easy"), "easy"));
  }
  if (hasTag(feedback, clientId, name, TOO_HARD_TAG)) {
    icons.push(makeIcon("fa-weight-hanging", t("signal_too_hard"), "hard"));
  }
  if (hasExerciseNote(feedback, clientId, name)) {
    icons.push(makeIcon("fa-note-sticky", t("feedback_has_note"), "note"));
  }
  if (icons.length === 0) return null;
  const wrap = document.createElement("span");
  wrap.className = "plan-sheet-icons";
  for (const icon of icons) wrap.appendChild(icon);
  return wrap;
}

// One exercise row: name, then its target right after the name (never pushed to the right edge —
// only the left part of the sheet is uncovered while the current plan is held aside), then any
// signal icons.
function buildExerciseRow(item, { feedback, clientId, t }) {
  const row = document.createElement("div");
  row.className = "plan-sheet-row";

  const name = document.createElement("span");
  name.className = "plan-sheet-name";
  name.textContent = item.name;
  row.appendChild(name);

  const target = document.createElement("span");
  target.className = "plan-sheet-target";
  target.textContent = compactTargetString({
    setsTarget: item.setsTargetCount,
    repsTarget: item.repsTarget,
    metric: item.metric || "reps",
    modality: item.modality || "strength",
    weightTarget: item.weightTarget,
    loadUnit: item.loadUnit,
  });
  row.appendChild(target);

  const icons = buildSignalIcons({ feedback, clientId, name: item.name, t });
  if (icons) row.appendChild(icons);

  return row;
}

// One rest row: the deck's own rest word and duration (restDeckCard.js says the same "Rest 90s").
function buildRestRow(item, { t }) {
  const row = document.createElement("div");
  row.className = "plan-sheet-row plan-sheet-row-rest";

  const name = document.createElement("span");
  name.className = "plan-sheet-name";
  name.textContent = t("rest_label");
  row.appendChild(name);

  const target = document.createElement("span");
  target.className = "plan-sheet-target";
  target.textContent = `${item.rest}s`;
  row.appendChild(target);

  return row;
}

function buildRow(item, ctx) {
  return isRestRecord(item) ? buildRestRow(item, ctx) : buildExerciseRow(item, ctx);
}

// One BLOCK: a circuit's head row (title + round count, e.g. "3×") plus one row per member, or a
// single standalone item with no head row.
function buildBlock(unit, ctx) {
  const block = document.createElement("div");
  block.className = "plan-sheet-block";

  if (unit.type === "circuit") {
    const head = document.createElement("div");
    head.className = "plan-sheet-row plan-sheet-head";

    const title = document.createElement("span");
    title.className = "plan-sheet-name";
    title.textContent = unit.title || ctx.t("combo_round_title");
    head.appendChild(title);

    const rounds = document.createElement("span");
    rounds.className = "plan-sheet-target";
    rounds.textContent = `${unit.series}×`;
    head.appendChild(rounds);

    block.appendChild(head);
    for (const member of unit.items) block.appendChild(buildRow(member, ctx));
  } else {
    block.appendChild(buildRow(unit, ctx));
  }

  return block;
}

/**
 * Render one client's plan for one session as a dense, read-only sheet.
 *
 * `items`: normalised plan items in the shape `clientState.exercises` carries (see
 * src/domain/sessionPlanFactory.js) — exercise items (name, setsTargetCount, repsTarget,
 * weightTarget, loadUnit, modality, metric, and circuitId/circuitTitle/circuitSeries when part of a
 * circuit) and rest items ({type:"rest", rest, circuitId...}).
 * `feedback`: the session's feedback entries ({clientId, exerciseName, tag, note}).
 * `when`: "past" | "future" — which temporal colour the exercise names take.
 * `buildCircuitUnits`: injected grouping function (controllers/sessionCircuits.js) — see this
 * file's header for why it cannot be imported directly.
 */
export function renderPlanSheet({ items, feedback = [], clientId, when, t, buildCircuitUnits }) {
  const sheet = document.createElement("div");
  sheet.className = `plan-sheet is-${when}`;

  const units = buildCircuitUnits(items || []);
  const ctx = { feedback, clientId, t };
  for (const unit of units) sheet.appendChild(buildBlock(unit, ctx));

  return sheet;
}
