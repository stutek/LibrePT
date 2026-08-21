// src/modules/demo/storyNarration.js — the story's narration surface: cards, persona label, captions
// (TODO §35.1).
//
// Single responsibility: what the viewer READS while the story plays. It owns no steps and no timing
// — demoTourPlayer.js taps, domain/demoStory.js decides which steps run, and this draws the words
// around them.
//
// **The paper track is TEXT on a paper-textured card, never a picture of a form** (§35.1). Parts of
// the story happen on paper — a printed consent signed and filed — and the temptation is to draw the
// form. Everything else in this demo is the live app, so a drawn surface among them reads as a real
// screen, and the first viewer who goes looking for it in the app has been misled. The card SAYS
// what happens on paper, over a texture that marks it as narration.
//
// **The card is DISMISSED, not timed out.** A step's tap is what closes it, which is what lets a
// narrated beat carry a real expectation (§35.1: the card was on screen and could be dismissed)
// instead of being a pause the player hopes was long enough to read.
//
// **The persona label is permanent while a persona is on screen.** One persona at a time was the
// ruling (§35.1) — no split screen — so the only thing telling a viewer whose phone they are looking
// at is this label. The app looks the same on both sides of a handover.
//
// **Built with createElement, never innerHTML**, like demoHand.js: nothing here is interpolated into
// markup, so there is no escaping question for build/frontend_audit.py to reason about and no CSP
// exposure. Every string arrives through `t`.
//
// **The last card is where the story hands the app over** (TODO §30.2, wanted 2026-08-18): a thank
// you, and the two ways onward that already exist — keep exploring, or clear the demo data. Both are
// reused rather than rebuilt: dismissing IS "play around", and the cleanup dialog is the one the
// demo notice in the feed already opens.
//
// Injected dependencies: `doc` (defaults to `document`), `t`, and `onClearDemoData` (optional — the
// second way onward; the button is left out entirely when no caller offers one, rather than
// rendering a control that does nothing).

const CARD_ID = "story-card";
const CONTINUE_ID = "story-card-continue";
const PERSONA_ID = "story-persona";
const CAPTION_ID = "story-caption";

function element(doc, tag, className, id) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (id) node.id = id;
  return node;
}

function buildCard(doc, t, onClearDemoData) {
  const card = element(doc, "div", "story-card", CARD_ID);
  // A live region: the card replaces its own text between beats without focus ever moving, so a
  // screen reader has nothing else to notice the change by.
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");
  card.hidden = true;

  const kicker = element(doc, "p", "story-card-kicker");
  const title = element(doc, "h2", "story-card-title");
  const body = element(doc, "p", "story-card-body");
  const button = element(doc, "button", "btn btn-primary story-card-continue", CONTINUE_ID);
  button.type = "button";
  button.textContent = t("story_continue");
  button.addEventListener("click", () => {
    card.hidden = true;
  });

  // The second way onward. Hidden until a card asks for it, because it is an offer only the last
  // beat of the story is entitled to make.
  // The `.hidden` CLASS, not the `hidden` attribute: every `.btn` in this app sets
  // `display: flex`, which beats the UA stylesheet's `[hidden]` rule — the same trap that once left
  // the intake page's send button on screen after it was hidden (TODO §26.7).
  const cleanup = element(
    doc,
    "button",
    "btn secondary-btn story-card-cleanup hidden",
    "story-card-cleanup",
  );
  cleanup.type = "button";
  cleanup.textContent = t("story_clear_demo_data");
  cleanup.addEventListener("click", () => {
    card.hidden = true;
    onClearDemoData?.();
  });

  card.append(kicker, title, body, button, cleanup);
  return { card, kicker, title, body, button, cleanup };
}

/** Mounts the narration surface and returns `{ showStep, unmount }`.
 *
 * `showStep` is called BEFORE each step is performed, so a narrated step finds its card already on
 * screen and can tap Continue — the player's own hand, on a real control, like every other beat.
 */
export function mountStoryNarration({ doc = document, t, onClearDemoData } = {}) {
  const existing = doc.getElementById(CARD_ID);
  if (existing) existing.remove();

  const { card, kicker, title, body, cleanup } = buildCard(doc, t, onClearDemoData);
  const persona = element(doc, "p", "story-persona", PERSONA_ID);
  persona.hidden = true;
  const caption = element(doc, "p", "story-caption", CAPTION_ID);
  caption.setAttribute("role", "status");
  caption.hidden = true;

  doc.body.append(persona, caption, card);

  function showStep(step) {
    if (step?.persona) {
      persona.textContent = t(step.persona);
      persona.hidden = false;
    }

    if (step?.narrate) {
      // The kind is a look, not a branch in behaviour: paper narration is textured, a chapter
      // opening is plain, and both are the same card being read and dismissed.
      card.className = `story-card story-card--${step.narrate.kind}`;
      kicker.textContent = step.narrate.kickerKey ? t(step.narrate.kickerKey) : "";
      title.textContent = t(step.narrate.titleKey);
      body.textContent = t(step.narrate.bodyKey);
      cleanup.classList.toggle("hidden", !(step.narrate.onward && onClearDemoData));
      card.hidden = false;
      // A caption under a card would be the same beat said twice, in two places.
      caption.hidden = true;
      return;
    }

    card.hidden = true;
    if (step?.caption) {
      caption.textContent = t(step.caption);
      caption.hidden = false;
    }
  }

  function unmount() {
    card.remove();
    persona.remove();
    caption.remove();
  }

  return { showStep, unmount };
}
