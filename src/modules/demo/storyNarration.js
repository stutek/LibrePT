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
// **A card belongs to the step it introduces, not to a step of its own.** Asking a guide to
// demonstrate "tap Continue" spends three seconds moving a pointer to a button already under the
// reader's thumb, which is indistinguishable from the guide doing nothing (reported 2026-08-22). So
// the card is shown WITH the step it explains, and the trainer's first tap — on Continue, or on the
// control the step is about — takes it away.
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

import { isGuideSurface } from "../common/dom.js";

const CARD_ID = "story-card";
const CONTINUE_ID = "story-card-continue";
const PERSONA_ID = "story-persona";

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

  // The handover (TODO §35.1/§35.3e). One persona at a time was the ruling, and the client's screens
  // are the REAL ones — so a beat that moves to the client's phone moves the BROWSER, to the page a
  // client would actually open. A drawn "client phone" would be a recording with extra steps, stale
  // the day that page changes.
  const handover = doc.createElement("a");
  handover.id = "story-card-handover";
  handover.className = "btn btn-primary story-card-handover hidden";
  card.append(kicker, title, body, button, cleanup, handover);
  return { card, kicker, title, body, button, cleanup, handover };
}

/** Mounts the narration surface and returns `{ showStep, unmount }`.
 *
 * `showStep` is called BEFORE each step is performed, so a narrated step finds its card already on
 * screen and can tap Continue — the player's own hand, on a real control, like every other beat.
 */
export function mountStoryNarration({ doc = document, t, onClearDemoData } = {}) {
  const existing = doc.getElementById(CARD_ID);
  if (existing) existing.remove();

  const { card, kicker, title, body, cleanup, handover } = buildCard(doc, t, onClearDemoData);
  const persona = element(doc, "p", "story-persona", PERSONA_ID);
  persona.hidden = true;

  doc.body.append(persona, card);

  // A card is READ and then got out of the way: acting on the app is what says it has been read, so
  // the first tap anywhere else dismisses it (reported 2026-08-22 — a card sitting over the control
  // its own step points at). Capture phase, so the tap still reaches the app underneath.
  doc.addEventListener(
    "pointerdown",
    (event) => {
      if (card.hidden) return;
      // The GUIDE is not the app: a tap on its panel — Show me, Next — is not the trainer acting on
      // what the card is about, and taking the card away there breaks the very step being
      // demonstrated (the pointer then reaches for a button that is no longer on screen). The same
      // distinction the plan editor's tap-outside rule had to learn the same day.
      if (isGuideSurface(event.target)) return;
      if (!card.contains(event.target)) card.hidden = true;
    },
    true,
  );

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
      const goTo = step.narrate.continueUrl;
      handover.classList.toggle("hidden", !goTo);
      if (goTo) {
        handover.href = goTo;
        handover.textContent = t(step.narrate.continueLabelKey || "story_continue");
      }
      card.hidden = false;
      return;
    }

    card.hidden = true;
  }

  function unmount() {
    card.remove();
    persona.remove();
  }

  return { showStep, unmount };
}
