// src/modules/session/sessionInviteDialog.js
// Dialog shown after a PT assigns new participants to a session (TODO §1.1) — the PT-side
// counterpart to a client self-subscribing via the Google-hosted booking page
// (use_cases/uc4_client_self_subscription.md). Offers each newly-assigned client a calendar
// invite: a downloadable .ics plus a prefilled mailto compose to send it in. LibrePT has no
// backend/SMTP relay (TODO §1.5), so this is the honest, no-network equivalent of Google
// Calendar's own invite email.
//
// deps: { getState, t }

import { buildIcsContent, buildIcsFilename } from "../../data/calendarInvite.js";
import {
  looksLikeEmail,
  readTrainerIdentity,
  writeTrainerIdentity,
} from "../../data/trainerIdentity.js";
import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { downloadFile } from "../common/download.js";

let deps = null;

export function initSessionInviteDialog(d) {
  deps = d;
}

function renderInviteDialogShell() {
  // The markup is injected once, but this function runs on every open — so the listeners below have
  // to be guarded too, or each open stacks another copy of them on the same buttons.
  const alreadyBuilt = Boolean(document.getElementById("dialog-session-invite"));
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-session-invite"),
    `
<dialog id="dialog-session-invite" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="session-invite-title">Send calendar invites</h3>
      <button class="modal-close-btn" aria-label="Close invite dialog"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p id="session-invite-desc" class="dialog-desc"></p>
      <div class="form-group">
        <label for="session-invite-organizer" id="session-invite-organizer-label">Replies come back to</label>
        <input type="email" id="session-invite-organizer" class="form-control" autocomplete="email" placeholder="you@example.com">
        <p id="session-invite-organizer-hint" class="text-sm text-muted"></p>
      </div>
      <div id="session-invite-list"></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn primary-btn modal-cancel">Done</button>
    </div>
  </dialog>
`,
  );
  const dialog = document.getElementById("dialog-session-invite");
  if (!dialog || alreadyBuilt) return;
  for (const btn of dialog.querySelectorAll(".modal-close-btn, .modal-cancel")) {
    btn.addEventListener("click", () => closeModal("dialog-session-invite"));
  }
  dialog
    .querySelector("#session-invite-organizer")
    ?.addEventListener("input", () => renderOrganizerHint(deps.t));
}

// The organizer address is read at CLICK time, not when the dialog opened: the trainer typing their
// address is very often the last thing they do before sending the first invite, and capturing it at
// render would put an invite with no return address into exactly that case.
function currentOrganizer() {
  const typed = document.getElementById("session-invite-organizer")?.value.trim() || "";
  return looksLikeEmail(typed) ? typed : "";
}

// Persisted on the way out rather than on every keystroke — a half-typed address is not an address,
// and `readTrainerIdentity` promises that whatever it returns is one.
function rememberOrganizer() {
  const typed = document.getElementById("session-invite-organizer")?.value.trim() || "";
  if (looksLikeEmail(typed)) writeTrainerIdentity({ email: typed });
}

function renderOrganizerHint(t) {
  const hint = document.getElementById("session-invite-organizer-hint");
  if (!hint) return;
  hint.textContent = currentOrganizer()
    ? t("session_invite_organizer_hint") || "Acceptances arrive as email replies to this address."
    : t("session_invite_organizer_missing") ||
      "Without an address, a calendar app has nowhere to send an acceptance.";
}

// One click both downloads the .ics (so the trainer has a file to attach) and, via the anchor's
// own href, opens the device's mail client on a prefilled compose — mirrors the consent-email
// button in clientsView.js, the app's one other mailto precedent.
function buildInviteRow(client, sessionInfo, t) {
  const row = document.createElement("div");
  row.className = "session-invite-row card";

  const name = document.createElement("span");
  name.className = "session-invite-name";
  name.textContent = client.name;
  row.appendChild(name);

  const btn = document.createElement("a");
  btn.className = "btn secondary-btn session-invite-send-btn";
  btn.textContent = t("session_invite_send") || "Send invite";

  if (!client.email) {
    btn.classList.add("disabled");
    btn.href = "#";
    btn.title = t("session_invite_no_email") || "No email address on client profile";
    row.appendChild(btn);
    return row;
  }

  const subject = encodeURIComponent(
    `${t("session_invite_subject") || "Training session"}: ${sessionInfo.sessionName}`,
  );
  const body = encodeURIComponent(
    `${t("session_invite_body_greeting") || "Hi"} ${client.name},\n\n` +
      `${t("session_invite_body") || "You've been scheduled for a session"}: ${sessionInfo.sessionName}\n` +
      `${sessionInfo.dateLabel} ${sessionInfo.timeLabel}${sessionInfo.location ? ` @ ${sessionInfo.location}` : ""}\n\n` +
      `${t("session_invite_body_attach") || "The calendar invite file just downloaded — attach it to this email before sending."}`,
  );
  btn.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
  btn.title = `${t("session_invite_send_to") || "Send invite to"} ${client.email}`;
  btn.addEventListener("click", () => {
    rememberOrganizer();
    const ics = buildIcsContent({
      uid: `${sessionInfo.sessionId}-${client.id}`,
      title: sessionInfo.sessionName,
      location: sessionInfo.location,
      startDate: sessionInfo.startDate,
      endDate: sessionInfo.endDate,
      attendeeEmail: client.email,
      attendeeName: client.name,
      organizerEmail: currentOrganizer(),
    });
    downloadFile(ics, buildIcsFilename(sessionInfo.sessionName), "text/calendar");
    btn.classList.add("session-invite-sent");
    btn.textContent = t("session_invite_sent") || "Invite sent";
  });
  row.appendChild(btn);
  return row;
}

// sessionInfo: { sessionId, sessionName, location, dateLabel, timeLabel, startDate, endDate, clientIds }
export function openSessionInviteDialog(sessionInfo) {
  if (!deps || !sessionInfo?.clientIds?.length) return;
  const { getState, t } = deps;
  const state = getState();
  const clients = sessionInfo.clientIds
    .map((id) => state.clients.find((c) => c.id === id))
    .filter(Boolean);
  if (clients.length === 0) return;

  renderInviteDialogShell();

  const title = document.getElementById("session-invite-title");
  if (title) title.textContent = t("session_invite_title") || "Send calendar invites";

  const desc = document.getElementById("session-invite-desc");
  if (desc) {
    desc.textContent =
      t("session_invite_desc") ||
      "Newly assigned participants can be sent a calendar invite for this session.";
  }
  const organizerLabel = document.getElementById("session-invite-organizer-label");
  if (organizerLabel) {
    organizerLabel.textContent = t("session_invite_organizer") || "Replies come back to";
  }
  const organizerInput = document.getElementById("session-invite-organizer");
  if (organizerInput && !organizerInput.value) {
    organizerInput.value = readTrainerIdentity().email;
  }
  renderOrganizerHint(t);

  const list = document.getElementById("session-invite-list");
  if (list) {
    list.replaceChildren();
    for (const client of clients) list.appendChild(buildInviteRow(client, sessionInfo, t));
  }
  openModal("dialog-session-invite");
}
