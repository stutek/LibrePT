// src/modules/clients/clientsDirectory.js
// Renders the dashboard "Client Directory" grid: one tappable .client-card per client (avatar,
// name, truncated goal), filtered by a search query, with an empty-state message. Dependencies
// are injected by the caller (renderClientsList in app.js) so this stays decoupled and testable.
//
// container: the #clients-list grid element
// deps: {
//   clients, filterQuery, t, escapeHTML, getInitials, getClientDisplayNameHTML,
//   truncateString, onOpenClient(clientId)
// }

import { clientNameMatches } from "../common/utils.js";

export function renderClientsDirectory(container, deps) {
  if (!container) return;
  const {
    clients,
    filterQuery = "",
    t,
    escapeHTML,
    getInitials,
    getClientDisplayNameHTML,
    truncateString,
    onOpenClient,
  } = deps;

  container.innerHTML = "";

  const q = filterQuery.toLowerCase();
  const filtered = clients.filter(
    (c) => clientNameMatches(c, q) || c.goals.toLowerCase().includes(q),
  );

  if (filtered.length === 0) {
    // An empty directory is the ordinary state of a new app, not a failed search: two messages.
    const key = clients.length === 0 ? "clients_empty" : "no_clients_found";
    container.innerHTML = `<div class="card glassmorphic text-center text-muted clients-empty-state">${t(key)}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const client of filtered) {
    const card = document.createElement("div");
    card.className = "client-card card glassmorphic";
    card.innerHTML = `
      <div class="client-info-block">
        <div class="avatar">${escapeHTML(client.avatar || getInitials(client.name))}</div>
        <div class="client-name-meta">
          <h3>${getClientDisplayNameHTML(client, false, t("injury_mark_label"))}</h3>
          <p>${escapeHTML(truncateString(client.goals, 45))}</p>
        </div>
      </div>
    `;
    card.addEventListener("click", () => onOpenClient(client.id));
    fragment.appendChild(card);
  }
  container.appendChild(fragment);
}
