// src/modules/common/activeUsersList.js
// Renders the participant tabs scroll-fade and tab buttons for selecting active clients in the active session.

// escapeHTML is imported rather than injected: it is a pure helper with no state, and an escaping
// function that a caller can forget to pass is an escaping function that will eventually be missing.
import { escapeHTML } from "./utils.js";

function isBound(activeSession, clientId) {
  return (activeSession?.bindings || []).some((group) => group.includes(clientId));
}

/** The single tab a bound group gets, or null when nobody is bound.
 *
 * It carries every member's initials and behaves like any other tab — tapping it puts the shared
 * plan on screen. Per-person work is still one tap away: unbinding from the session menu gives
 * everyone their own tab back, which is where a signal that belongs to one of them is logged.
 */
function boundGroupTab(activeSession, ctx) {
  const { clients, activeClientId, getInitials, navigateToPath, t } = ctx;
  const group = (activeSession?.bindings || [])[0];
  if (!group || group.length < 2) return null;
  const members = (activeSession.participants || []).filter((id) => group.includes(id));
  if (members.length < 2) return null;

  const isActive = members.includes(activeClientId);
  const tab = document.createElement("button");
  tab.className = `client-tab-btn client-tab-bound ${isActive ? "active" : ""}`;
  const initials = members
    .map((id) => clients.find((client) => client.id === id))
    .filter(Boolean)
    .map((client) => client.avatar || getInitials(client.name))
    .join(" · ");
  // textContent, not innerHTML: initials come from client names a trainer typed.
  tab.textContent = `${t ? t("bound_group_label") : "Together"} ${initials}`;
  tab.addEventListener("click", () => {
    navigateToPath(`/session/${activeSession.id}/client/${members[0]}`);
  });
  return tab;
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

  // People training ONE plan read as ONE tab (TODO §8.1): the trainer is looking at a single
  // programme, and three tabs that always show the same thing invite three taps to check. The
  // members are still named on it, because a tab that says "group" tells nobody who is in it.
  const bound = boundGroupTab(activeSession, ctx);
  if (bound) tabsContainer.appendChild(bound);

  for (const pId of activeSession.participants) {
    if (isBound(activeSession, pId)) continue;
    const client = clients.find((c) => c.id === pId);
    if (!client) continue;

    const isActive = pId === activeClientId;
    const tab = document.createElement("button");
    tab.className = `client-tab-btn client-tab-participant ${isActive ? "active" : ""}`;

    // Selected tab: uses unified primary gradient with on-primary text for clear, vibrant emphasis.
    // Width-side chrome (padding/gap/avatar size) trimmed further so more tabs fit per row — a
    // group session with 6-7+ participants wraps to fewer rows this way, which is what actually
    // saves vertical space (fewer rows, not shorter rows). minHeight stays at 44px, a real tap
    // target — vertical padding alone can't shrink below that floor anyway,
    // so trimming it further would do nothing; the name is also capped+ellipsized so one long name
    // can't force an otherwise-compact row to wrap early. Look lives in activeUsersList.css
    // (.client-tab-participant / .active); isActive only picks the state class.

    tab.innerHTML = `
      <div class="avatar client-tab-avatar ${isActive ? "active" : ""}">
        ${escapeHTML(client.avatar || getInitials(client.name))}
      </div>
      <span class="client-tab-name">${getClientDisplayNameHTML(client, true)}</span>
    `;

    tab.addEventListener("click", () => {
      navigateToPath(`/session/${activeSession.id}/client/${pId}`);
    });

    tabsContainer.appendChild(tab);
  }

  updateClientTabsFadeState();
}
