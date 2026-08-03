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
import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { downloadFile } from "../common/download.js";

let deps = null;

export function initSessionInviteDialog(d) {
  deps = d;
}

function renderInviteDialogShell() {
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
      <div id="session-invite-list"></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn primary-btn modal-cancel">Done</button>
    </div>
  </dialog>
`,
  );
  const dialog = document.getElementById("dialog-session-invite");
  if (!dialog) return;
  for (const btn of dialog.querySelectorAll(".modal-close-btn, .modal-cancel")) {
    btn.addEventListener("click", () => closeModal("dialog-session-invite"));
  }
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
    const ics = buildIcsContent({
      uid: `${sessionInfo.sessionId}-${client.id}`,
      title: sessionInfo.sessionName,
      location: sessionInfo.location,
      startDate: sessionInfo.startDate,
      endDate: sessionInfo.endDate,
      attendeeEmail: client.email,
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
  const list = document.getElementById("session-invite-list");
  if (list) {
    list.replaceChildren();
    for (const client of clients) list.appendChild(buildInviteRow(client, sessionInfo, t));
  }
  openModal("dialog-session-invite");
}
