// src/modules/clipboard/deckScrollFocus.js — the trainer's own scrolling picks the ACTIVE card on
// the live clipboard (TODO §48.1). Single responsibility: work out which card the scroll has
// reached, mark it, and report it — and give the deck enough room to scroll that every card can be
// reached. What the report DOES to the session (close the open card, save, write the URL) is the
// controller's: `onScrollActivate(index)`.
//
// How far the list has scrolled decides the card, like the wheel of a time picker. The focus point
// is where the FIRST card rests before any scroll; every pixel scrolled past a card's distance from
// the first card brings that card to the point. So at the start the first card is active, and the
// active card stays at the same height on the screen while the cards slide under it. A line fixed
// on the screen could never be reached by the first cards or the last ones (reported 2026-09-13).
//
// Room to scroll: a short list fits on the screen and cannot scroll at all, and a longer one may
// not scroll far enough to bring its last card to the point. The deck gets exactly the missing
// room as padding at its end (`--deck-scroll-room`), measured after every render (asked 2026-09-13).
//
// Only a scroll the trainer made counts. After every render the deck scrolls the open card into
// view by itself; if that scroll moved the mark, a card opened low on the screen would close again
// at once. So a scroll counts only shortly after a wheel, a touch drag or a scrolling key — and a
// tap cancels that window, because the scroll that follows a tap is the app's.
//
// Keeping the card in place: closing the open card makes it shorter and pulls every card below it
// upward. After that re-render the scroll is set to the new active card's distance from the first
// card, so the same card stays active and rests at the focus point.

const USER_SCROLL_WINDOW_MS = 800;
// Cards move their margins for 0.3s after a render (exerciseDeckOfCards.css), so the room is
// measured again once they have settled.
const SETTLED_AFTER_MS = 350;
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
const PLAN_CARDS = ".exercise-deck-card[data-plan-index]";

// One listener set per deck element, however often the deck re-renders; the latest callback wins.
const tracked = new WeakMap();

// The clipboard's scrolling area: the nearest ancestor styled to scroll, whether or not its
// content is tall enough to scroll yet — the room this module adds is what makes it tall enough.
function scrollerOf(deckContainer) {
  for (let el = deckContainer.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return document.scrollingElement;
}

// The last card whose distance from the first card the scroll has covered. Cards overlap in the
// stack and a later card is painted over the one before it, so "last" is the one on top.
function cardAt(deckContainer, scrollTop) {
  const cards = deckContainer.querySelectorAll(PLAN_CARDS);
  if (!cards.length) return null;
  const firstTop = cards[0].getBoundingClientRect().top;
  let found = cards[0];
  for (const card of cards) {
    if (card.getBoundingClientRect().top - firstTop <= scrollTop + 0.5) found = card;
  }
  return found;
}

function fitScrollRoom(deckContainer) {
  if (!deckContainer.isConnected) return;
  const cards = deckContainer.querySelectorAll(PLAN_CARDS);
  const scroller = scrollerOf(deckContainer);
  const current =
    Number.parseFloat(deckContainer.style.getPropertyValue("--deck-scroll-room")) || 0;
  if (cards.length < 2) {
    if (current) deckContainer.style.setProperty("--deck-scroll-room", "0px");
    return;
  }
  const span =
    cards[cards.length - 1].getBoundingClientRect().top - cards[0].getBoundingClientRect().top;
  const roomWithout = scroller.scrollHeight - current - scroller.clientHeight;
  const needed = Math.max(0, Math.ceil(span - roomWithout));
  if (needed !== current) deckContainer.style.setProperty("--deck-scroll-room", `${needed}px`);
}

function onScroll(deckContainer) {
  const entry = tracked.get(deckContainer);
  if (!entry || Date.now() > entry.userScrollUntil || !deckContainer.isConnected) return;
  const scroller = scrollerOf(deckContainer);
  const card = cardAt(deckContainer, scroller.scrollTop);
  if (!card || card.classList.contains("is-active")) return;

  const index = Number(card.dataset.planIndex);
  for (const other of deckContainer.querySelectorAll(".exercise-deck-card.is-active")) {
    other.classList.remove("is-active");
  }
  card.classList.add("is-active");

  entry.onScrollActivate(index);

  // The controller re-renders the deck only when a card was open: find the same card again.
  const again = deckContainer.querySelector(`.exercise-deck-card[data-plan-index="${index}"]`);
  if (!again || again === card) return;
  // A re-render means the open card closed and the list got shorter. The browser answers that with
  // a scroll of its own, which must not count as the trainer's: it would move the mark straight back.
  entry.userScrollUntil = 0;
  // Put the scroll where the new active card's own distance from the first card is, so the same
  // card stays active and rests at the focus point.
  fitScrollRoom(deckContainer);
  const first = deckContainer.querySelector(PLAN_CARDS);
  scroller.scrollTop = again.getBoundingClientRect().top - first.getBoundingClientRect().top;
}

// Called on every deck render. Listeners attach once per deck element.
export function trackDeckScroll(deckContainer, { onScrollActivate }) {
  fitScrollRoom(deckContainer);
  setTimeout(() => fitScrollRoom(deckContainer), SETTLED_AFTER_MS);

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
  window.addEventListener("resize", () => fitScrollRoom(deckContainer), { passive: true });
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
