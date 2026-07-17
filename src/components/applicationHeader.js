// components/applicationHeader.js
// Handles the shared top header bar actions: theme, language, logo clicks, and synchronization/backup badge.
//
// deps: {
//   getState(),
//   t,
//   saveToLocalStorage(),
//   applyTranslations(lang),
//   navigateToPath(path),
//   renderClientsList(),
//   renderRoutinesList(),
//   renderExercisesList(),
//   renderGlobalHistory(),
//   renderPendingPlanAdjustments(),
//   renderSessions(),
//   populateDropdownSelectors(),
//   getActiveSession(),
//   renderActiveGroupBoard(),
//   renderActiveSessionBarLabels()
// }

let deps = null;

let mockSyncState = { local: 2, remote: 1 };
let syncTrackingReady = false;

const THEME_BODY_CLASS = {
  dark: 'dark-theme', light: 'light-theme', red: 'red-theme', rose: 'rose-theme', violet: 'violet-theme'
};
const THEME_META_COLOR = {
  dark: '#09090b', light: '#f6f7fb', red: '#2a0407', rose: '#fdf2f8', violet: '#0b0a1f'
};
const THEME_SWITCHER_LABELS = {
  en: { dark: 'Midnight', light: 'Daylight', red: 'Red', rose: 'Blossom', violet: 'Nebula' },
  sl: { dark: 'Polnoč', light: 'Dan', red: 'Rdeča', rose: 'Cvet', violet: 'Nebula' }
};

export function initApplicationHeader(d) {
  deps = d;
}

export function incrementLocalSync() {
  if (syncTrackingReady) {
    mockSyncState.local += 1;
    renderSyncBadge();
  }
}

export function resetSyncState() {
  mockSyncState = { local: 0, remote: 0 };
  renderSyncBadge();
}

export function setSyncTrackingReady(val) {
  syncTrackingReady = val;
}

export function renderSyncBadge() {
  const badge = document.getElementById('sync-badge');
  if (!badge) return;
  const { local, remote } = mockSyncState;
  if (local === 0 && remote === 0) {
    badge.classList.add('hidden');
    badge.textContent = '';
    badge.removeAttribute('aria-label');
    return;
  }
  const fmt = (n) => (n > 9 ? '9+' : String(n));
  badge.classList.remove('hidden');
  badge.innerHTML =
    `<span class="sync-ahead"><i class="fa-solid fa-arrow-up"></i>${fmt(local)}</span>` +
    `<span class="sync-behind"><i class="fa-solid fa-arrow-down"></i>${fmt(remote)}</span>`;
  badge.setAttribute('aria-label',
    `${local} local change${local === 1 ? '' : 's'} to push, ${remote} remote change${remote === 1 ? '' : 's'} to pull`);
}

function applyTheme(theme) {
  const cls = THEME_BODY_CLASS[theme] || THEME_BODY_CLASS.dark;
  Object.values(THEME_BODY_CLASS).forEach(c => document.body.classList.remove(c));
  document.body.classList.add(cls);
  localStorage.setItem('librept-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLOR[theme] || THEME_META_COLOR.dark);
}

export function applyThemeSwitcherLabels() {
  const sel = document.getElementById('theme-switcher');
  if (!sel) return;
  const labels = THEME_SWITCHER_LABELS[deps.getState().lang] || THEME_SWITCHER_LABELS.en;
  Array.from(sel.options).forEach(opt => { if (labels[opt.value]) opt.textContent = labels[opt.value]; });
}

function setupThemeSwitcher() {
  const saved = localStorage.getItem('librept-theme') || 'dark';
  applyTheme(saved);
  const sel = document.getElementById('theme-switcher');
  if (sel) {
    sel.value = saved;
    sel.addEventListener('change', () => applyTheme(sel.value));
  }
  applyThemeSwitcherLabels();
}

export function setupApplicationHeader() {
  // Logo Area home click handler
  const logoArea = document.getElementById('logo-area');
  if (logoArea) {
    logoArea.addEventListener('click', () => {
      deps.navigateToPath('/clients');
    });
  }

  // Language switcher setup
  const langSwitcher = document.getElementById('lang-switcher');
  if (langSwitcher) {
    langSwitcher.value = deps.getState().lang;
    langSwitcher.addEventListener('change', (e) => {
      const newLang = e.target.value;
      deps.getState().lang = newLang;
      deps.saveToLocalStorage();
      deps.applyTranslations(newLang);
      
      // Re-render views to apply translations
      deps.renderClientsList();
      deps.renderRoutinesList();
      deps.renderExercisesList();
      deps.renderGlobalHistory();
      deps.renderPendingPlanAdjustments();
      deps.renderSessions();
      deps.populateDropdownSelectors();
      
      const activeSession = deps.getActiveSession();
      if (activeSession) {
        deps.renderActiveGroupBoard();
        deps.renderActiveSessionBarLabels();
      }
    });
  }

  // Theme switcher setup
  setupThemeSwitcher();
}
