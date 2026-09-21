// src/domain/notificationItems.js — what the notification feed says, derived from app state.
//
// The feed mixes two kinds of item, and the distinction is the reason this is worth its own module:
//
//   • STORED items come from `state.notifications` and carry i18n KEYS (`titleKey`/`descKey`), not
//     text — resolved on every read so the feed re-localises when the trainer switches language
//     rather than freezing whatever language it was written in.
//   • SYNTHETIC items are computed fresh on every render and never stored anywhere. They are not
//     messages, they are WORK the trainer still owes a client — a plan drafted but never scheduled,
//     feedback signals nobody has reviewed. Storing them would mean maintaining a second copy of a
//     truth that already lives in `state.history` / `state.planUpdates`, and the two would drift.
//
// Synthetic items lead the feed for that reason: outstanding work outranks FYI. The ONE exception
// is the demo-mode notice — see DEMO_NOTICE_TYPE below.
//
// Pure (TODO §24.7): state in, item list out. Rendering it, persisting which items have been read,
// and reacting to a tap all belong to the module that owns the DOM.

import { crashIssueUrl } from "../data/crashReport.js";
import { escapedTestRecords } from "../data/seedProvenance.js";
import { walkthroughDataPresent } from "./walkthroughReadiness.js";

/**
 * Test data in the trainer's own database — the loudest item in the feed (TODO §46.7).
 *
 * The rows the browser suite seeds through `?init=demo_data_load` are stamped `test`
 * (data/seedProvenance.js). Finding one on a boot that carries no such switch means it is not a
 * test run and those rows are sitting in the trainer's records, where a sample client can be
 * mistaken for a real one and a sample session can be trained.
 *
 * Nothing here decides whether a test is running — no page can. The caller passes `testRun`, which
 * is simply whether THIS boot carries the switch, and `sandbox`, where sample data belongs.
 */
export function buildEscapedTestDataItem(state, t, { sandbox = false, testRun = false } = {}) {
  if (sandbox || testRun) return null;
  const { count, collections } = escapedTestRecords(state);
  if (count === 0) return null;
  return {
    id: "synthetic-escaped-test-data",
    type: "test-data-escaped",
    icon: "fa-solid fa-triangle-exclamation",
    title: t("notif_test_data_escaped_title") || "Test records are in your data",
    description: (
      t("notif_test_data_escaped_desc") ||
      "{count} record(s) written by a test run are stored with your own work, in {collections}. They are not yours and can be removed."
    )
      .replace("{count}", String(count))
      .replace("{collections}", collections.join(", ")),
    actions: [{ labelKey: "notif_test_data_escaped_btn", resetDemo: true, primary: true }],
  };
}

// A planning-mode session is never "finished" (it has no Start/Complete footer), so it lives on in
// state.history as `isPlanning: true` — which means it survives being replaced by the next session
// the trainer opens, but they have no other place to rediscover it. One action per plan resumes it.
export function buildUnscheduledPlansItem(state, t) {
  const plans = (state.history || []).filter((entry) => entry.isPlanning);
  if (plans.length === 0) return null;
  const fallbackTitle = t("planned_program") || "Planned Program";
  return {
    id: "synthetic-unscheduled-plans",
    type: "planning",
    icon: "fa-solid fa-clipboard-list",
    title: t("notif_unscheduled_plans_title") || "Unscheduled plans",
    description: (
      t("notif_unscheduled_plans_desc") ||
      "{count} plan(s) drafted but not yet assigned to a session."
    ).replace("{count}", String(plans.length)),
    actions: plans.map((plan) => ({
      label: `${plan.title || fallbackTitle} · ${plan.clientName || ""}`,
      resumePlanId: plan.id,
    })),
  };
}

// `state.planUpdates` already IS the Pending Plan Adjustments feature's durable store
// (`resolved: false` = awaiting the trainer's review). This re-presents that same data grouped by
// CLIENT — cross-referenced to state.sessions for a friendlier label where one exists — so it
// surfaces here too, not only in the dedicated Adjustments view every action links to.
export function buildPendingSessionsItem(state, t) {
  const unresolved = (state.planUpdates || []).filter((update) => !update.resolved);
  if (unresolved.length === 0) return null;

  const byClient = new Map();
  for (const update of unresolved) {
    if (!byClient.has(update.clientId)) byClient.set(update.clientId, []);
    byClient.get(update.clientId).push(update);
  }

  const sessions = state.sessions || [];
  const labelFor = (clientId, clientName) => {
    const session = sessions.find((entry) => (entry.participants || []).includes(clientId));
    return session ? `${clientName} — ${session.title}` : clientName;
  };

  return {
    id: "synthetic-pending-sessions",
    type: "alert",
    icon: "fa-solid fa-triangle-exclamation",
    title: t("notif_pending_sessions_title") || "Sessions awaiting review",
    description: (
      t("notif_pending_sessions_desc") ||
      "{count} client(s) have unresolved feedback signals from a session."
    ).replace("{count}", String(byClient.size)),
    actions: [...byClient.entries()].map(([clientId, updates]) => ({
      label: `${labelFor(clientId, updates[0].clientName)} (${updates.length})`,
      view: "/adjustments",
    })),
  };
}

