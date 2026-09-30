// src/modules/clipboard/pastDeckCard.js — the client's most recent past session, shown as a
// tappable reference card in the deck: a compact one-line summary, or (tapped) every set as
// logged. Extracted verbatim from exerciseDeckOfCards.js's inline dispatch (2026-07-27) into the
// DeckCard hierarchy (see deckCard.js).
//
// Its "focus" is deliberately NOT activeExerciseIndex — a past record isn't part of the live plan
// sequence at all — so it overrides `isInFocus` to read `expandedPastId` instead. This is the
// concrete case the polymorphism buys: a call site that just does `card.render(el)` never needs to
// know that THIS card type answers "am I focused?" a different way than every other card does.
//
// ctx: { activeSession, t, escapeHTML, formatLoad, formatReps, formatMetricValue, usesLoad, onRerender }
//
// **Not drawn anywhere at the moment.** Until 2026-09-30 the live deck put the client's last
// session at the top of the exercise stack; it now holds one session's plan and nothing else, and
// the previous session is reached sideways instead. The card is kept whole, with the builder that
// feeds it, for the client's history view: that view draws the same records with a renderer of its
// own today, and is to mount these cards instead.

import { exerciseRecordsOf, isSkippedRecord } from "../../domain/sessionItemRecord.js";
import { formatDateStr } from "../common/utils.js";
import { DeckCard } from "./deckCard.js";

// The items this card is built from. It lists movements only — flatten past rests/circuit
// scaffolding to their exercise leaves (structured records) while legacy flat rows pass through
// unchanged.
//
// It shows what was DONE: a record keeps a skipped movement's prescription as uncompleted sets, and
// listing those read as sets the client performed. A skipped movement says so instead, as the
// client's history page does, and an unfinished set is left out. A set with no flag is a legacy row,
// which only ever stored performed work.
//
// The date is ISO, like every other date in the app. It was once written with
// `toLocaleDateString(..., { month: "short", day: "numeric" })`, which asked the DEVICE how to write
// it and dropped the year: a Slovenian screen read "20. jul." and an English one "Jul 20", neither
// saying which year the set was lifted in.
export function buildPastExerciseItems(pastSession, clientName = "") {
  const dateStr = formatDateStr(pastSession.date);
  const items = [];
  let pIdx = 0;
  for (const ex of exerciseRecordsOf(pastSession.exercises)) {
    const skipped = isSkippedRecord(ex);
    items.push({
      id: `past-${pastSession.id}-${ex.id}-${pIdx}`,
      name: ex.name,
      type: "past",
      sessionDate: dateStr,
      clientName,
      skipped,
      sets: skipped ? [] : (ex.sets || []).filter((set) => set.completed !== false),
      loadUnit: ex.loadUnit || "kg",
      metric: ex.metric || "reps",
      modality: ex.modality || "strength",
      routineName: pastSession.routineName,
    });
    pIdx++;
  }
  return items;
}

export class PastDeckCard extends DeckCard {
  get isInFocus() {
    return this.ctx.activeSession.expandedPastId === this.item.id;
  }

  // Outside the live plan, so neither a tap nor a scroll can make it the active card.
  get focusIndex() {
    return null;
  }

  get className() {
    return `exercise-deck-card past-session${this.isInFocus ? " past-expanded" : ""}`;
  }

  // The card, in every state: the tag, the name and what was lifted, on one row.
  renderCard(card) {
    const { escapeHTML, formatLoad, formatReps, t } = this.ctx;
    const item = this.item;
    const setsSummary = item.skipped
      ? t("skipped")
      : item.sets
          .map((s) => {
            const load = formatLoad(s.weight, item.loadUnit);
            return `${load ? `${load} x ` : ""}${formatReps(s.reps)}`;
          })
          .join(", ");
    card.innerHTML = `
        <div class="deck-card-compact">
          <span class="badge deck-card-status deck-card-status-past">${escapeHTML(t("last_time"))}${item.clientName ? ` · ${escapeHTML(item.clientName)}` : ""}: ${escapeHTML(item.sessionDate)}</span>
          <span class="deck-card-name deck-card-name-inline">${escapeHTML(item.name)}</span>
          <span class="deck-card-compact-target">${escapeHTML(setsSummary)}</span>
        </div>
      `;
  }

  // What opening it adds: every set as it was logged, and the chevron that says it closes again.
  addFocusElements(card) {
    const { escapeHTML, formatLoad, formatReps, formatMetricValue, usesLoad } = this.ctx;
    const item = this.item;
    // Logged history, not a target: every set is listed as-is rather than reduced to one
    // sets/reps/weight triplet, since loads and reps often vary across the sets.
    const metric = item.metric || "reps";
    const showLoad = usesLoad(item.modality || "strength");
    const setRows = item.sets
      .map((s, sIdx) => {
        // Load-bearing modalities (strength, isometric) list a load column; cardio/holds/agility
        // collapse to their single logged magnitude (time/distance/cal/watts/hold) with no load.
        const loadCol = showLoad
          ? `<span class="deck-history-load">${escapeHTML(formatLoad(s.weight, item.loadUnit) || "—")}</span>`
          : "";
        const valueCol =
          metric === "reps"
            ? `${escapeHTML(formatReps(s.reps))} reps`
            : escapeHTML(formatMetricValue(s.reps, metric));
        return `
        <div class="deck-history-set-row">
          <strong>S${sIdx + 1}</strong>
          ${loadCol}
          <span class="deck-history-reps">${valueCol}</span>
          ${s.note ? `<span class="deck-history-note">${escapeHTML(s.note)}</span>` : ""}
        </div>`;
      })
      .join("");
    // Added to the head row the card already drew, never a second head row of its own:
    // reported by a trainer — opening this card used to move its Past tag onto a line above the
    // name, so one card read as two different designs depending on how open it was.
    card
      .querySelector(".deck-card-compact")
      .insertAdjacentHTML(
        "beforeend",
        `<i class="fa-solid fa-chevron-up deck-history-collapse" aria-hidden="true"></i>`,
      );
    card.insertAdjacentHTML(
      "beforeend",
      `
        <div class="deck-history-sets">${setRows}</div>
        <div class="deck-history-meta">${escapeHTML(item.routineName || "Completed Session")}</div>
      `,
    );
  }

  // Both states share one behaviour: tap toggles the review panel open in place — there is no
  // separate "bring into focus, then act" step, unlike every other card type.
  wireFocused(card) {
    card.addEventListener("click", () => this.#toggle());
  }

  wireCollapsed(card) {
    card.addEventListener("click", () => this.#toggle());
  }

  #toggle() {
    const { activeSession, onRerender } = this.ctx;
    activeSession.expandedPastId = this.isInFocus ? null : this.item.id;
    onRerender();
  }
}
