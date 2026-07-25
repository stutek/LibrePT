// src/modules/common/versionMessages.js — the version upgrade / rollback / end-of-support messages
// in the notification area, and the switch they perform (TODO §16.1).
// Single responsibility: render what the version catalog offers, and carry out the PT's choice.
//
// These cards are deliberately NOT part of the data-driven notification feed: they are runtime
// state, not stored records, and §16.1 requires the upgrade and switch-back invitations to be
// **non-dismissable** — so they carry no unread dot and no mark-as-read affordance. They sit above
// the feed and stay until the situation that produced them changes.
//
// The switch itself is the explicit one-time copy §16.2 calls out as separate from routing: copy
// this release's data into the target's bucket, then navigate. The source bucket is left untouched,
// which is exactly why rolling back later can only return the snapshot as of that moment — the
// data-loss warning is the honest statement of that, shown before a rollback and not after.
//
// Injected dependencies: { t, escapeHTML, basePath, getCatalog, confirm, navigate }.

import { copyBucket } from "../../data/storageNamespace.js";
import { evaluateVersionOffer, releaseUrl } from "../../data/versionCatalog.js";
import { currentRelease } from "./releaseIdentity.js";

let deps = {};

export function initVersionMessages(d) {
  deps = {
    confirm: (m) => window.confirm(m),
    navigate: (url) => window.location.assign(url),
    ...d,
  };
}

function fill(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

/**
 * Switch this device to `target`, copying the running release's data into its bucket first.
 * Returns the copy result so a caller can report what moved; navigation is the last step, so a
 * refused or failed copy never leaves the PT on a version whose bucket was never seeded.
 */
export function switchToRelease(target, { overwrite = false, release = currentRelease() } = {}) {
  const from = release;
  const result = copyBucket(from, target.id, { overwrite });
  const url = releaseUrl(deps.basePath || "./", target, from);
  if (url) deps.navigate(url);
  return result;
}

function card({ id, tone, icon, title, description, actionLabel, actionId }) {
  const { escapeHTML } = deps;
  return `
    <div class="notification-card version-offer ${tone}" data-version-message="${escapeHTML(id)}">
      <div class="notification-card-icon"><i class="${escapeHTML(icon)}"></i></div>
      <div class="notification-card-content">
        <h4 class="notification-card-title">${escapeHTML(title)}</h4>
        <p class="notification-card-desc">${escapeHTML(description)}</p>
        <div class="notification-actions">
          <button type="button" class="notification-btn primary" data-version-action="${escapeHTML(actionId)}">${escapeHTML(actionLabel)}</button>
        </div>
      </div>
    </div>`;
}

/**
 * Prepend the version messages to the notification feed. A no-op when there is nothing to offer —
 * which is every build until versioned hosting publishes a manifest.
 */
export function renderVersionMessages(container, { release = currentRelease() } = {}) {
  if (!container || !deps.t) return;
  const catalog = deps.getCatalog?.();
  const { upgrade, rollback, eol } = evaluateVersionOffer(catalog, { release });
  if (!upgrade && !rollback && !eol) return;

  const { t } = deps;
  const running = release;
  const cards = [];

  if (eol) {
    cards.push(
      card({
        id: "version-eol",
        tone: "warning",
        icon: "fa-solid fa-triangle-exclamation",
        title: t("version_eol_title") || "This version is no longer supported",
        description: fill(
          t("version_eol_desc") || "Fixes only land on the current version ({version}).",
          { version: upgrade?.id || "" },
        ),
        actionLabel: fill(t("version_upgrade_btn") || "Switch to {version}", {
          version: upgrade?.id || "",
        }),
        actionId: upgrade ? `upgrade:${upgrade.id}` : "",
      }),
    );
  } else if (upgrade) {
    cards.push(
      card({
        id: "version-upgrade",
        tone: "info",
        icon: "fa-solid fa-circle-up",
        title: t("version_upgrade_title") || "A new version is available",
        description: fill(
          t("version_upgrade_desc") ||
            "Version {version} is ready. Switch whenever it suits you — your data is copied across.",
          { version: upgrade.id },
        ),
        actionLabel: fill(t("version_upgrade_btn") || "Switch to {version}", {
          version: upgrade.id,
        }),
        actionId: `upgrade:${upgrade.id}`,
      }),
    );
  }

  if (rollback) {
    cards.push(
      card({
        id: "version-rollback",
        tone: "muted",
        icon: "fa-solid fa-rotate-left",
        title: fill(t("version_rollback_title") || "Go back to {version}", {
          version: rollback.id,
        }),
        description: fill(
          t("version_rollback_desc") ||
            "You can return to {version} at any time. Anything recorded since you switched stays on {current} and does not come back with you.",
          { version: rollback.id, current: running },
        ),
        actionLabel: t("version_rollback_btn") || "Switch back",
        actionId: `rollback:${rollback.id}`,
      }),
    );
  }

  container.insertAdjacentHTML("afterbegin", cards.join(""));

  for (const button of container.querySelectorAll("button[data-version-action]")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const [kind, id] = (button.getAttribute("data-version-action") || "").split(":");
      const target = kind === "rollback" ? rollback : upgrade;
      if (!target || target.id !== id) return;

      // Only the rollback is gated: going back means leaving newer work behind, and the PT should
      // meet that sentence before it happens, not discover it afterwards.
      if (kind === "rollback") {
        const warning = fill(
          t("version_rollback_confirm") ||
            "Switch back to {version}? Anything recorded on {current} since you upgraded will stay there.",
          { version: target.id, current: running },
        );
        if (!deps.confirm(warning)) return;
      }
      switchToRelease(target, { release: running });
    });
  }
}
