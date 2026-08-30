// src/modules/demo/demoNarratorCard.js — the card the demo narrates with, in all of its kinds
// (TODO §35.1, §38.10).
//
// Single responsibility: what the viewer READS while the demo plays. It owns no steps and no timing
// — demoTourPlayer.js taps, domain/demoStory.js decides which steps run, and this draws the words
// around them.
//
// **One card, several kinds, one definition.** A chapter opening, a message arriving on somebody's
// phone, something that happens on paper, and the guide saying you have wandered off are four
// different things to read and were four different-looking boxes: a `kind` string interpolated into
// a class name, two stylesheet blocks, and a caption line the guide wrote by hand. Asked
// 2026-08-27 to make them one family, so each kind is now a SUBCLASS that declares what it says and
// how it is set, and the base owns everything they share — the shell, the slots, the spacing, and
// the fact that a card is read and then got out of the way.
//
// **A kind nobody draws is caught before it ships.** It used to be a string interpolated into a
// class name, so `kind: "chaper"` produced a real card with no styling and no complaint. Now there
// is a class or there is nothing, and tests/unit_js/modules/demo/demoNarratorCard.test.mjs walks the
// shipped script demanding a class for every kind it names — the layering rules keep the registry
// out of `domain/`, so the script's own validator cannot ask, and a test is what asks instead.
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
// **The story and the guide are ONE card on screen, not two** (reported 2026-08-23). They used to be
// separate boxes: the story's words floated above the middle of the screen with no step number and
// no way back, while the guide's own panel sat at the bottom saying "Step 1 of 31" — so the first
// thing a viewer read looked unnumbered and the second looked mis-numbered. The narration is
// therefore drawn INSIDE the guide's panel, above its caption: one box, one step number, one Back
// button, in reading order — the story, then what to do about it. It falls back to the body when
// there is no panel, which is how it can be mounted and tested on its own.
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
// reused rather than rebuilt: closing the guide IS "play around", and the cleanup dialog is the one
// the demo notice in the feed already opens.
//
// **Crossing to the client's phone is the GUIDE's Next, not a button here** (reported 2026-08-23).
// This card used to carry its own link, which sat beside a Next that advanced the guide past the
// whole client chapter — two buttons, and the plain-looking one did the wrong thing.
//
// Injected dependencies: `doc` (defaults to `document`), `t`, and `onClearDemoData` (optional — the
// second way onward; the button is left out entirely when no caller offers one, rather than
// rendering a control that does nothing).

import { isGuideSurface } from "../common/dom.js";

const CARD_ID = "demo-narrator-card";
const PERSONA_ID = "demo-narrator-persona";
const CLEANUP_ID = "demo-narrator-cleanup";
const ATTACHMENT_ID = "demo-narrator-attachment";

function element(doc, tag, className, id) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (id) node.id = id;
  return node;
}

/** One kind of card the demo shows.
 *
 * The base is everything every card is: a kicker, a title, a paragraph, and — only where a card is
 * entitled to make the offer — the way out of the demo. A subclass declares what makes its kind
 * different, and nothing else. That is the whole point of the hierarchy: adding a kind means saying
 * how it differs, in one place, rather than inventing a class name and hoping a stylesheet
 * somewhere knows about it.
 */
export class DemoNarratorCard {
  /** What a script writes to ask for this card. The base is abstract and names nothing. */
  static kind = "";

  constructor(t) {
    this.t = t;
  }

  /** The modifier that gives this kind its look, derived from the kind so the two cannot drift. */
  get modifier() {
    return `demo-narrator-card--${this.constructor.kind}`;
  }

  /** What this card says, in the three slots every card has. Taken from the script by default —
   *  the guide's own cards override it, because their words are the guide's, not the story's. */
  words(narration) {
    return {
      kicker: narration.kickerKey ? this.t(narration.kickerKey) : "",
      title: this.t(narration.titleKey),
      body: this.t(narration.bodyKey),
    };
  }

  /** The element the body is set in. A paragraph, unless the words belong to somebody else. */
  get bodyTag() {
    return "p";
  }

  /** Whether this card may offer to clear the demo out. Only the closing card is entitled to make
   *  that offer; anywhere earlier it reads as the demo asking to be stopped (§30.2). */
  offersWayOnward(narration) {
    return Boolean(narration?.onward);
  }