// A stored record resolved into displayable text. `url`/`view`/`primary`/`icon`/`type` pass through
// untouched; only the strings are looked up, and only when the record chose to carry a key.
function resolveStoredItem(notification, t, readIds) {
  return {
    id: notification.id,
    type: notification.type,
    icon: notification.icon,
    title: notification.titleKey ? t(notification.titleKey) : notification.title || "",
    description: notification.descKey ? t(notification.descKey) : notification.description || "",
    actions: (notification.actions || []).map((action) => ({
      label: action.labelKey ? t(action.labelKey) : action.label || "",
      url: action.url,
      view: action.view,
      resetDemo: action.resetDemo,
      startWalkthrough: action.startWalkthrough,
      primary: action.primary,
    })),
    read: readIds.includes(notification.id),
  };
}

// A failed sync needs a home OUTSIDE the Sync & Backup dialog (TODO §3.11): once tapping the header
// cloud syncs directly instead of opening that dialog, a failure reported only inside it would be a
// failure nobody sees, and "tap to sync" would become "tap and hope". The header glyph turns into a
// warning triangle, but a triangle cannot say WHY — that is this item's job.
//
// Deliberately synthetic, never written to `state.notifications`: a stored one would ride into the
// backup file and the Drive snapshot, and would itself count as a local change — a failed sync would
// increment the very "ahead" counter it failed to clear.
//
// The id carries the failure's timestamp so each distinct failure arrives unread. A fixed id would
// be marked read once and then stay silent for every failure after it.
export function buildSyncFailureItem(syncFailure, t) {
  if (!syncFailure) return null;
  return {
    id: `synthetic-sync-failure-${syncFailure.at}`,
    type: "warning",
    icon: "fa-solid fa-triangle-exclamation",
    title: t("notif_sync_failed_title") || "Cloud sync failed",
    description: syncFailure.message,
    actions: [],
  };
}

// Answers that came back (TODO §1.6). Synthetic for the same reason the two above are: the answer
// already lives on the invitation, and a stored copy would ride into the backup and the Drive
// snapshot as a second source of truth for one fact.
//
// It exists because tapping a reply link is otherwise an invisible act — the trainer opens a message,
// the app writes a record, and nothing on screen says so. This is what says so.
//
// An answer from a client no longer in the register is still reported: they may have been erased
// (§27.2) between answering and the trainer opening the link, and the answer is a fact about an
// invitation rather than about a row that has to still exist.
export function buildRsvpAnswersItem(state, t) {
  const answered = (state?.invites || []).filter((invite) => invite.answer);
  if (answered.length === 0) return null;

  const nameFor = (clientId) =>
    (state.clients || []).find((client) => client.id === clientId)?.name ||
    t("notif_rsvp_unknown_client") ||
    "A client";
  const lines = answered.map(
    (invite) =>
      `${nameFor(invite.clientId)}: ${t(`rsvp_answer_${invite.answer}`) || invite.answer}`,
  );

  return {
    // Keyed on the answers themselves, so a NEW answer arrives unread rather than being silenced by
    // a "mark read" the trainer tapped for an earlier one.
    id: `synthetic-rsvp-${answered.map((invite) => `${invite.id}:${invite.answer}`).join("|")}`,
    type: "info",
    icon: "fa-solid fa-envelope-circle-check",
    title: t("notif_rsvp_title") || "RSVP replies",
    description: lines.join(" · "),
    actions: [],
  };
}

// A crash the trainer can report (TODO §12.4). Offered, never sent: there is no server, an issue is
// public, and automatic reporting would be an unannounced egress of a trainer's data. The action is a
// link to a PREFILLED issue the trainer reads on GitHub before submitting — the review happens on the
// page that shows them exactly what they are about to publish.
//
// It lives in the feed rather than in a dialog because of §12.4's own warning: a handler that renders a
// modal over a live session mid-set is worse than the original bug. The feed waits.
//
// Null with nowhere to report to, so a build with no tracker configured renders no control rather than
// a dead one.
export function buildCrashReportItem(crashes, t, repoUrl) {
  const latest = (crashes || [])[crashes?.length - 1];
  if (!latest) return null;
  const href = crashIssueUrl(latest, repoUrl);
  if (!href) return null;

  const repeated = (latest.count || 1) > 1;
  return {
    // Keyed on the crash itself, so a NEW one arrives unread rather than being silenced by a "mark
    // read" the trainer tapped for an earlier one.
    id: `synthetic-crash-${latest.message}-${latest.count || 1}`,
    type: "alert",
    icon: "fa-solid fa-bug",
    title: t("notif_crash_title") || "Something went wrong",
    description: repeated ? `${latest.message} (${latest.count}\u00d7)` : latest.message,
    // `url`, the field the feed's action renderer already understands — a second name for "a link"
    // would render as a dead button with no href at all.
    actions: [{ label: t("notif_crash_report") || "Report this", url: href }],
  };
}

// The two stored types that report the same kind of news — who is coming and who is not — and so
// belong on one card rather than one each (TODO §28.10). An evening where three clients rearrange
// used to push everything else off a phone screen.
const SCHEDULE_CHURN_TYPES = new Set(["reservation", "cancellation"]);

