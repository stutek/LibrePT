// src/modules/common/notificationArea.js
// Omnipresent bottom notification and status area replacing the old app footer.
// Handles:
//   - Collapsed status bar showing grab handle, active/next session status, and notification count.
//   - Expandable upward drawer/sheet triggered by clicking or swiping/dragging the handle or bar upwards
//     (mimicking active-session-overlay collapse/expand behavior).
//   - Priority-ordered notification feed: Live/Upcoming session → Welcome/Demo message → Reservations/Cancellations.
//
// Dependencies injected via initNotificationArea({ getState, getActiveSession, t, escapeHTML,
// navigateToPath, getSyncFailure, startWalkthrough, enterSandbox }) — `getSyncFailure` is an
// accessor rather than a value because a sync can fail at any moment after boot, and it keeps this
// module unaware of Drive entirely. The two offers on an empty app are injected for the same reason
// the seeding one before them was: the walkthrough's deep link is built in modules/splash and
// switching workspace is app.js's own job. Reaching either through a global — `window.seedMockData`,
// as the old one did — is an import no layering gate can see.

import { stateHasData } from "../../data/stateStore.js";
import { readVersionScoped, writeVersionScoped } from "../../data/storageNamespace.js";
import { isSandbox } from "../../data/workspace.js";
import { resolveNotificationItems } from "../../domain/notificationItems.js";
import { renderMarkupOnce } from "./dom.js";
import { INIT_DEMO_DATA, getShareParams } from "./shareLink.js";

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

/** The only card an empty app has, and therefore the only thing it can say for itself.
 *
 * It used to offer ONE button, which seeded thirty sample people into the database the trainer was
 * about to start working in. The sandbox ended that (TODO §40): there is now a separate copy of the
 * app to try things in, so sample records never have to touch the trainer's own. Asked 2026-09-11 —
 * the empty app should invite somebody to the walkthrough and to the sandbox — and the offer is
 * those two, in that order: being shown the app is the smaller ask, trying it yourself is the
 * larger, and both land in the same place, so neither can spoil anything.
 *
 * Both actions are injected rather than imported: the walkthrough's deep link is built in
 * modules/splash and switching workspace is app.js's own job, and neither is reachable from here.
 */
function renderFirstRunInvitation(container, t, escapeHTML, summaryEls, deps) {
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
          ${buildChapterIndexHTML(deps.storyChapters, t, escapeHTML)}
          <div class="notification-actions">
            <button type="button" class="notification-btn" id="btn-first-run-sandbox">${escapeHTML(t("menu_sandbox_enter"))}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector("#btn-first-run-sandbox")?.addEventListener("click", (e) => {
    e.stopPropagation();
    deps.enterSandbox?.();
  });
  // This card is rendered on its own path, outside the resolved feed, so it wires its own chapters
  // too — the same listener wireNotificationCardActions puts on the cards below.
  wireChapterIndex(container, deps);
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
    return `<a href="${escapeHTML(act.url)}" target="_blank" rel="noopener noreferrer" class="notification-link" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)} <i class="fa-solid fa-arrow-up-right-from-square notification-link-icon"></i></a>`;
  }
  return `<button type="button" class="notification-btn ${primaryCls}" data-nav-target="${escapeHTML(act.view || "")}" data-action-id="${escapeHTML(itemId)}">${escapeHTML(act.label)}</button>`;
}

/** The guided story's table of contents: how the walkthrough is offered here, in full.
 *
 * OPEN, never folded (asked for 2026-09-21). A fold is an offer nobody can see, and this list is the
 * only way into the guide now that the "show me around" button is gone — the button did what the
 * first line of the list does, and two controls for one act is one to mis-tap.
 *
 * `t` is applied here rather than stored in the item, so the list is in the language on screen when
 * it is drawn — the feed is redrawn on a language switch.
 */
function buildChapterIndexHTML(chapters, t, escapeHTML) {
  if (!chapters?.length) return "";
  const rows = chapters
    .map(
      ({ id, titleKey }) =>
        `<li><button type="button" class="notification-chapter" data-action-chapter="${escapeHTML(id)}">${escapeHTML(t(titleKey))}</button></li>`,
    )
    .join("");
  return `<div class="notification-chapters">
          <p class="notification-chapters-heading">${escapeHTML(t("walkthrough_chapters_heading"))}</p>
          <ol class="notification-chapter-list">${rows}</ol>
        </div>`;
}

/** Start the guided story at one named chapter (TODO §28.14, §73.1).
 *
 * `startWalkthrough` is injected rather than imported: the guide reloads the app with its own deep
 * link, and that URL is built in modules/splash — which this module may not reach across.
 */
function wireChapterIndex(container, deps) {
  for (const btn of container.querySelectorAll("button[data-action-chapter]")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deps.startWalkthrough?.(btn.getAttribute("data-action-chapter"));
    });
  }
}

function buildNotificationCardHTML(item, escapeHTML, t) {
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
          ${buildChapterIndexHTML(item.chapters, t, escapeHTML)}
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

  wireChapterIndex(container, deps);

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
  if (markAllFooter) markAllFooter.classList.toggle("hidden", unreadCount <= 0);
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
    // In the sandbox this card says what the sandbox is and where the way out is (TODO §42.10).
    sandbox: isSandbox(),
    // Whether THIS boot carries the seeding switch — not whether a test is running, which no page
    // can know (TODO §46.7). The browser suite puts the switch on every navigation, so the escaped
    // test-data alarm stays silent there and speaks on a trainer's install, where it never appears.
    testRun: getShareParams().init === INIT_DEMO_DATA,
    // The guided story's chapters, so the sandbox card can offer any one of them rather than only
    // the beginning. Injected like the walkthrough's own deep link and for the same reason: they
    // come from the story script, which this module may not reach across to.
    chapters: deps.storyChapters || [],
  });
  paintFeedCounts(items, t);

  if (items.length === 0) {
    if (stateHasData(state)) {
      renderCaughtUpState(container, t, escapeHTML, summaryEls);
    } else {
      renderFirstRunInvitation(container, t, escapeHTML, summaryEls, deps);
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

  container.innerHTML = items
    .map((item) => buildNotificationCardHTML(item, escapeHTML, t))
    .join("");

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
      // The same options the render uses, or "mark all read" resolves a different feed from the one
      // on screen — it would miss the sandbox's wording and invent an escaped-test-data item that
      // the trainer was never shown.
      const ids = resolveNotificationItems(
        state,
        deps.t,
        readIds,
        deps.getSyncFailure?.() || null,
        {
          crashes: deps.getCrashes?.() || [],
          repoUrl: deps.repoUrl || "",
          sandbox: isSandbox(),
          testRun: getShareParams().init === INIT_DEMO_DATA,
        },
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
