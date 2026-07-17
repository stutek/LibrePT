// components/activeUsersList.js
// Renders the participant tabs scroll-fade and tab buttons for selecting active clients in the active session.

export function updateClientTabsFadeState() {
  const el = document.getElementById('active-session-client-tabs');
  if (!el) return;

  const hasOverflow = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle('no-overflow', !hasOverflow);
  if (!hasOverflow) return;

  const atStart = el.scrollLeft <= 1;
  const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
  el.classList.toggle('at-start', atStart);
  el.classList.toggle('at-end', atEnd);
}

export function renderActiveUsersList(tabsContainer, activeSession, ctx) {
  const { clients, activeClientId, getInitials, getClientDisplayNameHTML, navigateToPath } = ctx;
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';
  
  activeSession.participants.forEach(pId => {
    const client = clients.find(c => c.id === pId);
    if (!client) return;
    
    const isActive = pId === activeClientId;
    const tab = document.createElement('button');
    tab.className = `client-tab-btn ${isActive ? 'active' : ''}`;

    // Selected tab: an accent-tinted pill with accent border + bright accent text — clearly
    // emphasised, but softer than a solid accent block so the label keeps strong contrast.
    tab.style.display = 'flex';
    tab.style.alignItems = 'center';
    tab.style.gap = '8px';
    tab.style.padding = '10px 20px';
    tab.style.borderRadius = '24px';
    tab.style.border = isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)';
    tab.style.background = isActive ? 'color-mix(in srgb, var(--accent-cyan) 20%, transparent)' : 'rgba(255,255,255,0.05)';
    tab.style.color = isActive ? 'var(--accent-cyan)' : 'var(--text-main)';
    tab.style.fontWeight = '700';
    tab.style.cursor = 'pointer';
    tab.style.transition = 'all 0.2s';
    tab.style.minHeight = '44px';

    tab.innerHTML = `
      <div class="avatar" style="width:20px; height:20px; font-size:9px; background: var(--accent-cyan); color: var(--bg-color);">
        ${client.avatar || getInitials(client.name)}
      </div>
      <span>${getClientDisplayNameHTML(client, true)}</span>
    `;
    
    tab.addEventListener('click', () => {
      navigateToPath(`/session/${activeSession.id}/client/${pId}`);
    });
    
    tabsContainer.appendChild(tab);
  });

  updateClientTabsFadeState();
}