// The stored item that says "this is sample data", and the one thing that outranks outstanding work
// (wanted 2026-08-25). Everything else in the feed is a claim about the trainer's own gym — bookings
// they must answer, plans they owe someone — and reading any of it before knowing it is a fiction
// is reading it wrong. It is also the collapsed drawer's summary line and the only way back to the
// guided demo and the cleanup screen, so burying it under a demo-generated booking hides both.
const DEMO_NOTICE_TYPE = "demo-mode";

/**
 * Every booking and cancellation folded into one item, taking the place of the FIRST of them.
 *
 * Position matters: the demo-mode notice leads the whole feed (DEMO_NOTICE_TYPE) because it is what
 * a trainer reads while the drawer is collapsed, so grouping must not float the group above it.
 *
 * A single arrival is left exactly as it was — its own title and its own description — because a
 * lone cancellation grouped with nothing reads worse as "Schedule changes: 1" than as itself.
 *
 * The id is keyed on the members, like the RSVP item above and for the same reason: a booking that
 * lands after the trainer dismissed yesterday's cancellations is news, and must not inherit that
 * dismissal.
 */
function groupScheduleChurn(resolved) {
  const churn = resolved.filter((item) => SCHEDULE_CHURN_TYPES.has(item.type));
  if (churn.length < 2) return resolved;

  const grouped = {
    id: `grouped-schedule-${churn.map((item) => item.id).join("|")}`,
    type: "schedule",
    icon: "fa-solid fa-calendar-day",
    title: churn[0].title,
    // One line per arrival, in the order they were stored — a list a trainer reads top to bottom,
    // not a count they have to open something to expand.
    description: churn.map((item) => item.description).join("\n"),
    actions: churn.flatMap((item) => item.actions),
    read: churn.every((item) => item.read),
  };

  const [first] = churn;
  return resolved
    .filter((item) => !SCHEDULE_CHURN_TYPES.has(item.type) || item === first)
    .map((item) => (item === first ? grouped : item));
}

/**
 * The demo notice, rewritten for the sandbox (TODO §42.10).
 *
 * The stored record was written when sample data lived in the trainer's own database: it tells them
 * to clear it before doing real work, and offers a button that does. In the sandbox both are wrong.
 * There is nothing to clear — the sandbox is the safe place — and clearing would empty the very
 * thing they came to look at. What a trainer in there actually needs is the way OUT, and the app is
 * the only thing that can tell them: it names the menu and the item, because a step that asks for an
 * action says the action and names the control.
 */
function forSandbox(item, t, chapters) {
  // The destructive one goes; "show me around" stays, because the sandbox is where it belongs.
  const actions = (item.actions || []).filter((action) => !action.resetDemo);
  return {
    ...item,
    title: t("notif_sandbox_title") || item.title,
    description: t("notif_sandbox_desc") || item.description,
    actions,
    // The story's chapters, offered under that button as a table of contents (asked for
    // 2026-09-21): the story is six chapters and four to six minutes, and a trainer who wants to see
    // the evening after a session should not have to watch the morning first. Only alongside the
    // button itself — where the walkthrough cannot run at all, an index of its chapters would be six
    // offers the app cannot honour.
    chapters: actions.some((action) => action.startWalkthrough) ? chapters : [],
  };
}

export function resolveNotificationItems(
  state,
  t,
  readIds = [],
  syncFailure = null,
  { crashes = [], repoUrl = "", sandbox = false, testRun = false, chapters = [] } = {},
) {
  const synthetic = [
    // A fault leads: it is the only item here reporting that something the trainer asked for did
    // not happen.
    buildSyncFailureItem(syncFailure, t),
    // A crash outranks the RSVPs below it but not a failed sync: both are faults, and the sync one is
    // about the trainer's data being at risk right now.
    buildCrashReportItem(crashes, t, repoUrl),
    buildEscapedTestDataItem(state, t, { sandbox, testRun }),
    buildRsvpAnswersItem(state, t),
    buildUnscheduledPlansItem(state, t),
    buildPendingSessionsItem(state, t),
  ]
    .filter(Boolean)
    .map((item) => ({ ...item, read: readIds.includes(item.id) }));
  // An offer the store cannot honour is worse than no offer: the guided demo drives real controls,
  // so on a database missing what its steps need it stops on the first one, in front of the person
  // being shown the product (TODO §28.14).
  const canWalkThrough = walkthroughDataPresent(state);
  const stored = groupScheduleChurn(
    (state.notifications || [])
      .map((notification) => resolveStoredItem(notification, t, readIds))
      .map((item) => ({
        ...item,
        actions: item.actions.filter((action) => canWalkThrough || !action.startWalkthrough),
      })),
  );
  const demoNotice = stored
    .filter((item) => item.type === DEMO_NOTICE_TYPE)
    .map((item) => (sandbox ? forSandbox(item, t, chapters) : item));
  return [...demoNotice, ...synthetic, ...stored.filter((item) => item.type !== DEMO_NOTICE_TYPE)];
}
