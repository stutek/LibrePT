// src/modules/rsvp/rsvpView.js — the page a client lands on from an invite, where they answer it
// (TODO §1.6's confirm link).
//
// Single responsibility: show the invite and turn a tapped answer into a message addressed to the
// trainer. What an event IS is data/sessionEventPayload.js; how a message leaves the device is
// modules/common/eventTransports.js. This module knows neither format.
//
// **There is no server, so a reply cannot arrive on its own.** The client's answer travels the only
// way a bit of data can here: as a message to the trainer, whose body carries a LibrePT deep link the
// trainer taps once. This page exists to build that message.
//
// **Why a page rather than two links in the invite.** The original sketch put prefilled `mailto:` and
// `sms:` Confirm links directly in the invite body. That works in an email and fails in a text — an
// `sms:` URI inside an SMS body is not linkified by most messaging apps, so the SMS leg would have had
// no working confirm route at all. Both invite channels can carry a plain `https` link, so the reply
// URI is built here, at tap time, once the client has chosen a channel.
//
// **Client-facing, therefore stateless** — the same rule as `/intake` (§26.1): no store, no seed, no
// service worker, no first-run agreement, and nothing written to a phone that is not the trainer's.
// Answering an invite is not a reason to put a database on someone's device.
//
// **The answer is offered only after one is chosen**, because a message that says "here is my reply"
// with no reply in it makes the trainer ask again.
//
// Static markup; every value set with textContent. The invite came out of a URL a stranger could have
// written (build/frontend_audit.py).
//
// Injected dependencies: `encodedEvent`, `t`, `appUrl`, `platform`.

import {
  SESSION_INVITE,
  decodeSessionEvent,
  replyToInvite,
} from "../../data/sessionEventPayload.js";
import { isInviteExpired, minutesUntilExpiry } from "../../domain/inviteExpiry.js";
import { $id, renderMarkupOnce } from "../common/dom.js";
import { buildEventLink } from "../common/eventTransports.js";

export function renderRsvpViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-rsvp"),
    `
<section id="view-rsvp" class="app-view rsvp-view">
      <p class="rsvp-brand">Libre<span class="rsvp-brand-accent">PT</span></p>

      <p id="rsvp-unreadable" class="rsvp-unreadable" hidden></p>

      <div id="rsvp-invite" class="rsvp-invite" hidden>
        <h1 id="rsvp-title" class="rsvp-title"></h1>
        <dl class="rsvp-details">
          <dt id="rsvp-when-label"></dt>
          <dd id="rsvp-when"></dd>
          <dt id="rsvp-where-label" hidden></dt>
          <dd id="rsvp-where" hidden></dd>
          <dt id="rsvp-who-label" hidden></dt>
          <dd id="rsvp-who" hidden></dd>
        </dl>

        <p id="rsvp-expired" class="rsvp-expired" hidden></p>
        <p id="rsvp-deadline" class="rsvp-hint" hidden></p>

        <p id="rsvp-question" class="rsvp-question"></p>
        <div id="rsvp-answers" class="rsvp-answers">
          <button type="button" id="rsvp-yes" class="btn primary-btn rsvp-answer"></button>
          <button type="button" id="rsvp-maybe" class="btn secondary-btn rsvp-answer"></button>
          <button type="button" id="rsvp-no" class="btn secondary-btn rsvp-answer"></button>
        </div>

        <div id="rsvp-send" class="rsvp-send">
          <p id="rsvp-chosen" class="rsvp-chosen" hidden></p>
          <button type="button" id="rsvp-send-sms" class="btn primary-btn rsvp-send-btn hidden"></button>
          <button type="button" id="rsvp-send-email" class="btn secondary-btn rsvp-send-btn hidden"></button>
          <p id="rsvp-send-hint" class="rsvp-hint" hidden></p>
        </div>
      </div>
    </section>
`,
  );
}

const ANSWER_BUTTONS = { "rsvp-yes": "yes", "rsvp-maybe": "maybe", "rsvp-no": "no" };

function showDetail(labelId, valueId, label, value) {
  const labelEl = $id(labelId);
  const valueEl = $id(valueId);
  if (!labelEl || !valueEl) return;
  const present = Boolean(value);
  labelEl.hidden = !present;
  valueEl.hidden = !present;
  if (present) {
    labelEl.textContent = label;
    valueEl.textContent = value;
  }
}

/** The slot in the client's own locale and timezone — they are deciding whether they can be somewhere
 *  at a time, so the one thing that must not be shown is the trainer's clock. */
