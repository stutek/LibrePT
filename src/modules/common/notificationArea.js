// src/modules/common/notificationArea.js
// Omnipresent bottom notification and status area replacing the old app footer.
// Handles:
//   - Collapsed status bar showing grab handle, active/next session status, and notification count.
//   - Expandable upward drawer/sheet triggered by clicking or swiping/dragging the handle or bar upwards
//     (mimicking active-session-overlay collapse/expand behavior).
//   - Priority-ordered notification feed: Live/Upcoming session → Welcome/Demo message → Reservations/Cancellations.
//
// Dependencies injected via initNotificationArea({ getState, getActiveSession, t, escapeHTML,
// navigateToPath, getSyncFailure, seedDemoData }) — `getSyncFailure` is an accessor rather than a
// value because a sync can fail at any moment after boot, and it keeps this module unaware of Drive
// entirely. `seedDemoData` used to be reached as `window.seedMockData`, which no layering gate can
// see: a global is not an import, so the feed was calling into the app entry point and nothing said
// so.

import { stateHasData } from "../../data/stateStore.js";
import { readVersionScoped, writeVersionScoped } from "../../data/storageNamespace.js";
import { resolveNotificationItems } from "../../domain/notificationItems.js";
import { renderMarkupOnce } from "./dom.js";

// Schema-scoped: which notifications a PT has read is per-build state (see data/storageNamespace).
const READ_NOTIFICATIONS_KEY = "librept_read_notifications";

let deps = null;
const barObserver = null;

export function initNotificationArea(d) {
  deps = d;
}

export function syncNotificationBarState() {
  const area = document.getElementById("notification-area");
  if (area) area.classList.remove("has-active-session");
}

