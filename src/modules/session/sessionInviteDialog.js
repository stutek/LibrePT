// src/modules/session/sessionInviteDialog.js
// Dialog shown after a PT assigns new participants to a session (TODO §1.1) — the PT-side
// counterpart to a client self-subscribing via the Google-hosted booking page
// (use_cases/uc4_client_self_subscription.md). Offers each newly-assigned client a calendar
// invite: a downloadable .ics plus a prefilled mailto compose to send it in. LibrePT has no
// backend/SMTP relay (TODO §1.5), so this is the honest, no-network equivalent of Google
// Calendar's own invite email.
//
// **The invite also carries a link the client can actually answer** (TODO §1.6's confirm link). An
// `.ics` only collects an acceptance from a calendar client that speaks iMIP, which is not what a gym
// client has — so every invite carries a LibrePT reply link too, and the client taps one of three
// answers on a page rather than replying in prose. SMS is offered beside email where the client has a
// number (ruled 2026-08-17): a text cannot carry the `.ics`, so email keeps the calendar file and the
// text carries the link. Both, never one instead of the other.
//
// **Sending records an invitation** (TODO §1.6): a row in `invites` saying this session was offered
// to this client, on which channel, when. That is what an RSVP later lands on. It is recorded on the
// tap that opens the mail or messaging app rather than on some later confirmation, because there is
// no confirmation to wait for — the app hands the message to another app and never hears back.
//
// deps: { getState, t, saveState, newInviteId }

import { buildIcsContent, buildIcsFilename } from "../../data/calendarInvite.js";
import { buildInvite } from "../../data/inviteRecord.js";
import { SESSION_INVITE } from "../../data/sessionEventPayload.js";
import {
  looksLikeEmail,
  readTrainerIdentity,
  writeTrainerIdentity,
} from "../../data/trainerIdentity.js";
import { inviteExpiresAt } from "../../domain/inviteExpiry.js";
import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { downloadFile } from "../common/download.js";
import { buildEventLink } from "../common/eventTransports.js";

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
      <div class="form-group">
        <label for="session-invite-expiry" id="session-invite-expiry-label">Close replies this many hours before</label>
        <input type="number" id="session-invite-expiry" class="form-control" min="0" max="168" step="1" inputmode="numeric">
        <p id="session-invite-expiry-hint" class="text-sm text-muted"></p>
      </div>
      <div class="form-group">
        <label for="session-invite-phone" id="session-invite-phone-label">Your number, for replies by text</label>
        <input type="tel" id="session-invite-phone" class="form-control" autocomplete="tel" inputmode="tel" placeholder="+386 …">
        <p id="session-invite-phone-hint" class="text-sm text-muted"></p>
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
  // The rows carry the reply link, and the link carries these two fields — so a row built before the
  // trainer finished typing would send an invite that cannot be answered by text. Re-rendered on
  // input rather than read at click time (the organizer email's trick) because an <a href> is
  // resolved by the browser, not by our handler.
  for (const id of ["session-invite-organizer", "session-invite-phone", "session-invite-expiry"]) {
    dialog.querySelector(`#${id}`)?.addEventListener("input", () => renderInviteRows());
  }
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
// Not validated the way the email is: phone numbers are written a dozen ways, the app never dials it,
// and it is only ever handed to the client's own messaging app. Rejecting a real number would be the
// expensive mistake here.
function currentOrganizerPhone() {
  return document.getElementById("session-invite-phone")?.value.trim() || "";
}

/** Hours of padding as typed, or the stored setting when the field is empty. A blank field is "I have
 *  not touched this", not "no deadline" — 0 is how a trainer says that, and the two must not collapse. */
function currentExpiryPaddingHours() {
  const typed = document.getElementById("session-invite-expiry")?.value.trim() ?? "";
  if (typed === "") return readTrainerIdentity().expiryPaddingHours;
  const hours = Number(typed);
  return Number.isFinite(hours) && hours >= 0 ? hours : readTrainerIdentity().expiryPaddingHours;
}

function rememberOrganizer() {
  const typed = document.getElementById("session-invite-organizer")?.value.trim() || "";
  const phone = currentOrganizerPhone();
  const expiryPaddingHours = currentExpiryPaddingHours();
  if (looksLikeEmail(typed)) writeTrainerIdentity({ email: typed, phone, expiryPaddingHours });
  else writeTrainerIdentity({ email: readTrainerIdentity().email, phone, expiryPaddingHours });
}

/** Records that an invitation went out, so the answer has something to land on.
 *
 * Idempotent per session/client pair: a trainer who taps Send twice — or sends by email and then by
 * text — has invited one person once, and a second row would double-count in every reading of who was
 * asked. The channel is overwritten because the latest one is how it was actually sent.
 *
 * `sentAt` is an INSTANT in UTC, never a local calendar date: it is compared against an answer's
 * `answeredAt` to give a response time, and that subtraction is only correct if both are absolute.
 */