  /** Anything this kind draws BESIDE its words. Most kinds draw nothing: a card is a paragraph to
   *  read, and a control on it competes with the one the step is about. */
  extras() {
    return [];
  }
}

/** A chapter opening or closing: the story in its own narrating voice. */
export class ChapterNarratorCard extends DemoNarratorCard {
  static kind = "chapter";
}

/** A message that arrives in some OTHER app — the invitation landing on the client's phone, her
 * file landing on the trainer's. Set as a quotation, because that is what it is: somebody's words,
 * carried into this app from a place the demo cannot show. It used to be a paragraph in italics,
 * which said the same thing to a reader and nothing at all to a screen reader.
 */
export class MessageNarratorCard extends DemoNarratorCard {
  static kind = "message";

  get bodyTag() {
    return "blockquote";
  }
}

/** A SCREENSHOT of the app the file arrived in — the trainer's messaging app, with Ana's message and
 * her attachment in it (TODO §38.22).
 *
 * Asked for 2026-08-30: "zunanjo aplikacijo simuliraj z zaslonsko sliko in kartico razlage". It is
 * drawn rather than photographed for the same reason the paper track is text (§35.1): a picture goes
 * stale the day either app changes, and nobody notices. And it does not break that rule's other half
 * — never draw a surface that could be mistaken for a screen of THIS app — because it is deliberately
 * somebody else's chrome, sitting inside a card that says so.
 *
 * **The attachment is a real button**, and tapping it does what tapping it on a phone does: LibrePT
 * opens with the submission in the review dialog. The demo cannot summon the operating system's
 * share sheet, so the chip stands in for it — and calls the same entry point the share target does,
 * rather than a path invented for the demo.
 */
export class ScreenshotNarratorCard extends DemoNarratorCard {
  static kind = "screenshot";

  extras(doc, narration, { onAttachment }) {
    const attachment = narration?.attachment;
    if (!attachment) return [];
    const chip = doc.createElement("button");
    chip.type = "button";
    chip.id = ATTACHMENT_ID;
    chip.className = "demo-narrator-attachment";
    const clip = doc.createElement("i");
    clip.className = "fa-solid fa-paperclip";
    clip.setAttribute("aria-hidden", "true");
    const name = doc.createElement("span");
    name.textContent = attachment.name;
    chip.append(clip, name);
    chip.addEventListener("click", () => onAttachment?.(attachment));
    return [chip];
  }
}

/** Something that happens on PAPER — a printed consent signed and filed (§35.1). Its texture is its
 * declaration: warm ground, a ruled margin, no app chrome, so it cannot be mistaken for a screen of
 * this app. */
export class PaperNarratorCard extends DemoNarratorCard {
  static kind = "paper";
}

/** The guide saying the trainer has wandered off the demo's place in the app (§38.5).
 *
 * Its words are the GUIDE's, not the script's — the step's own instruction names a control that is
 * not on screen, so repeating it would be a lie. It is a card like every other because it is the
 * same act of reading: it used to be a bare caption line beside two buttons, which looked like a
 * different surface arriving at the worst possible moment.
 */
export class OffTrackNarratorCard extends DemoNarratorCard {
  static kind = "off-track";

  words() {
    return {
      kicker: "",
      title: this.t("walkthrough_off_track_title"),
      body: this.t("walkthrough_off_track"),
    };
  }

  offersWayOnward() {
    return false;
  }
}

// Every kind a script may name, and the class that draws it. The registry is the reason an unknown
// kind is an error rather than an unstyled box: `demoNarratorCardFor` returns nothing for a name
// that is not here, and domain/demoTour.js's validation refuses to play a script that uses one.
const KINDS = new Map(
  [
    ChapterNarratorCard,
    MessageNarratorCard,
    ScreenshotNarratorCard,
    PaperNarratorCard,
    OffTrackNarratorCard,
  ].map((cardClass) => [cardClass.kind, cardClass]),
);

/** Every kind a script may write, for the script's own validation to check against. */
export function demoNarratorCardKinds() {
  return [...KINDS.keys()];
}

/** The card for one kind, or null if nothing draws that kind. */
export function demoNarratorCardFor(kind, t) {
  const cardClass = KINDS.get(kind);
  return cardClass ? new cardClass(t) : null;
}

