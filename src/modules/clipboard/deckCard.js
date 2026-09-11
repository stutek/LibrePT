// src/modules/clipboard/deckCard.js — base class for one renderable unit in the active-session
// deck: a past-session reference, a standalone rest, a standalone exercise, or a circuit.
// Single responsibility: the shared skeleton every deck card follows (one card design, plus what
// focus adds to it, plus tap-to-focus). A subclass supplies its one template and its action wiring.
//
// Mirrors src/controllers/routes/route.js's Route base class (see docs/ROUTING.md §2): Template
// Method — render() is the fixed skeleton, subclasses implement renderCard/addFocusElements —
// plus Replace Conditional with Polymorphism: exerciseDeckOfCards.js's dispatch becomes "construct the
// right subclass," not an if/else chain re-branching on item.type at every render/click/focus
// decision. What each card type does when collapsed, when focused, and which actions it exposes
// lives once, in that subclass — not as a scattered `if (isRestItem(x))` guard in shared code.
//
// ctx: the render context threaded to every card — see exerciseDeckOfCards.js's own header for the shape.

export class DeckCard {
  constructor(item, ctx) {
    this.item = item;
    this.ctx = ctx;
  }

  // Whether this card currently shows its expanded template. Default reads item.isInFocus, which
  // exerciseDeckOfCards.js now computes uniformly from activeExerciseIndex for every item type — rests
  // included, since a rest is a first-class focus target like any other plan item. A subclass
  // overrides this getter when its own "focus" means something else entirely (PastDeckCard's is
  // expandedPastId, orthogonal to activeExerciseIndex) — that override is the whole point of
  // polymorphism here: no call site needs to know which rule applies to which card.
  get isInFocus() {
    return !!this.item.isInFocus;
  }

  // Whether this card DRAWS its expanded template. Focus implies it; "expand all" grants it to every
  // card at once (TODO §42), asked for by a trainer who could not see the plan at a glance.
  //
  // **Kept apart from `isInFocus` on purpose.** Focus is a fact about the session — which item the
  // trainer is on — and it decides the tint, the ring and, below, what a card may DO. Expansion is
  // only about how much of the card is drawn. Folding the two together would have every card
  // claiming to be in focus and, worse, wired as if it were.
  get isExpanded() {
    return this.isInFocus || !!this.ctx.expandAll;
  }

  get className() {
    return "exercise-deck-card";
  }

  // The fixed skeleton — subclasses never override this, only the three hooks below.
  //
  // **One design, opened up — never a second design swapped in** (ruled 2026-09-10, TODO §42.3).
  // Every card draws the SAME markup in every state; focus then ADDS its controls to that markup.
  // Until then each card type carried two full templates, and they drifted: the collapsed exercise
  // row said "S4 × R6 × 60kg" on one line while the focused card threw that line away and said the
  // same three numbers again as a block of big tiles. Tapping a card therefore replaced what the
  // trainer was reading instead of opening it, and the two templates had to be kept in agreement by
  // hand — which is how the status tag ended up in a different place in each (§42.5).
  //
  // Three states, still. A card that is expanded but NOT in focus is this same design laid flat out
  // of the stack, and it carries nothing to tap — not because its controls are stripped afterwards,
  // but because `addFocusElements` never ran. That is the safety argument for expand-all on a gym
  // floor made structural: twelve open cards with live Too Easy / Too Hard / timer buttons put a
  // mis-tap one thumb-width from logging against the wrong exercise, and no code path can draw one.
  render(card) {
    card.className = this.className;
    // Added here rather than in every subclass's own className: expansion is a deck-wide state, and
    // the stylesheet needs it to stop overlapping and tilting a card that is now laid out flat.
    if (this.isExpanded && !this.isInFocus) card.classList.add("expanded");
    this.renderCard(card);
    if (this.isInFocus) {
      this.addFocusElements(card);
      this.wireFocused(card);
      return;
    }
    this.wireCollapsed(card);
  }

  // The card, in the one design it has. Drawn for every state.
  renderCard(_card) {
    throw new Error("renderCard must be implemented by a DeckCard subclass");
  }

  // What focus ADDS to that card — the timer, the signal buttons, a Start, a history panel. It
  // appends to what renderCard drew and never rewrites it. A card type with nothing to add leaves
  // this as the no-op it is.
  addFocusElements(_card) {}

  // Most focused cards wire their own buttons (timer, feedback, complete-round, …); a subclass with
  // nothing of its own simply leaves this as a no-op.
  wireFocused(_card) {}

  // Shared collapsed behaviour: a tap brings THIS card into focus, and does nothing else — no
  // subclass may start a timer or log anything from its collapsed state. A subclass overrides this
  // only when "collapsed" means a different action entirely (PastDeckCard toggles its own review
  // panel, not the shared focus index).
  wireCollapsed(card) {
    card.addEventListener("click", () => this.ctx.onFocus(this.item.index));
  }
}
