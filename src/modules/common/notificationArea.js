// src/modules/common/notificationArea.js
// Omnipresent bottom notification and status area replacing the old app footer.
// Handles:
//   - Collapsed status bar showing grab handle, active/next session status, and notification count.
//   - Expandable upward drawer/sheet triggered by clicking or swiping/dragging the handle or bar upwards
//     (mimicking active-session-overlay collapse/expand behavior).
//   - Priority-ordered notification feed: Live/Upcoming session → Welcome/Demo message → Reservations/Cancellations.
//
// Dependencies injected via initNotificationArea({ getState, getActiveSession, t, escapeHTML, navigateToPath })

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

function renderEmptyNotificationState(
  container,
  t,
  escapeHTML,
  { summaryTitleEl, summaryDescEl, summaryIconEl },
) {
  if (summaryTitleEl) summaryTitleEl.textContent = t("notif_welcome_title") || "Interactive Demo";
  if (summaryDescEl) summaryDescEl.textContent = t("notif_welcome_desc") || "Run demo";
  if (summaryIconEl)
    summaryIconEl.className = "fa-solid fa-wand-magic-sparkles notification-bell-icon";

  container.innerHTML = `
    <div class="notification-empty">
      <div class="notification-card welcome unread" data-notification-id="demo-invitation">
        <div class="notification-card-icon">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="notification-card-content">
          <h4 class="notification-card-title">${escapeHTML(t("notif_welcome_title"))} <span class="unread-dot" title="Unread"></span></h4>
          <p class="notification-card-desc">${escapeHTML(t("notif_welcome_desc"))}</p>
          <div class="notification-actions">
            <button type="button" class="notification-btn primary" id="btn-run-inapp-demo">${escapeHTML(t("notif_demo_btn") || "Run Live Demo")}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const demoBtn = container.querySelector("#btn-run-inapp-demo");
  demoBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof window.seedMockData === "function") {
      window.seedMockData();
      window.location.reload();
    }
  });
}

function buildNotificationActionHTML(act, itemId, escapeHTML) {
  const primaryCls = act.primary ? "primary" : "";
  if (act.resetDemo) {
    return `<button type="button" class="notification-btn ${primaryCls}" data-action-reset="true" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
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
  for (const btn of container.querySelectorAll("button[data-action-reset]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const msg =
        t("confirm_reset_demo_data") ||
        "Clear all sample demo data and reset to a clean, empty slate?";
      if (window.confirm(msg) && typeof window.resetLibrePTData === "function") {
        window.resetLibrePTData({ demo: false });
      }
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

export function renderNotificationArea() {
  if (!deps) return;
  const { t, escapeHTML } = deps;

  const container = document.getElementById("notification-list-container");
  const summaryCountEl = document.getElementById("notification-summary-count");
  const feedCountEl = document.getElementById("notification-feed-count");
  const summaryTitleEl = document.getElementById("notification-summary-title");
  const summaryDescEl = document.getElementById("notification-summary-desc");
  const summaryIconEl = document.getElementById("notification-summary-icon");
  if (!container) return;

  const readIds = loadReadNotificationIds();
  const state = deps.getState?.() || {};
  const items = resolveNotificationItems(state, t, readIds);

  const allCount = items.length;
  const unreadCount = items.filter((i) => !i.read).length;
  const countText = (t("notif_count_badge") || "{unread} unread / {all} all")
    .replace("{unread}", unreadCount.toString())
    .replace("{all}", allCount.toString());

  if (summaryCountEl) {
    summaryCountEl.textContent = countText;
    summaryCountEl.classList.toggle("has-unread", unreadCount > 0);
  }
  if (feedCountEl) {
    feedCountEl.textContent = countText;
    feedCountEl.classList.toggle("has-unread", unreadCount > 0);
  }

  const markAllBtn = document.getElementById("btn-mark-all-read");
  if (markAllBtn) {
    markAllBtn.style.display = unreadCount > 0 ? "inline-flex" : "none";
  }

  if (items.length === 0) {
    renderEmptyNotificationState(container, t, escapeHTML, {
      summaryTitleEl,
      summaryDescEl,
      summaryIconEl,
    });
    syncNotificationBarState();
    return;
  }

  const firstItem = items[0];
  if (summaryTitleEl) summaryTitleEl.textContent = firstItem.title.replace("👋 ", "");
  if (summaryDescEl) summaryDescEl.textContent = firstItem.description;
  if (summaryIconEl && firstItem.icon)
    summaryIconEl.className = `${firstItem.icon} notification-bell-icon`;

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
          <button type="button" class="btn btn-xs secondary-btn" id="btn-mark-all-read" title="Mark all as read">
            <i class="fa-solid fa-check-double"></i> <span id="btn-mark-all-read-text">Mark all as read</span>
          </button>
          <span class="notification-count-pill" id="notification-feed-count">3 unread / 3 all</span>
        </div>
      </div>
      <div class="notification-list" id="notification-list-container">
        <!-- Dynamically populated by notificationArea.js with Welcome Demo, reservations, and alerts -->
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
      const ids = resolveNotificationItems(state, deps.t).map((item) => item.id);
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
