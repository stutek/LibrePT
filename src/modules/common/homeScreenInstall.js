// src/modules/common/homeScreenInstall.js — the offer to put the app's icon on the phone's home
// screen (asked 2026-10-13): once after the welcome screen, as a card in the notification area, and
// at any time in Settings.
//
// **What a page can do depends on the browser, so there are five situations, and each says one
// thing.** The app already runs from its icon: nothing is offered, and Settings says so. Chrome on
// Android and Chromium on a desktop fire `beforeinstallprompt`: the event is kept, and the offer's
// button opens the browser's own install question. Safari on an iPhone or an iPad fires nothing and
// has no way for a page to start it: the offer lists the steps, naming Safari's controls by the
// labels Safari shows. Those labels are quoted from Apple's own pages, in each language —
// support.apple.com/{en-us,de-de,sl-si}/guide/iphone/iphea86e5236/ios (Turn a website into an app)
// and .../guide/ipad/ipadc602b75b/ipados (Add a website icon to the Home Screen); the iPad's German
// label differs from the iPhone's, which is why the two have their own steps. Any other browser:
// the card is not shown, and Settings says that this browser adds the icon from its own menu.
//
// **Closed once, closed for good.** Closing the card or installing the app writes one key, read and
// written unscoped (storageNamespace's ORIGIN_GLOBAL_KEYS): it is a fact about the person, not about
// a workspace, so neither the sandbox nor a sandbox reset brings the card back. Settings keeps the
// offer whatever the key says.
//
// Injected dependencies: none at import. `listenForInstallPrompt(win)` is called by app.js at the
// start of boot, before the service worker is registered — the event can only fire after that.
// The card's `t` and the close callback arrive as arguments.

const CLOSED_KEY = "librept_home_screen_offer_closed";

export const INSTALLED = "installed";
export const BROWSER_PROMPT = "browser-prompt";
export const IPHONE_STEPS = "iphone-steps";
export const IPAD_STEPS = "ipad-steps";
export const BROWSER_MENU = "browser-menu";

// The steps for each Apple device, in order. `{pageMenu}` and `{share}` are where the glyph of the
// button just named is drawn, as Apple's page draws it.
const STEP_KEYS = {
  [IPHONE_STEPS]: ["home_screen_iphone_step1", "home_screen_iphone_step2", "home_screen_iphone_step3"],
  [IPAD_STEPS]: ["home_screen_ipad_step1", "home_screen_ipad_step2"],
};
// The drawings of Safari's two buttons on Apple's pages, beside the label and never instead of it.
// The Share button is Font Awesome's square with an arrow up. The Page Menu button is three lines,
// the last one short, which no Font Awesome icon draws, so its stylesheet draws it.
const GLYPHS = {
  pageMenu: "home-screen-glyph-page-menu",
  share: "fa-solid fa-arrow-up-from-bracket",
};

let deferredPrompt = null;
let installedThisVisit = false;
const listeners = new Set();

/** Which of the five situations this browser is in. Pure, so it is tested without a browser.
 *
 * `standalone` is the app already running from its icon. `maxTouchPoints` tells an iPad apart from a
 * Mac: Safari on an iPad asks for desktop sites by default and then calls itself "Macintosh". */
export function installSituation({
  standalone = false,
  canPrompt = false,
  userAgent = "",
  maxTouchPoints = 0,
} = {}) {
  if (standalone) return INSTALLED;
  if (canPrompt) return BROWSER_PROMPT;
  if (!isSafari(userAgent)) return BROWSER_MENU;
  if (/iPhone|iPod/.test(userAgent)) return IPHONE_STEPS;
  if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) {
    return IPAD_STEPS;
  }
  return BROWSER_MENU;
}

// Every other browser on an iPhone also says "Safari/" in its user agent, followed by its own name.
// Their menus are not Safari's, so Safari's steps would name controls they do not have.
function isSafari(userAgent) {
  return (
    /Safari\//.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser|Brave/.test(userAgent)
  );
}

function runsFromItsIcon(win) {
  return (
    installedThisVisit ||
    win.navigator.standalone === true ||
    Boolean(win.matchMedia?.("(display-mode: standalone)").matches)
  );
}

export function currentSituation(win = window) {
  return installSituation({
    standalone: runsFromItsIcon(win),
    canPrompt: deferredPrompt !== null,
    userAgent: win.navigator.userAgent,
    maxTouchPoints: win.navigator.maxTouchPoints || 0,
  });
}

function notify() {
  for (const listener of listeners) listener();
}

