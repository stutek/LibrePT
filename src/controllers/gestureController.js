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

  // Close the fullscreen clipboard by sliding it back down (the reverse of its slide-up open),
  // then navigate home once the slide finishes. Used by both the grabber tap and the swipe-down so
  // clicking and swiping animate identically.
  function slideOverlayDownThenHome(overlay) {
    if (overlay.dataset.closing) return;
    overlay.dataset.closing = '1';
    // Pin the current (open) position and force a reflow BEFORE transitioning to the down state —
    // otherwise dropping the slide-up animation and setting the target transform in one frame gives
    // the transition no start point and the overlay just snaps down.
    overlay.style.animation = 'none';
    overlay.style.transform = 'translateY(0)';
    void overlay.offsetHeight; // reflow
    overlay.style.transition = 'transform 0.24s ease';
    overlay.style.transform = 'translateY(100%)';
    setTimeout(() => {
      goHome();
      overlay.style.transition = '';
      overlay.style.transform = '';
      overlay.style.animation = '';
      delete overlay.dataset.closing;
    }, 230);
  }

  document.querySelectorAll('.view-titlebar').forEach(bar => {
    const isHome = bar.classList.contains('sessions-title-bar');

    // Tapping the grabber: the home bar opens the clipboard (which slides up via CSS); the clipboard
    // bar slides itself down and then goes home.
    const activate = () => {
      const overlay = bar.closest('.active-session-overlay');
      if (overlay) slideOverlayDownThenHome(overlay);
      else if (isHome) openActiveOrNextSession();
      else goHome();
    };

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
      if (overlay) slideOverlayDownThenHome(overlay);
      else activate();
    }, { passive: true });
  });
}
