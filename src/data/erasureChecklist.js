// src/data/erasureChecklist.js — the part of an erasure LibrePT cannot perform, itemised.
//
// Art. 17 binds the CONTROLLER, not the app. The trainer holds the client's personal data in places
// this software has never touched: their calendar, their sent mail, their phone, the paper in a
// drawer. An in-app erasure that reports "done" is therefore a lie of omission — the honest output
// is "here is what I erased, and here is what only you can". This module is that second list.
//
// It is generated from state rather than being a static paragraph, because a checklist that lists
// surfaces the trainer never used trains them to skim it. Sessions only produce a calendar item if
// sessions exist; the sent-mail item only appears if there was an address to have written to.
//
// The items are NOT all the same kind of unreachable, and conflating them would misplan the
// roadmap. The **gym calendar** is reachable — it sits on the same Google grant the app already
// asks for, and only waits on Calendar integration (TODO §1.5), at which point erasure must fan out
// to it automatically and the item disappears from this list. **Mail and SMS never are**: a
// `mailto:`/`sms:` hands a draft to the trainer's own client and forgets it, by design, so no
// version of this app will ever reach into a sent folder. Each item says which it is.
//
// Injected dependencies: none — pure derivation from state.

/**
 * @returns {{id: string, surface: string, action: string, why: string, blocking: boolean}[]}
 *   `blocking` marks the items that leave IDENTIFYING data intact if skipped, as opposed to the
 *   ones that are hygiene. A trainer triaging under time pressure needs that distinction; without
 *   it, the calendar entry titled "Jane Doe — 07:00" ranks equal with clearing a downloads folder.
 *
 *   `reach` is the roadmap fact rather than the user-facing one: "app" — already done for you;
 *   "planned" — reachable on a grant the app already asks for and simply not built yet (the gym
 *   calendar, TODO §1.5); "never" — no software could do it, because it lives in the trainer's own
 *   mail or messaging app or in a file already written; "paper" — the item that must deliberately
 *   NOT be erased.
 */
export function externalErasureChecklist(state, client, { driveConfigured = false } = {}) {
  const items = [];
  const sessions = (state?.sessions || []).filter((session) =>
    (session.participants || []).includes(client?.id),
  );

  if (sessions.length > 0) {
    items.push({
      id: "calendar",
      surface: "The gym calendar",
      action: `Open the ${sessions.length} event${sessions.length === 1 ? "" : "s"} for this client and remove their name from the title and guest list.`,
      // NOT a permanent limitation, and the distinction matters for planning: the gym/room calendar
      // is reached through the trainer's OWN OAuth grant (TODO §1.5), so once Calendar integration
      // lands this fan-out becomes the app's job and this item disappears. Today LibrePT only hands
      // the trainer an .ics to send themselves (sessionInviteDialog.js), so it is manual.
      why: "The gym calendar is reachable on the same Google grant the app already asks for — but LibrePT does not write to Calendar yet (TODO §1.5), so today this is manual.",
      reach: "planned",
      blocking: true,
    });
    items.push({
      id: "client-calendar",
      surface: "The client's own calendar",
      action:
        "Nothing to do — an invite they accepted is a record in their account, and that copy is theirs, not yours to erase.",
      why: "Outside the controller's reach entirely, on any platform.",
      reach: "never",
      blocking: false,
    });
  }

  if (client?.email) {
    items.push({
      id: "sent-mail",
      surface: "Your sent mail",
      action:
        "Delete the consent letter, invites and any data export you emailed to this client — and empty the trash afterwards.",
      why: "Permanently out of reach: a `mailto:` hands the draft to your own mail client and forgets it. LibrePT holds no mail credential and never will.",
      reach: "never",
      blocking: true,
    });
  }

  if (client?.phone) {
    items.push({
      id: "messages",
      surface: "Your phone",
      action: "Delete the SMS thread and the contact entry if you added one.",
      why: "Permanently out of reach, for the same reason as mail — the SMS is composed in your own messaging app.",
      reach: "never",
      blocking: true,
    });
  }

  if (driveConfigured) {
    items.push({
      id: "drive",
      surface: "Cloud sync",
      action: "Run a sync now, so the anonymised records replace the copy in your Drive.",
      why: "Reachable, and one tap: the sync writes the whole snapshot, so the anonymised records replace the named ones.",
      reach: "app",
      blocking: true,
    });
  }

  items.push({
    id: "backups",
    surface: "Backup files",
    action:
      "Delete any backup or export file you saved before today. LibrePT will re-anonymise this client if one is ever restored, but the file itself still names them until you delete it.",
    // The suppression list (erasureSuppression.js) is what makes a restore safe; it does nothing
    // about the file sitting in a Downloads folder or an email attachment.
    why: "A file already written is outside the database this app controls — no software can reach into a Downloads folder or a sent attachment.",
    reach: "never",
    blocking: true,
  });

  items.push({
    id: "consent-paper",
    surface: "The signed consent form",
    action: "KEEP it. Do not destroy this one.",
    why: "It is your evidence that the processing up to today was lawful (Art. 7(1)), retained to defend a legal claim (Art. 17(3)(e)) — the one document an erasure request does not sweep away.",
    reach: "paper",
    blocking: false,
  });

  return items;
}

/** The checklist as plain text, for the receipt a trainer files or pastes into their own records. */
export function renderErasureReceipt(summary, checklist, client) {
  const lines = [
    "LibrePT — erasure receipt",
    `Client: ${summary.pseudonym} (was: withheld from this receipt on purpose)`,
    `Requested: ${summary.requestedOn || "—"}`,
    `Actioned: ${summary.erasedAt}`,
    "",
    "Erased in the app:",
    "- client record: name, contact, goals, notes, injuries, body-weight history",
    `- ${summary.history} training record(s) and ${summary.planUpdates} plan update(s) re-labelled`,
    `- ${summary.sessions} session(s) checked; ${summary.scrubbedTextFields} free-text field(s) rewritten`,
  ];

  if (summary.namesakes?.length > 0) {
    lines.push(
      "",
      `⚠ Another client shares this name (${summary.namesakes.length}). Shared free text was NOT`,
      "  rewritten automatically, because a rewrite could have hit the wrong person's session.",
    );
  }
  if (summary.reviewSessionIds?.length > 0) {
    lines.push(
      `⚠ ${summary.reviewSessionIds.length} session title(s) still mention this name and need a`,
      `  manual check: ${summary.reviewSessionIds.join(", ")}`,
    );
  }

  lines.push("", "Still yours to do:");
  for (const item of checklist) {
    // The reach marker travels into the receipt because a trainer re-reading it in six months
    // should not have to re-derive why the calendar was manual — by then it may not be.
    const marker = item.reach === "planned" ? " (manual until Calendar integration lands)" : "";
    lines.push(`${item.blocking ? "[ ]" : "[i]"} ${item.surface}: ${item.action}${marker}`);
  }
  lines.push("", `Prepared for client id …${String(client?.id || "").slice(-6)}.`);
  return lines.join("\n");
}
