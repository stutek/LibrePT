// src/modules/common/eventTransports.js — how an event LEAVES this device (TODO §1.6).
//
// A transport is one way to hand a link to a person: a text message, a mail compose, the system
// share sheet, the clipboard. Each one knows two things and nothing else — whether it can be used
// right now, and how to hand over a link. What the link CONTAINS is
// `data/sessionEventPayload.js`'s business, and neither side has to know about the other.
//
// **Why a registry rather than four buttons wired by hand.** LibrePT has no backend, so every route
// out of the app is somebody's messaging app, and which ones exist depends on the device (`share`
// only on mobile), on the recipient (no phone number, no SMS) and on the session. Written as
// branches at the call site, that check would be repeated in every surface that sends anything, and
// each copy would drift. Written here, a new transport — a scannable code, a Google Calendar
// invitation once the scope exists — is a new entry in one list.
//
// **Platform calls are injected, never reached for.** `navigator.share`, `clipboard.writeText` and
// opening a URL are supplied as a `platform` object, so these are testable without a browser and
// a transport cannot quietly acquire a dependency on the DOM.
//
// deps: `platform` = { openUrl, share, writeText, canShare } — see `browserPlatform()`.

import { encodeSessionEvent } from "../../data/sessionEventPayload.js";

/** One SMS segment is 160 GSM-7 characters; a message longer than this is split by the carrier and
 * some of them mangle or truncate long links. Not a hard refusal — a two-segment invite is fine and
 * normal — but the number a caller checks before choosing SMS for a large payload. */
export const SMS_SEGMENT_CHARACTERS = 160;

/** The query parameter an inbound event arrives on. One name, shared by every transport and by
 * whoever reads it back, because a link already sent cannot be renamed. */
export const EVENT_PARAM = "evt";

/** The link that carries an event. `baseUrl` is injected rather than derived from `location`, so a
 * caller decides which origin the recipient should land on (the deployed app, not whatever host the
 * trainer happens to be running). Returns null when the event cannot be represented. */
export function buildEventLink(event, baseUrl) {
  const encoded = encodeSessionEvent(event);
  if (!encoded || !baseUrl) return null;
  const url = new URL(baseUrl);
  url.searchParams.set(EVENT_PARAM, encoded);
  return url.toString();
}

/** The real platform. Kept separate from the transports so tests never touch it. */
export function browserPlatform() {
  return {
    openUrl: (url) => {
      window.location.href = url;
    },
    share: (data) => navigator.share(data),
    canShare: () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    writeText: (text) => navigator.clipboard.writeText(text),
  };
}

// A `target` is who the event is going to: `{ name, email, phone }`, any of which may be missing —
// a client record carries both fields optionally, and a gym is often only an inbox.
const TRANSPORTS = [
  {
    id: "sms",
    labelKey: "transport_sms",
    // The channel clients actually answer on, which is why it leads. The `?&body=` shape is
    // deliberate: iOS historically wanted `&`, Android `?`, and this form is honoured by both.
    // Prefill is still inconsistent across Android OEMs — the NUMBER is respected everywhere, the
    // text is not — so the worst case is an empty message addressed to the right person, which the
    // trainer can paste into. Never nothing.
    isAvailable: (target) => Boolean(target?.phone),
    send: (link, { target, message, platform }) =>
      platform.openUrl(
        `sms:${encodeURIComponent(target.phone)}?&body=${encodeURIComponent(`${message} ${link}`)}`,
      ),
  },
  {
    id: "email",
    labelKey: "transport_email",
    isAvailable: (target) => Boolean(target?.email),
    send: (link, { target, subject, message, platform }) =>
      platform.openUrl(
        `mailto:${encodeURIComponent(target.email)}?subject=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(`${message}\n\n${link}`)}`,
      ),
  },
  {
    id: "share",
    labelKey: "transport_share",
    // The system share sheet: whatever the two of them already use — WhatsApp, Signal, Viber — with
    // no URI scheme to get wrong and no number to have on file. Mobile only, hence the capability
    // check rather than a hardcoded assumption.
    isAvailable: (_target, platform) => platform.canShare(),
    send: (link, { subject, message, platform }) =>
      platform.share({ title: subject, text: message, url: link }),
  },
  {
    id: "copy",
    labelKey: "transport_copy",
    // Always available, and the reason the list can never be empty: a trainer with a link on the
    // clipboard can put it anywhere, including the channels none of the above can reach.
    isAvailable: () => true,
    send: (link, { platform }) => platform.writeText(link),
  },
];

/** The transports usable right now, in the order they should be offered. Never empty — copying a
 * link works everywhere, so a surface built on this always has something to show. */
export function availableTransports(target, platform) {
  return TRANSPORTS.filter((transport) => transport.isAvailable(target, platform));
}

export function transportById(id) {
  return TRANSPORTS.find((transport) => transport.id === id) || null;
}

/** Send `event` to `target` over the named transport. Returns the link that was sent, or null if the
 * event could not be represented — a caller showing "sent" needs to know which happened. */
export function sendEvent(transportId, event, { target, baseUrl, subject, message, platform }) {
  const transport = transportById(transportId);
  const link = buildEventLink(event, baseUrl);
  if (!transport || !link) return null;
  transport.send(link, { target, subject, message, platform });
  return link;
}