function formatWhen(startsAt, durationMinutes, lang) {
  if (!startsAt) return "";
  const start = new Date(startsAt);
  const when = start.toLocaleString(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return durationMinutes ? `${when} (${durationMinutes} min)` : when;
}

/** "3 h 20 min" / "45 min" — a duration a person can act on, in their own language. Hours first
 *  because "200 min" is a number nobody converts while standing in a queue. */
function formatRemaining(minutes, t) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} ${t("rsvp_minutes") || "min"}`;
  if (rest === 0) return `${hours} ${t("rsvp_hours") || "h"}`;
  return `${hours} ${t("rsvp_hours") || "h"} ${rest} ${t("rsvp_minutes") || "min"}`;
}

export function setupRsvpReply({ encodedEvent, t, appUrl, platform, lang = "en" }) {
  const invite = decodeSessionEvent(encodedEvent);
  if (!invite || invite.kind !== SESSION_INVITE) {
    const problem = $id("rsvp-unreadable");
    if (problem) {
      problem.textContent = t("rsvp_unreadable");
      problem.hidden = false;
    }
    return null;
  }

  $id("rsvp-invite").hidden = false;
  $id("rsvp-title").textContent = invite.title || t("rsvp_untitled_session");
  showDetail(
    "rsvp-when-label",
    "rsvp-when",
    t("rsvp_when"),
    formatWhen(invite.startsAt, invite.durationMinutes, lang),
  );
  showDetail("rsvp-where-label", "rsvp-where", t("rsvp_where"), invite.location);
  showDetail("rsvp-who-label", "rsvp-who", t("rsvp_who"), invite.organizerName);

  // Expiry, checked once on open against the cutoff the invite carried (domain/inviteExpiry.js). Not
  // polled: this page is opened, answered and closed within a minute or two, and a countdown that
  // flipped to "too late" under someone's thumb mid-tap would be worse than either state.
  //
  // Advisory, and the copy says so rather than claiming a guarantee — two devices, two clocks, and no
  // server to arbitrate. A late answer that reaches the trainer anyway is still recorded, with its
  // response time (§1.6: record the time, do not mark the reply).
  const expired = isInviteExpired(invite.expiresAt, Date.now());
  if (expired) {
    const notice = $id("rsvp-expired");
    notice.textContent = t("rsvp_expired");
    notice.hidden = false;
    // The details above stay on screen: the client still needs to know WHICH session they are too late
    // for, and who to talk to about it.
    $id("rsvp-answers").classList.add("hidden");
    $id("rsvp-send").classList.add("hidden");
    return invite;
  }

  const minutesLeft = minutesUntilExpiry(invite.expiresAt, Date.now());
  if (minutesLeft !== null) {
    const deadline = $id("rsvp-deadline");
    deadline.textContent = `${t("rsvp_deadline")} ${formatRemaining(minutesLeft, t)}`.trim();
    deadline.hidden = false;
  }

  $id("rsvp-question").textContent = t("rsvp_question");
  $id("rsvp-yes").textContent = t("rsvp_yes");
  $id("rsvp-maybe").textContent = t("rsvp_maybe");
  $id("rsvp-no").textContent = t("rsvp_no");
  $id("rsvp-send-sms").textContent = t("rsvp_send_sms");
  $id("rsvp-send-email").textContent = t("rsvp_send_email");
  $id("rsvp-send-hint").textContent = t("rsvp_send_hint");

  let answer = null;

  function chooseAnswer(chosen) {
    answer = chosen;
    for (const [id, value] of Object.entries(ANSWER_BUTTONS)) {
      $id(id)?.classList.toggle("is-chosen", value === chosen);
    }
    const chosenLine = $id("rsvp-chosen");
    chosenLine.textContent = t(`rsvp_chosen_${chosen}`);
    chosenLine.hidden = false;

    // `.hidden` class rather than the property: `.btn` sets `display: flex`, which overrides the UA
    // stylesheet's `[hidden]` rule — the defect a test caught on the intake page the same day.
    // SMS only when the invite told us a number: a dead button is worse than one route that works.
    $id("rsvp-send-sms").classList.toggle("hidden", !invite.organizerPhone);
    $id("rsvp-send-email").classList.toggle("hidden", !invite.organizerEmail);
    $id("rsvp-send-hint").hidden = false;
  }

  /** The message the trainer receives: a sentence a human can act on, then the deep link that saves
   *  them retyping anything. The sentence names the session because it lands in THEIR inbox; the link's
   *  payload names nobody (see replyToInvite). */
  function replyMessage() {
    const reply = replyToInvite(invite, answer);
    const link = buildEventLink(reply, appUrl);
    if (!link) return null;
    const sentence = `${t(`rsvp_message_${answer}`)} ${invite.title || ""}`.trim();
    return { sentence, link };
  }

  $id("rsvp-send-sms")?.addEventListener("click", () => {
    const message = replyMessage();
    if (!message) return;
    // The `?&body=` shape is the one both iOS and Android honour — the same hard-won form
    // consentForm.js and eventTransports.js use.
    platform.openUrl(
      `sms:${encodeURIComponent(invite.organizerPhone)}?&body=${encodeURIComponent(`${message.sentence} ${message.link}`)}`,
    );
  });

  $id("rsvp-send-email")?.addEventListener("click", () => {
    const message = replyMessage();
    if (!message) return;
    platform.openUrl(
      `mailto:${invite.organizerEmail}?subject=${encodeURIComponent(t("rsvp_email_subject"))}` +
        `&body=${encodeURIComponent(`${message.sentence}\n\n${message.link}`)}`,
    );
  });

  for (const [id, value] of Object.entries(ANSWER_BUTTONS)) {
    $id(id)?.addEventListener("click", () => chooseAnswer(value));
  }

  return invite;
}
