// src/data/crashReport.js — what a crash report contains, and what it must never contain (TODO §12.4).
//
// Single responsibility: turn a thrown thing into a payload that is safe to publish, keep a bounded log
// of them, and build the prefilled issue link. Installing the listeners is
// controllers/appLifecycleController.js; showing the offer is the notification feed.
//
// **The issue tracker is public, and that decides the whole design.** A stack is safe; the state around
// it is not — a client's name, their notes, their injuries (§17.3). So the payload is non-identifying
// **by construction**: it is built from a fixed list of safe fields, and anything else a caller hands
// over is dropped. A redaction pass that strips known-bad keys is the alternative, and it fails the
// first time someone adds a field nobody remembered to strip.
//
// **Nothing is ever sent.** There is no server and no telemetry: automatic reporting would be an
// unannounced egress of a trainer's data. A report is OFFERED as a prefilled issue URL, which the
// trainer reads on GitHub and submits themselves — the review happens there, on a page that shows them
// exactly what they are about to publish.
//
// **The route travels because routes are durable** (UC5): the failing URL is the best reproduction
// instruction there is, and its ids are opaque — `/clients/0192f3a4b5` says nothing about a person.
//
// **A repeat does not fill the log with copies of itself.** A render loop throwing every frame would
// otherwise evict every other report, including the one explaining how it started; identical crashes
// collapse into one entry with a count.
//
// deps: none — pure functions over plain values.

// Where a report goes is not this module's fact to own — it is the repository's, and the header links to
// the same place. Re-exported so existing callers keep one import (data/publicUrls.js is the declaration).
export { ISSUE_TRACKER_URL } from "./publicUrls.js";

/** Small on purpose: this is a diagnostic aid, not a log file, and it must never grow into the storage
 *  budget (§18.6). */
export const MAX_KEPT_CRASHES = 5;

// A URL has a length limit and an issue body has a human reader. The top of a stack is the part that
// identifies the bug; the tail is framework noise.
const MAX_STACK_CHARACTERS = 2000;
const MAX_MESSAGE_CHARACTERS = 300;

function describe(thrown) {
  if (thrown instanceof Error) return thrown.message || thrown.name || "Error";
  if (typeof thrown === "string" && thrown.trim()) return thrown;
  // `throw "string"`, a rejected promise with no reason, a thrown object — all real, and a reporter
  // that fails on them is worse than the original bug.
  if (thrown === null) return "Something threw null";
  if (thrown === undefined) return "Something threw undefined";
  try {
    return `Non-error thrown: ${JSON.stringify(thrown)}`;
  } catch {
    return "Non-error thrown";
  }
}

/**
 * The publishable payload: `{ message, stack, route, build, at }` and nothing else, ever.
 *
 * Extra properties on `context` are dropped rather than copied — that is the construction the privacy
 * claim rests on.
 */
export function buildCrashReport(thrown, { route = "", buildSha = "", at = "" } = {}) {
  return {
    message: describe(thrown).slice(0, MAX_MESSAGE_CHARACTERS),
    stack: String(thrown?.stack || "").slice(0, MAX_STACK_CHARACTERS),
    route,
    build: buildSha,
    at,
  };
}

/** Adds a report to the bounded log, collapsing an identical repeat into a count. */
export function recordCrash(log, report) {
  const entries = log || [];
  if (!report) return entries;

  const previous = entries.find(
    (entry) => entry.message === report.message && entry.stack === report.stack,
  );
  if (previous) {
    return entries.map((entry) =>
      entry === previous ? { ...entry, count: (entry.count || 1) + 1, at: report.at } : entry,
    );
  }
  return [...entries, { ...report, count: 1 }].slice(-MAX_KEPT_CRASHES);
}

/**
 * The prefilled issue link a trainer opens, reviews and submits — or does not.
 *
 * Empty string when there is nothing to report or nowhere to report it, so a caller renders no control
 * rather than a dead one.
 */
export function crashIssueUrl(report, repoUrl) {
  if (!report?.message || !repoUrl) return "";

  const body = [
    "**What happened**",
    "",
    "<!-- What were you doing when this appeared? -->",
    "",
    "**Details LibrePT filled in**",
    "",
    `- Build: \`${report.build || "unknown"}\``,
    `- Page: \`${report.route || "unknown"}\``,
    `- When: ${report.at || "unknown"}`,
    "",
    "```",
    report.stack || report.message,
    "```",
  ].join("\n");

  const url = new URL(`${repoUrl.replace(/\/+$/, "")}/issues/new`);
  url.searchParams.set("title", `Crash: ${report.message}`);
  url.searchParams.set("body", body);
  return url.toString();
}
