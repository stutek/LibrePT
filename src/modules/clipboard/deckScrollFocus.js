// src/modules/clipboard/deckScrollFocus.js — the trainer's own scrolling picks the ACTIVE card on
// the live clipboard (TODO §48.1). Single responsibility: read which card stands at the focus line
// after a scroll the trainer made, mark it, and report it. What the report DOES to the session
// (close the open card, save, write the URL) is the controller's: `onScrollActivate(index)`.
//
// Only a scroll the trainer made counts. After every render the deck scrolls the open card into
// view by itself; if that scroll moved the highlight, a card opened low on the screen would close
// again at once. So a scroll counts only shortly after a wheel, a touch drag or a scrolling key —
// and a tap cancels that window, because the scroll that follows a tap is the app's.
//
// Keeping the card in place: closing the open card makes it shorter and pulls every card below it
// upward. The card that just became active is measured before the controller re-renders and put
// back at the same height on screen afterwards.

const USER_SCROLL_WINDOW_MS = 800;
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

// One listener set per deck element, however often the deck re-renders; the latest callback wins.
const tracked = new WeakMap();

// The nearest ancestor that actually scrolls. An element styled `overflow-y: auto` whose content
// fits does not scroll, and reading progress off it would pin the focus line to the top.
function scrollerOf(deckContainer) {
  for (let el = deckContainer.parentElement; el; el = el.parentElement) {
    const scrolls = /(auto|scroll)/.test(getComputedStyle(el).overflowY);
    if (scrolls && el.scrollHeight > el.clientHeight) return el;
  }
  return document.scrollingElement;
}

function cardAt(deckContainer, lineY) {
  const cards = deckContainer.querySelectorAll(".exercise-deck-card[data-plan-index]");
  let found = cards[0] || null;
  // Cards overlap in the stack, and a later card is painted over the one before it — so the card
  // at the line is the LAST one whose top has reached it.
  for (const card of cards) {
    if (card.getBoundingClientRect().top <= lineY) found = card;
  }
  return found;
}

// The focus line travels with the scroll: at the top edge while the list is at its start, at the
// bottom edge once it is at its end, and in between it moves in step. A line fixed a third of the
// way down could never be reached by the first cards or the last ones, because the list cannot
// scroll far enough to bring them there (reported 2026-09-13).
function focusLineY(scroller) {
  const isPage = scroller === document.scrollingElement;
  const top = isPage ? 0 : Math.max(scroller.getBoundingClientRect().top, 0);
  const height = isPage ? window.innerHeight : scroller.clientHeight;
  const room = scroller.scrollHeight - scroller.clientHeight;
  const progress = room > 0 ? Math.min(Math.max(scroller.scrollTop / room, 0), 1) : 0;
  return top + height * progress;
}

function onScroll(deckContainer) {
  const entry = tracked.get(deckContainer);
  if (!entry || Date.now() > entry.userScrollUntil || !deckContainer.isConnected) return;
  const scroller = scrollerOf(deckContainer);
  const card = cardAt(deckContainer, focusLineY(scroller));
  if (!card || card.classList.contains("is-active")) return;

  const index = Number(card.dataset.planIndex);
  const topBefore = card.getBoundingClientRect().top;
  for (const other of deckContainer.querySelectorAll(".exercise-deck-card.is-active")) {
    other.classList.remove("is-active");
  }
  card.classList.add("is-active");

  entry.onScrollActivate(index);

  // The controller may have re-rendered the deck: find the same card again and undo the shift.
  const again = deckContainer.querySelector(`.exercise-deck-card[data-plan-index="${index}"]`);
  if (!again || again === card) return;
  // A re-render means the open card closed and the list got shorter. The browser answers that with
  // a scroll of its own, which must not count as the trainer's: it would move the mark straight back.
  entry.userScrollUntil = 0;
  const shift = again.getBoundingClientRect().top - topBefore;
  if (Math.abs(shift) >= 1) scroller.scrollTop += shift;
}

// Called on every deck render. Listeners attach once per deck element.
export function trackDeckScroll(deckContainer, { onScrollActivate }) {
  const existing = tracked.get(deckContainer);
  if (existing) {
    existing.onScrollActivate = onScrollActivate;
    return;
  }
  const entry = { onScrollActivate, userScrollUntil: 0, frame: 0 };
  tracked.set(deckContainer, entry);

  const markUserScroll = () => {
    entry.userScrollUntil = Date.now() + USER_SCROLL_WINDOW_MS;
  };
  window.addEventListener("wheel", markUserScroll, { passive: true });
  window.addEventListener("touchmove", markUserScroll, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (SCROLL_KEYS.has(e.key)) markUserScroll();
  });
  window.addEventListener("pointerdown", () => {
    entry.userScrollUntil = 0;
  });
  // Capture, because a scroll event does not bubble and the scrolling element is an ancestor.
  document.addEventListener(
    "scroll",
    () => {
      if (entry.frame) return;
      entry.frame = requestAnimationFrame(() => {
        entry.frame = 0;
        onScroll(deckContainer);
      });
    },
    { capture: true, passive: true },
  );
}
