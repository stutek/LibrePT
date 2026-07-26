// src/modules/common/buildInfoDialog.js — "which build am I on", reachable on a phone.
// Single responsibility: compose the build identity (release · commit · data schema · built) and
// show it in a tappable, COPYABLE dialog.
//
// Why this exists: the header stamp shows only the short label, and the long form used to live in
// its `title` tooltip — which a phone cannot reach at all. Since the app is used on the gym floor,
// a support detail only a mouse can see is a support detail nobody has. Copy-to-clipboard matters
// as much as the display: the point of a commit SHA is pasting it into a bug report.
//
// The DATA SCHEMA is shown alongside the code version deliberately — after a rollback, "which
// version" and "which data shape" are different questions, and the second is the one that explains
// missing records (TODO §16).
//
// Injected dependencies: { t } (translator).

import { CURRENT_SCHEMA_VERSION } from "../../data/migrationSteps.js";
import { BUILD_INFO } from "../../version.js";
import { currentRelease } from "./releaseIdentity.js";

let deps = {};

export function initBuildInfoDialog(d) {
  deps = d || {};
}

// The single string a trainer copies into a message. Deliberately one line per fact and plain text:
// it gets pasted into whatever chat app is to hand, not into a form that can parse it.
export function buildInfoText() {
  const commit = typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit : "";
  return [
    "LibrePT build",
    `release: ${currentRelease()}`,
    `commit: ${commit || "unknown"}`,
    `data schema: ${CURRENT_SCHEMA_VERSION}`,
    `built: ${BUILD_INFO?.builtAt || "unknown"}`,
  ].join("\n");
}

function rows() {
  const t = deps.t || ((_key, fallback) => fallback);
  const commit = typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit : "";
  return [
    [t("build_info_release") || "Version", currentRelease()],
    [t("build_info_commit") || "Commit", commit || "—"],
    [t("build_info_schema") || "Data schema", String(CURRENT_SCHEMA_VERSION)],
    [t("build_info_built") || "Built", BUILD_INFO?.builtAt || "—"],
  ];
}

export function renderBuildInfo() {
  const list = document.getElementById("build-info-rows");
  if (!list) return;
  const t = deps.t || (() => "");
  list.innerHTML = rows()
    .map(([label, value]) => `<div class="build-info-row"><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  const title = document.getElementById("build-info-title");
  if (title) title.textContent = t("build_info_title") || "This build";
  const copyBtn = document.getElementById("btn-copy-build-info");
  if (copyBtn) copyBtn.textContent = t("build_info_copy") || "Copy build details";
}

export function setupBuildInfoDialog() {
  const dialog = document.getElementById("dialog-build-info");
  const stamp = document.getElementById("app-version");
  if (!dialog || !stamp) return;

  // A route, so the build identity is a link a PT can paste into a bug report and Back dismisses it.
  // The route calls renderBuildInfo() before showing.
  //
  // The stamp sits inside #logo-area, which navigates home on click. That used to be harmless — the
  // dialog simply opened over a re-rendered dashboard — but now that the dialog is a route, letting
  // the event through means routing home a tick later, which closes it again.
  stamp.addEventListener("click", (event) => {
    event.stopPropagation();
    deps.navigateToPath(deps.urlFor("build"));
  });
  dialog.querySelector(".modal-close-btn")?.addEventListener("click", () => dialog.close());

  const copyBtn = document.getElementById("btn-copy-build-info");
  copyBtn?.addEventListener("click", async () => {
    const t = deps.t || (() => "");
    try {
      await navigator.clipboard.writeText(buildInfoText());
      copyBtn.textContent = t("build_info_copied") || "Copied";
    } catch {
      // Clipboard access can be denied (insecure context, permission). Selecting the text is the
      // fallback that always works — never leave the trainer with a button that silently did nothing.
      const range = document.createRange();
      const list = document.getElementById("build-info-rows");
      if (list) {
        range.selectNodeContents(list);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      copyBtn.textContent = t("build_info_copy_failed") || "Select and copy the text above";
    }
  });
}
