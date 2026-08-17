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
// Synthetic items lead the feed for that reason: outstanding work outranks FYI.
//
// Pure (TODO §24.7): state in, item list out. Rendering it, persisting which items have been read,
// and reacting to a tap all belong to the module that owns the DOM.

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

export function resolveNotificationItems(state, t, readIds = [], syncFailure = null) {
  const synthetic = [
    // A fault leads: it is the only item here reporting that something the trainer asked for did
    // not happen.
    buildSyncFailureItem(syncFailure, t),
    buildRsvpAnswersItem(state, t),
    buildUnscheduledPlansItem(state, t),
    buildPendingSessionsItem(state, t),
  ]
    .filter(Boolean)
    .map((item) => ({ ...item, read: readIds.includes(item.id) }));
  const stored = (state.notifications || []).map((notification) =>
    resolveStoredItem(notification, t, readIds),
  );
  return [...synthetic, ...stored];
}
