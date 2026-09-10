// src/modules/clipboard/deckCard.js — base class for one renderable unit in the active-session
// deck: a past-session reference, a standalone rest, a standalone exercise, or a circuit.
// Single responsibility: the shared skeleton every deck card follows (collapsed vs. focused
// dispatch, tap-to-focus). A subclass supplies its own two templates and its own action wiring.
//
// Mirrors src/controllers/routes/route.js's Route base class (see docs/ROUTING.md §2): Template
// Method — render() is the fixed skeleton, subclasses implement renderFocused/renderCollapsed —
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

  // The fixed skeleton — subclasses never override this, only the four hooks below.
  //
  // Three states, not two. An expanded card that is NOT in focus shows what the focused card shows
  // and behaves like a collapsed one: its controls are removed rather than disabled, and a tap
  // brings it into focus like any other collapsed card. That is the whole safety argument for
  // expand-all on a gym floor — twelve open cards with live Too Easy / Too Hard / timer buttons put
  // a mis-tap one thumb-width from logging against the wrong exercise, and a control that is drawn
  // but inert is worse than either.
  render(card) {
    card.className = this.className;
    // Added here rather than in every subclass's own className: expansion is a deck-wide state, and
    // the stylesheet needs it to stop overlapping and tilting a card that is now full height.
    if (this.isExpanded && !this.isInFocus) card.classList.add("expanded");
    if (this.isInFocus) {
      this.renderFocused(card);
      this.wireFocused(card);
      return;
    }
    if (this.isExpanded) {
      this.renderFocused(card);
      stripControls(card);
      this.wireCollapsed(card);
      return;
    }
    this.renderCollapsed(card);
    this.wireCollapsed(card);
  }

  renderFocused(_card) {
    throw new Error("renderFocused must be implemented by a DeckCard subclass");
  }

  renderCollapsed(_card) {
    throw new Error("renderCollapsed must be implemented by a DeckCard subclass");
  }

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

// Every control a focused card offers, removed from the DOM rather than hidden or disabled — a card
// the trainer cannot act on must not draw the affordance to.
//
// **Every BUTTON, not a list of known classes.** The first version named the action row and the
// timer, which covered the exercise and circuit cards and missed the rest card's Start button
// entirely — it sits in neither container, so an expanded rest card kept a live-looking control that
// did nothing. A rule that has to be extended whenever a template gains a button is a rule that will
// be wrong again; asking for buttons cannot miss one.
function stripControls(card) {
  // Inputs too, not only buttons: a circuit card carries a number field per member for reps
  // taken to failure, and a live field on a card the trainer is only reading writes into
  // another exercise's record exactly as a mis-tapped button would.
  const controls = "button, input, select, textarea, .deck-card-actions";
  for (const control of card.querySelectorAll(controls)) control.remove();
}
