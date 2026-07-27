// src/modules/clipboard/deckCard.js — base class for one renderable unit in the active-session
// deck: a past-session reference, a standalone rest, a standalone exercise, or a circuit.
// Single responsibility: the shared skeleton every deck card follows (collapsed vs. focused
// dispatch, tap-to-focus). A subclass supplies its own two templates and its own action wiring.
//
// Mirrors src/controllers/routes/route.js's Route base class (see docs/ROUTING.md §2): Template
// Method — render() is the fixed skeleton, subclasses implement renderFocused/renderCollapsed —
// plus Replace Conditional with Polymorphism: exerciseDeck.js's dispatch becomes "construct the
// right subclass," not an if/else chain re-branching on item.type at every render/click/focus
// decision. What each card type does when collapsed, when focused, and which actions it exposes
// lives once, in that subclass — not as a scattered `if (isRestItem(x))` guard in shared code.
//
// ctx: the render context threaded to every card — see exerciseDeck.js's own header for the shape.

export class DeckCard {
  constructor(item, ctx) {
    this.item = item;
    this.ctx = ctx;
  }

  // Whether this card currently shows its expanded template. Default reads item.isInFocus, which
  // exerciseDeck.js now computes uniformly from activeExerciseIndex for every item type — rests
  // included, since a rest is a first-class focus target like any other plan item. A subclass
  // overrides this getter when its own "focus" means something else entirely (PastDeckCard's is
  // expandedPastId, orthogonal to activeExerciseIndex) — that override is the whole point of
  // polymorphism here: no call site needs to know which rule applies to which card.
  get isInFocus() {
    return !!this.item.isInFocus;
  }

  get className() {
    return "exercise-deck-card";
  }

  // The fixed skeleton — subclasses never override this, only the four hooks below.
  render(card) {
    card.className = this.className;
    if (this.isInFocus) {
      this.renderFocused(card);
      this.wireFocused(card);
    } else {
      this.renderCollapsed(card);
      this.wireCollapsed(card);
    }
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
