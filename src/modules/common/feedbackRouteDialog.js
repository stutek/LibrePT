// src/modules/common/feedbackRouteDialog.js — the way out of the app for a trainer with something to
// say (TODO §23.5).
//
// Single responsibility: the dialog. The address and the two prefilled messages are
// data/feedbackRoute.js, so what leaves the device is decided in one place and testable without a
// browser.
//
// **Two routes, split by KIND rather than by preference.** An idea, a question or "this is awkward"
// goes to an email address, because a GitHub account is a wall to a personal trainer and §23.5 named
// that the last launch prerequisite. Something BROKEN goes to an issue: an email thread about a bug
// has no version, no page and no way for the next person who hits it to find it, and an issue has
// all three.
//
// **The screenshot is asked for, not taken.** A web page cannot photograph a screen on its own — the
// only API that can (`getDisplayMedia`) opens a permission prompt, exists on desktop only, and on a
// phone would ask a trainer mid-session to grant screen capture to a web page. The OS screenshot
// they already know how to take is one gesture, works everywhere, and needs no permission from
// anybody. So the app fills in everything it CAN know and says the rest plainly.
//
// **Nothing is sent from here.** Both buttons open something the trainer then reads and submits
// themselves — the same rule the crash reporter follows (§12.4).
//
// Injected dependencies: `t`, `getState`, `buildSha`, `route`, `repoUrl`.

import { bugIssueUrl, diagnosticsBlock, feedbackMailto } from "../../data/feedbackRoute.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

let deps = null;

export function initFeedbackRouteDialog(injected) {
  deps = injected;
}

export function renderFeedbackRouteDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-feedback-route"),
    `
<dialog id="dialog-feedback-route" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="feedback-route-title">Tell us what you think</h3>
    <button class="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="feedback-route-lede" class="text-sm"></p>
    <a id="feedback-route-mail" class="btn primary-btn feedback-route-btn" href="#">
      <i class="fa-solid fa-envelope"></i> <span id="feedback-route-mail-label"></span>
    </a>
    <!-- The bug half is deliberately below and quieter: most of what a trainer wants to say is not a
         bug, and leading with a bug report tells them the app expects to be broken. -->
    <p id="feedback-route-bug-lede" class="text-sm text-muted"></p>
    <!-- The tracker is PUBLIC and a screenshot of this app shows real people. Said before the
         button rather than inside the issue body, because by the time they are reading the issue
         they have already chosen the image. -->
    <p id="feedback-route-public-warning" class="text-sm feedback-route-warning"></p>
    <a id="feedback-route-issue" class="btn secondary-btn feedback-route-btn" target="_blank" rel="noopener noreferrer" href="#">
      <i class="fa-solid fa-bug"></i> <span id="feedback-route-issue-label"></span>
    </a>
    <p id="feedback-route-diagnostics-label" class="text-sm text-muted"></p>
    <pre id="feedback-route-diagnostics" class="feedback-route-diagnostics"></pre>
  </div>
</dialog>
`,
  );
}

/** What the app knows about this device — the four lines both routes carry, and the trainer can
 * read them here before either is opened. */
function currentDiagnostics() {
  const state = deps.getState?.() || {};
  return diagnosticsBlock({
    build: deps.buildSha?.() || "",
    route: deps.route?.() || "",
    lang: state.lang || "",
    screen: `${window.innerWidth}x${window.innerHeight}`,
  });
}

export function openFeedbackRouteDialog() {
  renderFeedbackRouteDialog();
  const { t } = deps;
  const diagnostics = currentDiagnostics();

  const text = [
    ["feedback-route-title", t("feedback_route_title")],
    ["feedback-route-lede", t("feedback_route_lede")],
    ["feedback-route-mail-label", t("feedback_route_mail")],
    ["feedback-route-bug-lede", t("feedback_route_bug_lede")],
    ["feedback-route-public-warning", t("feedback_route_public_warning")],
    ["feedback-route-issue-label", t("feedback_route_issue")],
    ["feedback-route-diagnostics-label", t("feedback_route_diagnostics")],
    ["feedback-route-diagnostics", diagnostics],
  ];
  for (const [id, value] of text) {
    const element = document.getElementById(id);
    // textContent throughout: the diagnostics carry a route the trainer may have typed into.
    if (element) element.textContent = value;
  }

  document.getElementById("feedback-route-mail").href = feedbackMailto({
    subject: t("feedback_route_subject"),
    intro: t("feedback_route_intro"),
    diagnostics,
  });

  const issue = document.getElementById("feedback-route-issue");
  const issueUrl = bugIssueUrl({
    repoUrl: deps.repoUrl,
    title: t("feedback_route_issue_title"),
    whatHappened: t("feedback_route_issue_placeholder"),
    diagnostics,
  });
  issue.href = issueUrl || "#";
  // No repository to file against means no button, rather than one that goes nowhere — and no
  // warning about a public tracker nobody is being sent to.
  issue.classList.toggle("hidden", !issueUrl);
  document.getElementById("feedback-route-public-warning").classList.toggle("hidden", !issueUrl);

  document
    .querySelector("#dialog-feedback-route .modal-close-btn")
    ?.addEventListener("click", () => closeModal("dialog-feedback-route"), { once: true });

  openModal("dialog-feedback-route");
}
