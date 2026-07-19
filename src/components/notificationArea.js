// components/notificationArea.js
// Omnipresent bottom notification and status area replacing the old app footer.
// Handles:
//   - Collapsed status bar showing grab handle, active/next session status, and notification count.
//   - Expandable upward drawer/sheet triggered by clicking or swiping/dragging the handle or bar upwards
//     (mimicking active-session-overlay collapse/expand behavior).
//   - Priority-ordered notification feed: Live/Upcoming session → Welcome/Demo message → Reservations/Cancellations.
//
// Dependencies injected via initNotificationArea({ getState, getActiveSession, t, escapeHTML, navigateToPath })

let deps = null;
const barObserver = null;

export function initNotificationArea(d) {
  deps = d;
}

export function syncNotificationBarState() {
  const area = document.getElementById("notification-area");
  if (area) area.classList.remove("has-active-session");
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

  // Read stored read IDs
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem("librept_read_notifications") || "[]");
  } catch (e) {
    readIds = [];
  }

  // Build the priority-ordered notification items list
  const items = [];

  // 1. Welcome to LibrePT / Run the Demo message (TODO 9.3 & 11.1)
  items.push({
    id: "demo-welcome",
    type: "welcome",
    icon: "fa-solid fa-sparkles",
    title: t("notif_welcome_title"),
    description: t("notif_welcome_desc"),
    actions: [
      { label: t("notif_demo_btn"), url: "https://stutek.github.io/LibrePT/", primary: true },
      { label: t("notif_walkthrough_btn"), view: "/clients", primary: false },
    ],
  });

  // 2. Client Spot Reservation sample notification (TODO 11.1)
  items.push({
    id: "spot-reservation-1",
    type: "reservation",
    icon: "fa-solid fa-calendar-check",
    title: t("notif_spot_res_title"),
    description: t("notif_spot_res_desc"),
    actions: [],
  });

  // 3. Spot Cancellation sample notification (TODO 11.1)
  items.push({
    id: "spot-cancellation-1",
    type: "cancellation",
    icon: "fa-solid fa-calendar-xmark",
    title: t("notif_spot_cancel_title"),
    description: t("notif_spot_cancel_desc"),
    actions: [],
  });

  for (const item of items) {
    item.read = readIds.includes(item.id);
  }

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

  if (items.length > 0) {
    const firstItem = items[0];
    if (summaryTitleEl) summaryTitleEl.textContent = firstItem.title.replace("👋 ", "");
    if (summaryDescEl) summaryDescEl.textContent = firstItem.description;
    if (summaryIconEl && firstItem.icon)
      summaryIconEl.className = `${firstItem.icon} notification-bell-icon`;
  }

  container.innerHTML = items
    .map((item) => {
      const iconClass = item.icon || "fa-solid fa-bell";
      const actionsHTML =
        item.actions && item.actions.length > 0
          ? `<div class="notification-actions">
          ${item.actions
            .map((act) => {
              if (act.url) {
                return `<a href="${escapeHTML(act.url)}" target="_blank" rel="noopener noreferrer" class="notification-btn ${act.primary ? "primary" : ""}" data-action-id="${escapeHTML(item.id)}">${escapeHTML(act.label)}</a>`;
              }
              return `<button type="button" class="notification-btn ${act.primary ? "primary" : ""}" data-nav-target="${escapeHTML(act.view || "")}" data-action-id="${escapeHTML(item.id)}">${escapeHTML(act.label)}</button>`;
            })
            .join("")}
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
    })
    .join("");

  // Attach navigation action listeners and mark-read listeners inside the notification cards
  for (const btn of container.querySelectorAll("button[data-nav-target]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = btn.getAttribute("data-nav-target");
      const itemId = btn.getAttribute("data-action-id");
      if (itemId && !readIds.includes(itemId)) {
        readIds.push(itemId);
        try {
          localStorage.setItem("librept_read_notifications", JSON.stringify(readIds));
        } catch (e) {}
      }
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
      const itemId = link.getAttribute("data-action-id");
      if (itemId && !readIds.includes(itemId)) {
        readIds.push(itemId);
        try {
          localStorage.setItem("librept_read_notifications", JSON.stringify(readIds));
        } catch (e) {}
        renderNotificationArea();
      }
    });
  }

  // Clicking any unread card marks it as read
  for (const card of container.querySelectorAll(".notification-card.unread")) {
    card.addEventListener("click", () => {
      const itemId = card.getAttribute("data-notification-id");
      if (itemId && !readIds.includes(itemId)) {
        readIds.push(itemId);
        try {
          localStorage.setItem("librept_read_notifications", JSON.stringify(readIds));
        } catch (e) {}
        renderNotificationArea();
      }
    });
  }

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

export function setupNotificationGestures() {
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
        readIds = JSON.parse(localStorage.getItem("librept_read_notifications") || "[]");
      } catch (e) {
        readIds = [];
      }
      for (const id of ["demo-welcome", "spot-reservation-1", "spot-cancellation-1"]) {
        if (!readIds.includes(id)) readIds.push(id);
      }
      try {
        localStorage.setItem("librept_read_notifications", JSON.stringify(readIds));
      } catch (e) {}
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