function loadReadNotificationIds() {
  try {
    return JSON.parse(readVersionScoped(READ_NOTIFICATIONS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

// The collapsed bar reads from the same three elements whatever the feed contains, so both empty
// states set them the same way.
function setNotificationSummary(
  { summaryTitleEl, summaryDescEl, summaryIconEl },
  title,
  desc,
  icon,
) {
  if (summaryTitleEl) summaryTitleEl.textContent = title;
  if (summaryDescEl) summaryDescEl.textContent = desc;
  if (summaryIconEl) summaryIconEl.className = `${icon} notification-bell-icon`;
}

// An empty feed means one of two opposite things, and they were rendered identically until
// 2026-08-13. A database with nothing in it gets the offer below; a database with a real gym in it
// and nothing outstanding gets this. Sharing one card told the trainer with nothing saved that
// their "workspace is preloaded with live training data" — false — and told the one with ten real
// clients the same thing, under a button that would have seeded thirty fake people into their
// records. Nothing is offered here on purpose: someone already up to date needs no action, and the
// demo seed is the specific action they must not be handed.
function renderCaughtUpState(container, t, escapeHTML, summaryEls) {
  setNotificationSummary(
    summaryEls,
    t("notif_empty_title"),
    t("notif_empty_desc"),
    "fa-solid fa-check",
  );

  container.innerHTML = `
    <div class="notification-empty">
      <div class="notification-card caught-up read" data-notification-id="caught-up">
        <div class="notification-card-icon">
          <i class="fa-solid fa-check"></i>
        </div>
        <div class="notification-card-content">
          <h4 class="notification-card-title">${escapeHTML(t("notif_empty_title"))}</h4>
          <p class="notification-card-desc">${escapeHTML(t("notif_empty_desc"))}</p>
        </div>
      </div>
    </div>
  `;
}

// The way back to an offer the splash made first. Someone who chose "Start with an empty app" at
// first run has no other route to the sample gym, so this stays — but the label says what the
// button does, because it writes records rather than navigating anywhere.
function renderSeedDemoInvitation(container, t, escapeHTML, summaryEls, seedDemoData) {
  setNotificationSummary(
    summaryEls,
    t("notif_seed_demo_title"),
    t("notif_seed_demo_desc"),
    "fa-solid fa-wand-magic-sparkles",
  );

  container.innerHTML = `
    <div class="notification-empty">
      <div class="notification-card welcome unread" data-notification-id="demo-invitation">
        <div class="notification-card-icon">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="notification-card-content">
          <h4 class="notification-card-title">${escapeHTML(t("notif_seed_demo_title"))} <span class="unread-dot" title="Unread"></span></h4>
          <p class="notification-card-desc">${escapeHTML(t("notif_seed_demo_desc"))}</p>
          <div class="notification-actions">
            <button type="button" class="notification-btn primary" id="btn-seed-demo-data">${escapeHTML(t("notif_seed_demo_btn"))}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector("#btn-seed-demo-data")?.addEventListener("click", (e) => {
    e.stopPropagation();
    seedDemoData?.();
  });
}

function buildNotificationActionHTML(act, itemId, escapeHTML) {
  const primaryCls = act.primary ? "primary" : "";
  if (act.resetDemo) {
    return `<button type="button" class="notification-btn ${primaryCls}" data-action-reset="true" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
  }
  if (act.startWalkthrough) {
    return `<button type="button" class="notification-btn ${primaryCls}" data-action-walkthrough="true" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
  }
  if (act.resumePlanId) {
    return `<button type="button" class="notification-btn ${primaryCls}" data-action-resume="${escapeHTML(act.resumePlanId)}" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
  }
  if (act.url) {
    return `<a href="${escapeHTML(act.url)}" target="_blank" rel="noopener noreferrer" class="notification-link" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 11px; margin-left: 2px;"></i></a>`;
  }
  return `<button type="button" class="notification-btn ${primaryCls}" data-nav-target="${escapeHTML(act.view || "")}" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
}

function buildNotificationCardHTML(item, escapeHTML) {
  const iconClass = item.icon || "fa-solid fa-bell";
  const actionsHTML =
    item.actions && item.actions.length > 0
      ? `<div class="notification-actions">
          ${item.actions.map((act) => buildNotificationActionHTML(act, item.id, escapeHTML)).join("")}
        </div>`
      : "";
  const unreadDot = !item.read ? `<span class="unread-dot" title="Unread"></span>` : "";

  return `
      <div class="notification-card ${escapeHTML(item.type)} ${!item.read ? "unread" : "read"}" data-notification-id="${escapeHTML(item.id)}">
        <div class="notification-card-icon">
          <i class="${escapeHTML(iconClass)}"></i>
        </div>
        <div class="notification-card-content">
          <h4 class="notification-card-title">${escapeHTML(item.title)} ${unreadDot}</h4>
          <p class="notification-card-desc">${escapeHTML(item.description)}</p>
          ${actionsHTML}
        </div>
      </div>
    `;
}

// Persists a newly-read id and reports whether it actually changed anything (callers use this to
// decide whether a re-render is warranted).
function markNotificationRead(itemId, readIds) {
  if (!itemId || readIds.includes(itemId)) return false;
  readIds.push(itemId);
  try {
    writeVersionScoped(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
  } catch (e) {
    console.warn("Failed to persist read notifications to localStorage:", e);
  }
  return true;
}

function wireNotificationCardActions(container, deps, t, readIds) {
  // Attach reset demo data listeners
  // Opens the cleanup CONFIRMATION rather than resetting. This used to call resetLibrePTData(),
  // which deletes the whole database — fine while the only person who ever pressed it had nothing
  // but demo data, and destructive the moment a trainer has started adding real clients, which is
  // exactly when they want the demo gone. The dialog removes demo records selectively and shows
  // what it is keeping (modules/common/demoCleanupDialog.js).
  for (const btn of container.querySelectorAll("button[data-action-reset]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deps.openDemoCleanup?.();
    });
  }

  // Start the guided walkthrough (TODO §28.14). Injected rather than imported: the walkthrough
  // reloads the app with its own deep link, and that URL is built in modules/splash — which this
  // module may not reach across (AGENT_RULES §5.3).
  for (const btn of container.querySelectorAll("button[data-action-walkthrough]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deps.startWalkthrough?.();
    });
  }

  // Resume a planning-mode draft straight from the feed (the "unscheduled plans" item's actions):
  // reopens via the SAME reconstruction openSessionFromHistory already does for a real past
  // session, just looked up by id in state.history rather than passed in directly.
  for (const btn of container.querySelectorAll("button[data-action-resume]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const planId = btn.getAttribute("data-action-resume");
      const log = (deps.getState?.().history || []).find((h) => h.id === planId);
      if (log && deps.openSessionFromHistory) {
        toggleNotificationArea(false);
        deps.openSessionFromHistory(log);
      }
    });
  }

  // Attach navigation action listeners and mark-read listeners inside the notification cards
  for (const btn of container.querySelectorAll("button[data-nav-target]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = btn.getAttribute("data-nav-target");
      markNotificationRead(btn.getAttribute("data-action-id"), readIds);
      if (target && deps.navigateToPath) {
        deps.navigateToPath(target);
        toggleNotificationArea(false);
      } else {
        renderNotificationArea();
      }
    });
  }

  for (const link of container.querySelectorAll("a[data-action-id]")) {
    link.addEventListener("click", () => {
      if (markNotificationRead(link.getAttribute("data-action-id"), readIds)) {
        renderNotificationArea();
      }
    });
  }

  // Clicking any unread card marks it as read
  for (const card of container.querySelectorAll(".notification-card.unread")) {
    card.addEventListener("click", () => {
      if (markNotificationRead(card.getAttribute("data-notification-id"), readIds)) {
        renderNotificationArea();
      }
    });
  }
}

// The same unread/all count appears in two places — the collapsed bar and the open feed's header —
// and the "mark all read" footer only earns its space when there is something to mark. One function
// for all three, so they cannot disagree about a number they all read off the same list.
function paintFeedCounts(items, t) {
  const unreadCount = items.filter((item) => !item.read).length;
  const countText = (t("notif_count_badge") || "{unread} unread / {all} all")
    .replace("{unread}", unreadCount.toString())
    .replace("{all}", items.length.toString());

  for (const countEl of [
    document.getElementById("notification-summary-count"),
    document.getElementById("notification-feed-count"),
  ]) {
    if (!countEl) continue;
    countEl.textContent = countText;
    countEl.classList.toggle("has-unread", unreadCount > 0);
  }

  const markAllFooter = document.querySelector(".notification-feed-footer");
  if (markAllFooter) markAllFooter.style.display = unreadCount > 0 ? "flex" : "none";
}

export function renderNotificationArea() {
  if (!deps) return;
  const { t, escapeHTML } = deps;

  const container = document.getElementById("notification-list-container");
  if (!container) return;
  const summaryEls = {
    summaryTitleEl: document.getElementById("notification-summary-title"),
    summaryDescEl: document.getElementById("notification-summary-desc"),
    summaryIconEl: document.getElementById("notification-summary-icon"),
  };

  const readIds = loadReadNotificationIds();
  const state = deps.getState?.() || {};
  const items = resolveNotificationItems(state, t, readIds, deps.getSyncFailure?.() || null, {
    crashes: deps.getCrashes?.() || [],
    repoUrl: deps.repoUrl || "",
  });
  paintFeedCounts(items, t);

  if (items.length === 0) {
    if (stateHasData(state)) {
      renderCaughtUpState(container, t, escapeHTML, summaryEls);
    } else {
      renderSeedDemoInvitation(container, t, escapeHTML, summaryEls, deps.seedDemoData);
    }
    syncNotificationBarState();
    return;
  }

  // The collapsed bar previews the top item, minus its wave: "👋 " reads as a greeting in a card
  // and as noise in a one-line status strip. The bell is the same fallback the card itself uses,
  // so an item without an icon cannot leave the previous item's glyph stranded in the bar.
  const firstItem = items[0];
  setNotificationSummary(
    summaryEls,
    firstItem.title.replace("👋 ", ""),
    firstItem.description,
    firstItem.icon || "fa-solid fa-bell",
  );

  container.innerHTML = items.map((item) => buildNotificationCardHTML(item, escapeHTML)).join("");

  wireNotificationCardActions(container, deps, t, readIds);
  syncNotificationBarState();
}

export function toggleNotificationArea(forceExpand = null) {
  const area = document.getElementById("notification-area");
  const toggleBtn = document.getElementById("btn-toggle-notifications");
  if (!area) return;

  const isCurrentlyExpanded = area.classList.contains("is-expanded");
  const nextState = forceExpand !== null ? forceExpand : !isCurrentlyExpanded;

  if (nextState) {
    area.classList.add("is-expanded");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
  } else {
    area.classList.remove("is-expanded");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  }
}

export function renderNotificationAreaShell() {
  renderMarkupOnce(
    "notification-area",
    (root) => root.querySelector(".notification-handle-bar"),
    `
    <div class="notification-handle-bar view-titlebar" id="notification-handle-bar">
      <button class="view-grabber notification-grabber" id="notification-grabber-btn" type="button" aria-label="Toggle notifications drawer"></button>
      
      <!-- Collapsed status summary preview when no active session bar -->
      <div class="notification-summary-preview" id="notification-summary-preview">
        <div class="notification-summary-header">
          <div class="notification-summary-title-wrap">
            <i class="fa-solid fa-bell notification-bell-icon" id="notification-summary-icon"></i>
            <span id="notification-summary-title" class="notification-summary-title">Welcome to LibrePT</span>
          </div>
          <div class="notification-summary-badges">
            <span id="notification-summary-count" class="notification-count-pill">3 unread / 3 all</span>
            <button class="icon-btn notification-toggle-btn" id="btn-toggle-notifications" aria-label="Toggle Notifications">
              <i class="fa-solid fa-chevron-up toggle-chevron"></i>
            </button>
          </div>
        </div>
        <p id="notification-summary-desc" class="notification-summary-desc">LibrePT is your privacy-first, buildless personal trainer app...</p>
      </div>

    </div>

    <div class="notification-drawer-feed" id="notification-drawer-feed">
      <div class="notification-feed-header">
        <div class="notification-feed-title">
          <i class="fa-solid fa-bell"></i>
          <span id="notification-feed-title-text">Notifications &amp; Status Feed</span>
        </div>
        <div class="notification-feed-actions">
          <span class="notification-count-pill" id="notification-feed-count">3 unread / 3 all</span>
        </div>
      </div>
      <div class="notification-list" id="notification-list-container">
        <!-- Dynamically populated by notificationArea.js with Welcome Demo, reservations, and alerts -->
      </div>
      <!-- Below the feed, not beside the title: at phone widths a labelled button in the header
           wrapped to two lines and squeezed the count pill. Sitting after the list it also reads
           as "and now clear the ones you just scrolled past". -->
      <div class="notification-feed-footer">
        <button type="button" class="btn secondary-btn notification-mark-all-btn" id="btn-mark-all-read">
          <i class="fa-solid fa-check-double"></i> <span id="btn-mark-all-read-text">Mark all as read</span>
        </button>
      </div>
    </div>
`,
  );
}

export function setupNotificationGestures() {
  renderNotificationAreaShell();
  const SWIPE_PX = 50; // vertical distance that commits the gesture
  const handleBar = document.getElementById("notification-handle-bar");
  const grabberBtn = document.getElementById("notification-grabber-btn");
  const toggleBtn = document.getElementById("btn-toggle-notifications");
  const summaryPreview = document.getElementById("notification-summary-preview");
  const markAllBtn = document.getElementById("btn-mark-all-read");
  const area = document.getElementById("notification-area");

  if (!handleBar || !area) return;

  // Clicking the grabber, summary preview, or chevron button toggles the expanded drawer
  const toggleHandler = (e) => {
    e.stopPropagation();
    toggleNotificationArea();
  };

  if (grabberBtn) grabberBtn.addEventListener("click", toggleHandler);
  if (toggleBtn) toggleBtn.addEventListener("click", toggleHandler);
  if (summaryPreview) summaryPreview.addEventListener("click", toggleHandler);

  if (markAllBtn) {
    markAllBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let readIds = [];
      try {
        readIds = JSON.parse(readVersionScoped(READ_NOTIFICATIONS_KEY) || "[]");
      } catch (e) {
        console.warn("Failed to parse read notifications from localStorage:", e);
        readIds = [];
      }
      const state = deps.getState?.() || {};
      // Every id currently in the feed, synthetic ones included — resolved through the same
      // function the render uses, so "mark all read" can never miss an item the feed is showing.
      const ids = resolveNotificationItems(
        state,
        deps.t,
        readIds,
        deps.getSyncFailure?.() || null,
      ).map((item) => item.id);
      for (const id of ids) {
        if (!readIds.includes(id)) readIds.push(id);
      }
      try {
        writeVersionScoped(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
      } catch (e) {
        console.warn("Failed to persist read notifications to localStorage:", e);
      }
      renderNotificationArea();
    });
  }

  let startY = null;
  let startX = null;

  handleBar.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest("a, input, select")) {
        startY = null;
        return;
      }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );

  handleBar.addEventListener(
    "touchend",
    (e) => {
      if (startY === null) return;
      const tTouch = e.changedTouches[0];
      const dy = tTouch.clientY - startY;
      const dx = tTouch.clientX - startX;
      startY = null;
      startX = null;

      // Commit only on a clearly vertical-dominant swipe
      if (Math.abs(dx) > Math.abs(dy) * 0.8 || Math.abs(dy) < SWIPE_PX) return;

      const isExpanded = area.classList.contains("is-expanded");

      // Dragging / swiping UP expands if collapsed
      if (dy < -SWIPE_PX && !isExpanded) {
        toggleNotificationArea(true);
      }
      // Dragging / swiping DOWN collapses if expanded
      else if (dy > SWIPE_PX && isExpanded) {
        toggleNotificationArea(false);
      }
    },
    { passive: true },
  );
}