/** Mounts the narration surface and returns `{ showStep, showOffTrack, unmount }`.
 *
 * `showStep` is called BEFORE each step is performed, so a narrated step finds its card already on
 * screen and can tap Continue — the player's own hand, on a real control, like every other step.
 */
export function mountDemoNarrator({ doc = document, t, onClearDemoData, onAttachment } = {}) {
  doc.getElementById(CARD_ID)?.remove();

  const card = element(doc, "div", "demo-narrator-card", CARD_ID);
  // A live region: the card replaces its own text between steps without focus ever moving, so a
  // screen reader has nothing else to notice the change by.
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");
  card.hidden = true;

  const persona = element(doc, "p", "demo-narrator-persona", PERSONA_ID);
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
      // Only while the card stands on its own. Inside the guide's panel it is a SECTION of the card
      // the trainer is reading, and taking half of that away on the first tap makes the panel jump
      // under a thumb already on its way to a button.
      if (card.closest(".walkthrough-panel")) return;
      if (!card.contains(event.target)) card.hidden = true;
    },
    true,
  );

  /** Re-homes the card into the guide's panel, above its caption.
   *
   * Done at every step rather than once at mount: the guide's panel does not exist yet when the
   * narration mounts, and the panel itself moves between the body and an open dialog to stay
   * reachable in the top layer — the card has to travel with it or the story would be left behind
   * on a page that has gone inert.
   */
  function homeInPanel() {
    const panel = doc.querySelector(".walkthrough-panel");
    if (!panel) return;
    if (card.parentElement !== panel) {
      panel.insertBefore(card, panel.querySelector(".walkthrough-caption"));
    }
    // Whose phone you are looking at belongs NEXT TO the step counter, not on a black tag over the
    // app's own header (reported 2026-08-23: nobody notices it up there, and it sits among the
    // app's real controls as if it were one). In the panel head it is read in the same glance as
    // "step 4 of 49", which is when the question actually comes up.
    const head = panel.querySelector(".walkthrough-head");
    const progress = head?.querySelector(".walkthrough-progress");
    if (progress && persona.parentElement !== head) progress.after(persona);
  }

  /** Draws one card's words into the shell. The shell is stable — it carries the id, the live
   *  region and its place in the panel — and everything inside it belongs to the kind on screen. */
  function draw(narratorCard, narration) {
    const { kicker, title, body } = narratorCard.words(narration);
    card.className = `demo-narrator-card ${narratorCard.modifier}`;
    card.replaceChildren();

    const kickerNode = element(doc, "p", "demo-narrator-kicker");
    kickerNode.textContent = kicker;
    kickerNode.hidden = !kicker;
    const titleNode = element(doc, "h2", "demo-narrator-title");
    titleNode.textContent = title;
    const bodyNode = element(doc, narratorCard.bodyTag, "demo-narrator-body");
    bodyNode.textContent = body;
    card.append(kickerNode, titleNode, bodyNode);

    card.append(...narratorCard.extras(doc, narration, { onAttachment }));

    if (narratorCard.offersWayOnward(narration) && onClearDemoData) {
      const cleanup = element(doc, "button", "btn secondary-btn demo-narrator-cleanup", CLEANUP_ID);
      cleanup.type = "button";
      cleanup.textContent = t("story_clear_demo_data");
      cleanup.addEventListener("click", () => {
        card.hidden = true;
        onClearDemoData();
      });
      card.append(cleanup);
    }
    card.hidden = false;
  }

  function showStep(step) {
    homeInPanel();
    if (step?.persona) {
      persona.textContent = t(step.persona);
      persona.hidden = false;
    }

    const narratorCard = step?.narrate && demoNarratorCardFor(step.narrate.kind, t);
    if (narratorCard) {
      draw(narratorCard, step.narrate);
      return;
    }
    card.hidden = true;
  }

  /** The guide's own card, for when the trainer has walked away from the demo's place in the app.
   *  Shown through the same surface as every other card, so leaving the demo's path does not also
   *  change what the demo looks like. */
  function showOffTrack(offTrack) {
    if (!offTrack) return;
    homeInPanel();
    draw(new OffTrackNarratorCard(t), {});
  }

  function unmount() {
    card.remove();
    persona.remove();
  }

  return { showStep, showOffTrack, unmount };
}
