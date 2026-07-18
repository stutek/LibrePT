// src/controllers/gestureController.js - Domain module for touch gestures and view title-bar drag-to-dismiss

export function setupViewDismiss({ navigateToPath, getActiveSession, launchClipboardDirectly }) {
  const SWIPE_PX = 70; // vertical distance that commits the gesture

  function goHome() {
    navigateToPath('/clients');
  }

  function openActiveOrNextSession() {
    const active = getActiveSession();
    if (active) {
      const clientId = active.activeClientId || active.participants[0];
      navigateToPath(`/session/${active.id || 'session'}/client/${clientId}`);
      return;
    }
    const bar = document.getElementById('active-session-bar');
    const nextId = bar && bar.dataset.nextBookingId;
    if (nextId) launchClipboardDirectly(nextId);
  }

  document.querySelectorAll('.view-titlebar').forEach(bar => {
    const isHome = bar.classList.contains('sessions-title-bar');
    const activate = isHome ? openActiveOrNextSession : goHome;

    const grab = bar.querySelector('.view-grabber');
    if (grab) grab.addEventListener('click', (e) => { e.stopPropagation(); activate(); });

    let startY = null, startX = null;
    bar.addEventListener('touchstart', (e) => {
      if (e.target.closest('button:not(.view-grabber), a, input, select')) { startY = null; return; }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });

    bar.addEventListener('touchend', (e) => {
      if (startY === null) return;
      const t = e.changedTouches[0];
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;
      startY = null; startX = null;
      // Commit only on a clearly downward, vertical-dominant swipe
      if (dy < SWIPE_PX || Math.abs(dx) > dy * 0.6) return;

      const overlay = bar.closest('.active-session-overlay');
      if (overlay) {
        overlay.style.animation = 'none';
        overlay.style.transition = 'transform 0.24s ease';
        overlay.style.transform = 'translateY(100%)';
        setTimeout(() => {
          goHome();
          overlay.style.transition = '';
          overlay.style.transform = '';
          overlay.style.animation = '';
        }, 230);
      } else {
        activate();
      }
    }, { passive: true });
  });
}
