// src/data/feedbackRoute.js — where a trainer's feedback goes, and what travels with it (TODO §23.5).
//
// Single responsibility: the address, and the two messages built for it. No DOM — the dialog that
// shows this is modules/common/feedbackRouteDialog.js.
//
// **Why this exists at all.** The only route out of this app was a GitHub issue, and to a personal
// trainer that is a wall: an account, a login, a form written for developers. §23.5 called it the
// last launch prerequisite. An email address is the route that needs nothing from them.
//
// **Bugs still belong in an issue, and the dialog says so.** An email thread about a bug has no
// version, no page, no way for anyone else to find it later; an issue has all three and stays
// readable by the next person who hits the same thing. So the split is by KIND, not by preference:
// ideas, questions and "this is awkward" go to the address, and something broken goes to an issue —
// with a screenshot, which is the one thing the app cannot capture for them (see below).
//
// **What travels: the build, the page, the language, the screen. Nothing else.** A fixed field list
// rather than "everything we can find", the same rule data/crashReport.js follows: a pass that
// strips known-bad keys fails the first time someone adds a field nobody remembered to strip. None
// of these four says anything about a client.
//
// Injected dependencies: none — pure functions over plain values.

export const FEEDBACK_EMAIL = "LibrePT.adm@gmail.com";

/** The environment lines a report is worth having, in one place because both routes carry them. */
export function diagnosticsBlock({ build = "", route = "", lang = "", screen = "" } = {}) {
  return [
    `- Build: ${build || "unknown"}`,
    `- Page: ${route || "unknown"}`,
    `- Language: ${lang || "unknown"}`,
    `- Screen: ${screen || "unknown"}`,
  ].join("\n");
}

/** The `mailto:` a trainer's feedback leaves through.
 *
 * The body is PREFILLED and then theirs to edit — including the diagnostics, which they can see and
 * delete. Sending something about a person's own app without showing them what it contains would be
 * the opposite of what this app is for.
 */
export function feedbackMailto({ subject, intro, diagnostics }) {
  const body = [intro, "", "", "---", diagnostics].join("\n");
  const url = new URL(`mailto:${FEEDBACK_EMAIL}`);
  url.searchParams.set("subject", subject);
  url.searchParams.set("body", body);
  // `mailto:` predates URLSearchParams' `+`-for-space encoding, and mail clients show the plus
  // signs literally — a body full of them reads as broken software before anyone has read a word.
  return url.toString().replace(/\+/g, "%20");
}

/** The prefilled GitHub issue for something BROKEN, with the screenshot asked for in words.
 *
 * Empty string when there is nowhere to send it, so a caller renders no control rather than a dead
 * one — the same rule crashReport.js's issue link follows.
 */
export function bugIssueUrl({ repoUrl, title, whatHappened, diagnostics }) {
  if (!repoUrl) return "";
  const body = [
    "**What happened**",
    "",
    whatHappened,
    "",
    "**A screenshot**",
    "",
    "<!-- Please attach one: drag the image into this box. It is the single most useful thing in a",
    "     bug report, and the app cannot take it for you — a web page may not photograph a screen",
    "     without asking, and on a phone the app is not what is doing the asking. -->",
    "",
    "**Details LibrePT filled in**",
    "",
    diagnostics,
  ].join("\n");
  const url = new URL(`${String(repoUrl).replace(/\/+$/, "")}/issues/new`);
  url.searchParams.set("title", title);
  url.searchParams.set("body", body);
  return url.toString();
}
