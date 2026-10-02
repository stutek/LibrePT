// src/modules/common/activeUsersList.js
// Renders the participant tabs scroll-fade and tab buttons for selecting active clients in the active session.

// escapeHTML is imported rather than injected: it is a pure helper with no state, and an escaping
// function that a caller can forget to pass is an escaping function that will eventually be missing.
import { escapeHTML, sessionSlotOfTitle, sessionTitleOfClient } from "./utils.js";

// A client in a group: they started from the same plan as the others in it. Each still has their own
// tab, because group members train at their own speed and are logged one by one.
function isBound(activeSession, clientId) {
  return (activeSession?.bindings || []).some((group) => group.includes(clientId));
}

// The group mark on a tab: the link glyph the session menu's "Everyone on this plan" carries, and the
// word for it for a screen reader, so the mark is not only a picture.
function groupMarkHTML(t) {
  const label = t ? t("bound_group_label") : "Together";
  return `<i class="fa-solid fa-link client-tab-group-mark" aria-hidden="true"></i><span class="sr-only">${escapeHTML(label)}</span>`;
}

export function updateClientTabsFadeState() {
  const el = document.getElementById("active-session-client-tabs");
  if (!el) return;

  const hasOverflow = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle("no-overflow", !hasOverflow);
  if (!hasOverflow) return;

  const atStart = el.scrollLeft <= 1;
  const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
  el.classList.toggle("at-start", atStart);
  el.classList.toggle("at-end", atEnd);
}

export function renderActiveUsersList(tabsContainer, activeSession, ctx) {
  const { clients, activeClientId, getInitials, getClientDisplayNameHTML, navigateToPath, t } = ctx;
  if (!tabsContainer) return;
  tabsContainer.innerHTML = "";

  // Everyone on this session, so a tab can tell two clients who share a first name apart.
  const participants = activeSession.participants.map((id) => clients.find((c) => c.id === id));
  for (const pId of activeSession.participants) {
    const client = clients.find((c) => c.id === pId);
    if (!client) continue;

    const isActive = pId === activeClientId;
    const tab = document.createElement("button");
    const bound = isBound(activeSession, pId);
    tab.className = `client-tab-btn client-tab-participant${bound ? " client-tab-bound" : ""} ${isActive ? "active" : ""}`;

    // Selected tab: uses unified primary gradient with on-primary text for clear, vibrant emphasis.
    // Width-side chrome (padding/gap/avatar size) trimmed further so more tabs fit per row — a
    // group session with 6-7+ participants wraps to fewer rows this way, which is what actually
    // saves vertical space (fewer rows, not shorter rows). minHeight stays at 44px, a real tap
    // target — vertical padding alone can't shrink below that floor anyway,
    // so trimming it further would do nothing; the name is also capped+ellipsized so one long name
    // can't force an otherwise-compact row to wrap early. Look lives in activeUsersList.css
    // (.client-tab-participant / .active); isActive only picks the state class.

    // On a merged clipboard the tab carries the dot of its session's title line, and the session's
    // name as screen-reader text, so the pairing is not only a colour.
    const sessionTitle = sessionTitleOfClient(activeSession.sourceSession, pId);
    const slot = sessionSlotOfTitle(activeSession.sourceSession, sessionTitle);
    const sessionMark =
      slot === null
        ? ""
        : `<span class="session-dot" data-session-slot="${slot}" aria-hidden="true"></span><span class="sr-only">${escapeHTML(sessionTitle)}</span>`;

    tab.innerHTML = `
      <div class="avatar client-tab-avatar ${isActive ? "active" : ""}">
        ${escapeHTML(client.avatar || getInitials(client.name))}
      </div>
      <span class="client-tab-name">${getClientDisplayNameHTML(client, true, t("injury_mark_label"), participants)}</span>${sessionMark}${bound ? groupMarkHTML(t) : ""}
    `;

    tab.addEventListener("click", () => {
      navigateToPath(`/session/${activeSession.id}/client/${pId}`);
    });

    tabsContainer.appendChild(tab);
  }

  updateClientTabsFadeState();
}