/** Called when the situation changes — the browser's event arrives late, or the app was installed.
 *  Both surfaces redraw from it. */
export function onInstallSituationChange(listener) {
  listeners.add(listener);
}

/** Keep the browser's install event for the offer's button. `preventDefault` stops the browser
 *  showing its own install bar as well (MDN, BeforeInstallPromptEvent): two offers for one act is one
 *  too many, and the app's own says why. */
export function listenForInstallPrompt(win = window) {
  win.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  win.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installedThisVisit = true;
    rememberClosed();
    notify();
  });
}

/** Open the browser's own install question. An event opens it once, so it is dropped here; the
 *  browser fires a new one if the trainer said no. */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return;
  deferredPrompt = null;
  notify();
  const result = await event.prompt();
  if (result?.outcome === "accepted") rememberClosed();
  notify();
}

export function offerClosed() {
  try {
    return localStorage.getItem(CLOSED_KEY) === "1";
  } catch {
    // Storage unavailable: the card shows, and closing it hides it until the next draw.
    return false;
  }
}

function rememberClosed() {
  try {
    localStorage.setItem(CLOSED_KEY, "1");
  } catch (err) {
    console.warn("Failed to persist the closed home-screen offer to localStorage:", err);
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One step's words, with the glyph drawn after each button that has one. */
function stepItem(text) {
  const item = element("li");
  for (const part of text.split(/(\{pageMenu\}|\{share\})/)) {
    const glyph = GLYPHS[part.slice(1, -1)];
    if (glyph) {
      const icon = element("span", `${glyph} home-screen-glyph`);
      icon.setAttribute("aria-hidden", "true");
      item.append(icon);
    } else if (part) {
      item.append(document.createTextNode(part));
    }
  }
  return item;
}

function stepsList(t, situation) {
  const list = element("ol", "home-screen-steps");
  for (const key of STEP_KEYS[situation]) list.append(stepItem(t(key)));
  return list;
}

function addButton(t, className) {
  const button = element("button", className, t("home_screen_add"));
  button.type = "button";
  button.dataset.homeScreenAdd = "true";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    promptInstall();
  });
  return button;
}

/** The card in the notification area, or null when there is nothing to offer: closed before, the
 *  app already on the home screen, or a browser where the app can neither ask nor name the steps. */
export function buildHomeScreenOfferCard(t, { onClosed = () => {} } = {}) {
  if (offerClosed()) return null;
  const situation = currentSituation();
  if (situation !== BROWSER_PROMPT && !STEP_KEYS[situation]) return null;

  const card = element("div", "notification-card welcome home-screen-offer");
  card.dataset.notificationId = "home-screen-offer";
  const iconWrap = element("div", "notification-card-icon");
  iconWrap.append(element("i", "fa-solid fa-mobile-screen-button"));
  const content = element("div", "notification-card-content");
  content.append(
    element("h4", "notification-card-title", t("home_screen_offer_title")),
    element("p", "notification-card-desc", t("home_screen_offer_desc")),
  );
  if (STEP_KEYS[situation]) content.append(stepsList(t, situation));

  const actions = element("div", "notification-actions");
  if (situation === BROWSER_PROMPT) actions.append(addButton(t, "notification-btn primary"));
  const close = element("button", "notification-btn", t("home_screen_offer_close"));
  close.type = "button";
  close.dataset.homeScreenClose = "true";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    rememberClosed();
    onClosed();
  });
  actions.append(close);
  content.append(actions);

  card.append(iconWrap, content);
  return card;
}

/** Settings' home-screen section, drawn into `#settings-home-screen`: always there, whatever the
 *  card's key says, so a trainer who closed the card can still do it. */
export function renderSettingsHomeScreen(t) {
  const section = document.getElementById("settings-home-screen");
  const heading = document.getElementById("settings-home-screen-heading");
  if (!section) return;
  if (heading) heading.textContent = t("home_screen_heading");

  const situation = currentSituation();
  section.dataset.situation = situation;
  if (situation === BROWSER_PROMPT) {
    const button = addButton(t, "session-menu-item");
    button.prepend(element("i", "fa-solid fa-mobile-screen-button"), " ");
    section.replaceChildren(button);
  } else if (STEP_KEYS[situation]) {
    section.replaceChildren(stepsList(t, situation));
  } else {
    const key = situation === INSTALLED ? "home_screen_installed" : "home_screen_browser_menu";
    section.replaceChildren(element("p", "settings-home-screen-note", t(key)));
  }
}
