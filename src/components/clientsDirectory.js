// components/clientsDirectory.js
// Renders the dashboard "Client Directory" grid: one tappable .client-card per client (avatar,
// name, truncated goal), filtered by a search query, with an empty-state message. Dependencies
// are injected by the caller (renderClientsList in app.js) so this stays decoupled and testable.
//
// container: the #clients-list grid element
// deps: {
//   clients, filterQuery, t, escapeHTML, getInitials, getClientDisplayNameHTML,
//   truncateString, onOpenClient(clientId)
// }

export function renderClientsDirectory(container, deps) {
  if (!container) return;
  const {
    clients, filterQuery = '', t, escapeHTML, getInitials,
    getClientDisplayNameHTML, truncateString, onOpenClient
  } = deps;

  container.innerHTML = '';

  const q = filterQuery.toLowerCase();
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q) || c.goals.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">${t('no_clients_found')}</div>`;
    return;
  }

  filtered.forEach(client => {
    const card = document.createElement('div');
    card.className = 'client-card card glassmorphic';
    card.innerHTML = `
      <div class="client-info-block">
        <div class="avatar">${client.avatar || getInitials(client.name)}</div>
        <div class="client-name-meta">
          <h3>${getClientDisplayNameHTML(client)}</h3>
          <p>${escapeHTML(truncateString(client.goals, 45))}</p>
        </div>
      </div>
    `;
    card.addEventListener('click', () => onOpenClient(client.id));
    container.appendChild(card);
  });
}
