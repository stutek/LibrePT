// src/data/sessionEventPayload.js — the thing that travels between two phones (TODO §1.6).
//
// One canonical event shape, and the codec that puts it in a URL. Everything about HOW it gets
// there — a text message, a mail compose, a share sheet, a scanned code — belongs to a transport
// (modules/common/eventTransports.js) and is deliberately unknown here. That split is the whole
// point: a new transport is then a new file, not a new payload format, and a change to what an
// invite CONTAINS does not have to be made four times.
//
// **The wire format is a contract, so it is versioned and its keys are short.** Someone will scan a
// code or open a text weeks after it was sent, against a build that has moved on: `v` is what lets
// that build recognise a payload it cannot read instead of misreading it. The single-letter keys are
// not cleverness — the budget is real. A QR that scans reliably phone-to-phone holds about 300
// bytes, and an SMS segment is 160 characters; `sessionId` spelled out four times is a measurable
// fraction of that. This is also why the program never travels: a session summary fits in every
// budget, a twelve-exercise program fits in none of them.
//
// **Decoding is parsing hostile input.** A payload arrives from a link a stranger could have
// written, so `decodeSessionEvent` returns null for anything it does not fully recognise rather than
// throwing or half-trusting. It never reflects unknown keys through, which is what keeps a crafted
// payload from smuggling a field into whatever the handler writes to storage.
//
// deps: none — pure functions over plain objects and strings.

/** An invitation to a session: everything the recipient needs to see it and add it to a calendar. */
export const SESSION_INVITE = "invite";
/** An answer to one: the whole point of the round trip. */
export const SESSION_RSVP = "rsvp";

const FORMAT_VERSION = 1;

// Guards a decoded payload against absurd input — a link is attacker-supplied, and the fields below
// end up in the DOM and in storage. Generous enough that no honest session is near them.
const MAX_TEXT_LENGTH = 200;
const MAX_ENCODED_LENGTH = 4096;

const RSVP_ANSWERS = new Set(["yes", "no", "maybe"]);

// The wire keys, in one table, so the two directions can never disagree about them. Read as
// "short name on the wire ↔ the name the app uses".
const INVITE_FIELDS = {
  s: "sessionId",
  c: "clientId",
  t: "title",
  w: "startsAt",
  d: "durationMinutes",
  l: "location",
  o: "organizerEmail",
  n: "organizerName",
};
const RSVP_FIELDS = {
  s: "sessionId",
  c: "clientId",
  a: "answer",
};

const FIELDS_BY_KIND = {
  [SESSION_INVITE]: INVITE_FIELDS,
  [SESSION_RSVP]: RSVP_FIELDS,
};

// Which fields are numbers, decided by the FORMAT rather than by what arrived. Reading the type off
// the incoming value instead let `startsAt: "soon"` through as a string, which every consumer would
// then have done date arithmetic on.
const NUMERIC_FIELDS = new Set(["startsAt", "durationMinutes"]);

function toUrlSafeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** The compact, URL-safe string a transport carries. Returns null for an event it cannot represent,
 * because a half-encoded invite is worse than an obvious refusal to send one. */
export function encodeSessionEvent(event) {
  const fields = FIELDS_BY_KIND[event?.kind];
  if (!fields || !event.sessionId) return null;

  const payload = { v: FORMAT_VERSION, k: event.kind };
  for (const [wireKey, name] of Object.entries(fields)) {
    const value = event[name];
    if (value === undefined || value === null || value === "") continue;
    payload[wireKey] = value;
  }

  const json = JSON.stringify(payload);
  return toUrlSafeBase64(new TextEncoder().encode(json));
}

function readText(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) return undefined;
  return trimmed;
}

function readNumber(value) {
  return Number.isFinite(value) ? value : undefined;
}

// Every field is read through one of the two readers above and copied by NAME — an unknown wire key
// is dropped rather than passed along, so a crafted payload cannot add a property to the object a
// handler is about to persist.
function readFields(payload, fields) {
  const event = {};
  for (const [wireKey, name] of Object.entries(fields)) {
    const raw = payload[wireKey];
    const value = NUMERIC_FIELDS.has(name) ? readNumber(raw) : readText(raw);
    if (value !== undefined) event[name] = value;
  }
  return event;
}

/** The event a link carries, or null if it carries anything else. Never throws: the input is a
 * string from a URL, and every way of it being wrong is ordinary rather than exceptional. */
export function decodeSessionEvent(encoded) {
  if (typeof encoded !== "string" || !encoded || encoded.length > MAX_ENCODED_LENGTH) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromUrlSafeBase64(encoded)));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (payload.v !== FORMAT_VERSION) return null;

  const fields = FIELDS_BY_KIND[payload.k];
  if (!fields) return null;

  const event = { kind: payload.k, ...readFields(payload, fields) };
  if (!event.sessionId) return null;
  if (event.kind === SESSION_RSVP && !RSVP_ANSWERS.has(event.answer)) return null;
  return event;
}

/** How many bytes this event costs on the wire — the number every transport is budgeted against
 * (a reliably scannable QR is ~300 bytes; an SMS segment is 160 characters). Exposed so a transport
 * can refuse a payload it cannot honestly carry rather than producing one that fails to scan. */
export function encodedSize(event) {
  return encodeSessionEvent(event)?.length ?? 0;
}
