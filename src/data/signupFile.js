// src/data/signupFile.js — the submission as a FILE, which is how it travels (TODO §1.7).
//
// Single responsibility: bytes and a filename in, a submission out, and back. What a submission
// *contains* is [clientSignup.js](clientSignup.js); who it is handed to is a transport
// (modules/intake/signupDelivery.js). This module is the one that knows the wire artifact.
//
// **A file, not a link — ruled 2026-08-17 (Simon: "use shares").** `navigator.share({ files })` puts
// it straight into the client's own mail or messaging app, and three things follow. Nothing crosses a
// carrier as a URL, so the health detail a client chooses to offer is not sitting in a message
// history or a server log. The file is a **retainable artifact** — wording version, language, the date
// they ticked — which is far better Art. 7(1) evidence than a query parameter. And there is no size
// budget, so a signature or a photo becomes possible later without redesigning the format.
//
// **A media type AND a distinctive extension, because the mechanisms key off different things**
// (decided 2026-08-17, §1.7): an Android share intent routes on the MIME type, an OS file association
// routes on the extension, and email frequently relabels the type to `application/octet-stream` — so
// only the extension survives that hop. Declaring both is not redundancy. One media type per handling
// surface rather than one generic type with a `kind` field inside, per [AGENT_RULES](../../AGENT_RULES.md) §5.9.
//
// **The file is plain, readable JSON on purpose.** It is a person's own data about themselves, in
// transit between their phone and their trainer's; a format they cannot open would make the artifact
// less trustworthy, not more. Encryption here would need a key exchange, which needs the server this
// project does not have (§26.8), and the review dialog is the trust boundary instead.
//
// deps: none — strings and plain objects. The caller builds the `File`/`Blob`, so this stays testable
// without a browser.

import { SIGNUP_FORMAT_VERSION, parseClientSignup } from "./clientSignup.js";

/** RFC 6838 vendor tree + RFC 6839 `+json` suffix. One type for one handling surface. */
export const SIGNUP_MEDIA_TYPE = "application/vnd.librept.signup+json";

/** The half of the declaration that survives an email gateway relabelling the MIME type. */
export const SIGNUP_FILE_EXTENSION = ".librept-signup.json";

// Double-suffixed deliberately: `.librept-signup` carries the association, and the trailing `.json`
// keeps the file openable by anything a client or trainer already has when the association is absent —
// which it is on every desktop and on iOS. A file nobody can open is not evidence of anything.

const MAX_FILE_BYTES = 64 * 1024;

/** A filename that says whose introduction this is and when it was made, because it lands in an inbox
 *  next to everything else a trainer receives. Sanitised hard: the name is client-supplied text, and
 *  this string becomes a path on someone else's device. */
export function signupFileName(signup, isoDate) {
  const person = (signup?.name || "client")
    .normalize("NFKD")
    // Letters, digits and single dashes only. Everything else — separators, dots, quotes, control
    // characters, RTL overrides — is what turns a filename into a traversal or a spoofed extension.
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(isoDate || "") ? isoDate : "";
  return `${person || "client"}${date ? `-${date}` : ""}${SIGNUP_FILE_EXTENSION}`;
}

/** The file's text. Pretty-printed, because the client may well open it before sending — it is their
 *  own data, and a wall of minified JSON invites the suspicion that something else is in there. */
export function serializeSignupFile(signup) {
  if (!signup || signup.v !== SIGNUP_FORMAT_VERSION) return null;
  return `${JSON.stringify(signup, null, 2)}\n`;
}

/**
 * The submission a received file holds, or null for anything else — an unrelated JSON file, a
 * truncated attachment, a crafted payload, or a version this build does not know.
 *
 * Never throws. The trainer picked this file out of an inbox; a stray tap on the wrong attachment is
 * an ordinary event, not an exceptional one, and it must produce a readable refusal rather than a
 * stack trace over a live app.
 */
export function readSignupFile(text) {
  if (typeof text !== "string" || !text || text.length > MAX_FILE_BYTES) return null;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return parseClientSignup(parsed);
}