function recordInviteSent(client, sessionInfo, channel) {
  if (!deps?.saveState) return;
  const state = deps.getState();
  if (!state.invites) state.invites = [];
  const invites = state.invites;
  const existing = invites.find(
    (invite) => invite.sessionId === sessionInfo.sessionId && invite.clientId === client.id,
  );
  const sentAt = new Date().toISOString();

  if (existing) {
    existing.channel = channel;
    existing.sentAt = sentAt;
  } else {
    const invite = buildInvite({
      id: deps.newInviteId(),
      sessionId: sessionInfo.sessionId,
      clientId: client.id,
      channel,
      sentAt,
    });
    if (invite) invites.push(invite);
  }
  deps.saveState();
}

/** The invite as an event, which is what the reply link carries. */
function inviteEventFor(client, sessionInfo) {
  return {
    kind: SESSION_INVITE,
    sessionId: sessionInfo.sessionId,
    clientId: client.id,
    title: sessionInfo.sessionName,
    startsAt: sessionInfo.startDate ? new Date(sessionInfo.startDate).getTime() : undefined,
    durationMinutes:
      sessionInfo.startDate && sessionInfo.endDate
        ? Math.round((new Date(sessionInfo.endDate) - new Date(sessionInfo.startDate)) / 60000)
        : undefined,
    location: sessionInfo.location,
    organizerEmail: currentOrganizer(),
    organizerName: readTrainerIdentity().name,
    organizerPhone: currentOrganizerPhone(),
    // The cutoff, as an absolute instant — computed here because only this device knows the trainer's
    // padding setting, and carried on the wire because the client's device knows only what the invite
    // told it. Null (no deadline) simply does not travel.
    expiresAt:
      inviteExpiresAt(
        sessionInfo.startDate ? new Date(sessionInfo.startDate).getTime() : null,
        currentExpiryPaddingHours(),
      ) ?? undefined,
  };
}

/** The app's own URL, which the reply link must be absolute against: the client opens it on a
 *  different device, so a relative link is meaningless (the same reason consentForm.js is absolute). */
function appUrl() {
  return new URL(".", new URL("../../", import.meta.url)).toString();
}

function renderOrganizerHint(t) {
  const hint = document.getElementById("session-invite-organizer-hint");
  if (!hint) return;
  hint.textContent = currentOrganizer()
    ? t("session_invite_organizer_hint") || "Acceptances arrive as email replies to this address."
    : t("session_invite_organizer_missing") ||
      "Without an address, a calendar app has nowhere to send an acceptance.";
}

/** The email body, as LINES rather than a `+` chain: the message grew a conditional paragraph (the
 *  reply link) and the concatenation stopped being readable at exactly that point. A list of lines
 *  also makes the blank lines explicit instead of hiding them inside string fragments. */
function inviteEmailBody(client, sessionInfo, replyLink, t) {
  const lines = [
    `${t("session_invite_body_greeting") || "Hi"} ${client.name},`,
    "",
    `${t("session_invite_body") || "You've been scheduled for a session"}: ${sessionInfo.sessionName}`,
    `${sessionInfo.dateLabel} ${sessionInfo.timeLabel}${sessionInfo.location ? ` @ ${sessionInfo.location}` : ""}`,
    "",
    t("session_invite_body_attach") ||
      "The calendar invite file just downloaded — attach it to this email before sending.",
  ];
  // The answer route. An .ics collects an acceptance only from a calendar client that speaks iMIP;
  // this is what a gym client on a phone can actually use.
  if (replyLink) {
    lines.push("", t("session_invite_body_reply") || "Let me know if you can make it:", replyLink);
  }
  return lines.join("\n");
}

// One click both downloads the .ics (so the trainer has a file to attach) and, via the anchor's own
// href, opens the device's mail client on a prefilled compose — mirrors the consent-email button in
// clientsView.js, the app's one other mailto precedent.
function buildEmailInviteButton(client, sessionInfo, replyLink, t) {
  const btn = document.createElement("a");
  btn.className = "btn secondary-btn session-invite-send-btn";
  btn.textContent = t("session_invite_send") || "Send invite";

  if (!client.email) {
    btn.classList.add("disabled");
    btn.href = "#";
    btn.title = t("session_invite_no_email") || "No email address on client profile";
    return btn;
  }

  const subject = encodeURIComponent(
    `${t("session_invite_subject") || "Training session"}: ${sessionInfo.sessionName}`,
  );
  const body = encodeURIComponent(inviteEmailBody(client, sessionInfo, replyLink, t));
  btn.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
  btn.title = `${t("session_invite_send_to") || "Send invite to"} ${client.email}`;
  btn.addEventListener("click", () => {
    rememberOrganizer();
    recordInviteSent(client, sessionInfo, "email");
    downloadFile(
      buildIcsContent({
        uid: `${sessionInfo.sessionId}-${client.id}`,
        title: sessionInfo.sessionName,
        location: sessionInfo.location,
        startDate: sessionInfo.startDate,
        endDate: sessionInfo.endDate,
        attendeeEmail: client.email,
        attendeeName: client.name,
        organizerEmail: currentOrganizer(),
      }),
      buildIcsFilename(sessionInfo.sessionName),
      "text/calendar",
    );
    btn.classList.add("session-invite-sent");
    btn.textContent = t("session_invite_sent") || "Invite sent";
  });
  return btn;
}

/** The text channel, beside email rather than instead of it (TODO §1.6, SMS ruled in 2026-08-17): an
 *  SMS cannot carry the .ics, so email keeps the calendar file and the text carries the link a client
 *  is far more likely to answer. Returns null where the client has no number, so most rows stay a
 *  single button rather than growing a dead one. */
function buildSmsInviteButton(client, sessionInfo, replyLink, t) {
  if (!client.phone || !replyLink) return null;

  const sms = document.createElement("a");
  sms.className = "btn secondary-btn session-invite-sms-btn";
  sms.textContent = t("session_invite_send_sms") || "Text it";
  // `?&body=` is the shape both iOS and Android honour — the same form eventTransports.js uses.
  sms.href = `sms:${encodeURIComponent(client.phone)}?&body=${encodeURIComponent(
    `${t("session_invite_sms_text") || "Training session"}: ${sessionInfo.sessionName} — ${replyLink}`,
  )}`;
  sms.addEventListener("click", () => {
    rememberOrganizer();
    recordInviteSent(client, sessionInfo, "sms");
  });
  return sms;
}

function buildInviteRow(client, sessionInfo, t) {
  const replyLink = buildEventLink(inviteEventFor(client, sessionInfo), appUrl());
  const row = document.createElement("div");
  row.className = "session-invite-row card";

  const name = document.createElement("span");
  name.className = "session-invite-name";
  name.textContent = client.name;
  row.append(name, buildEmailInviteButton(client, sessionInfo, replyLink, t));

  const sms = buildSmsInviteButton(client, sessionInfo, replyLink, t);
  if (sms) row.appendChild(sms);
  return row;
}

// The rows, rebuilt whenever the organizer fields change: each row's mailto/sms href embeds the reply
// link, which embeds those fields, and an <a href> is resolved by the browser rather than by a handler
// that could read them later. The last-rendered arguments are kept so an input listener can re-run this
// without the dialog having to be reopened.
let renderedFor = null;

function renderInviteRows(clients = renderedFor?.clients, sessionInfo = renderedFor?.sessionInfo) {
  if (!clients || !sessionInfo) return;
  renderedFor = { clients, sessionInfo };
  const list = document.getElementById("session-invite-list");
  if (!list) return;
  list.replaceChildren();
  for (const client of clients) list.appendChild(buildInviteRow(client, sessionInfo, deps.t));
}

// sessionInfo: { sessionId, sessionName, location, dateLabel, timeLabel, startDate, endDate, clientIds }
/** Static copy and the two remembered organizer fields. Split out of `openSessionInviteDialog` because
 *  it is a dozen "if the element exists, set its text" steps that say nothing about when the dialog
 *  should open — and together they pushed that function past the complexity gate. */
function renderDialogChrome(t) {
  const text = [
    ["session-invite-title", t("session_invite_title") || "Send calendar invites"],
    [
      "session-invite-desc",
      t("session_invite_desc") ||
        "Newly assigned participants can be sent a calendar invite for this session.",
    ],
    ["session-invite-organizer-label", t("session_invite_organizer") || "Replies come back to"],
    ["session-invite-phone-label", t("session_invite_phone") || "Your number, for replies by text"],
    [
      "session-invite-phone-hint",
      t("session_invite_phone_hint") ||
        "Optional. With it, a client can answer the invite with a text instead of an email.",
    ],
  ];
  for (const [id, value] of text) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  // Prefilled only when empty, so reopening the dialog never overwrites what the trainer just typed.
  const identity = readTrainerIdentity();
  for (const [id, value] of [
    ["session-invite-organizer", identity.email],
    ["session-invite-phone", identity.phone],
    // String(), because 0 is a real setting and `!input.value` would treat the number zero as unset.
    ["session-invite-expiry", String(identity.expiryPaddingHours)],
  ]) {
    const input = document.getElementById(id);
    if (input && !input.value) input.value = value;
  }
}

export function openSessionInviteDialog(sessionInfo) {
  if (!deps || !sessionInfo?.clientIds?.length) return;
  const { getState, t } = deps;
  const clients = sessionInfo.clientIds
    .map((id) => getState().clients.find((c) => c.id === id))
    .filter(Boolean);
  if (clients.length === 0) return;

  renderInviteDialogShell();
  renderDialogChrome(t);
  renderOrganizerHint(t);
  renderInviteRows(clients, sessionInfo);
  openModal("dialog-session-invite");
}
