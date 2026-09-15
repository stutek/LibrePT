// A trainer form's draft lifecycle: restore after defaults, remember input, and forget only
// after deliberate cancellation or a successful write. Form-specific structure is injected.
import {
  dismissDraftResume,
  forgetTrainerDraft,
  readTrainerDraft,
  writeTrainerDraft,
} from "../../data/trainerDrafts.js";
import { activeWorkspace } from "../../data/workspace.js";
import { flushWrites, writeQueueStatus } from "../../data/writeQueue.js";
import { applyFormDraft, readFormDraft } from "./formDraft.js";

const opened = new Map();

function showFailure(root, t) {
  let message = root.querySelector("[data-draft-error]");
  if (!message) {
    message = document.createElement("p");
    message.dataset.draftError = "";
    message.className = "form-error";
    message.setAttribute("role", "alert");
    (root.matches("input, select, textarea") ? root.parentElement : root).appendChild(message);
  }
  message.textContent = t("draft_storage_failed");
}

/** The opener must have finished filling defaults before calling this. Reopening the same
 * subject reuses listeners but restores again; no listener ever discovers its subject later. */
export function openTrainerFormDraft(root, policy, t) {
  if (!root) return;
  const workspace = activeWorkspace();
  const context = policy.context?.() || {};
  const key = JSON.stringify([policy.id, policy.subject?.() || "new"]);
  const previous = opened.get(root.id);
  previous?.abort.abort();
  const abort = new AbortController();
  const entry = { root, key, workspace, abort, restoring: true, completing: false };
  opened.set(root.id, entry);
  const options = { signal: abort.signal };
  const safely = (action) => {
    try {
      return action();
    } catch {
      showFailure(root, t);
      return null;
    }
  };
  const snapshot = () => ({
    kind: policy.id,
    context,
    route: location.pathname,
    resume: policy.resume !== false,
    values: readFormDraft(root),
    extra: policy.read?.(),
    revision: crypto.randomUUID(),
  });
  const remember = () => {
    if (entry.restoring || opened.get(root.id) !== entry || workspace !== activeWorkspace()) return;
    if (root.tagName === "DIALOG" && !root.open) return;
    const view = root.closest(".app-view");
    if (view && !view.classList.contains("active")) return;
    entry.cancelled = false;
    safely(() => writeTrainerDraft(key, snapshot(), workspace));
  };
  entry.remember = remember;
  entry.discard = () => safely(() => forgetTrainerDraft(key, workspace));
  entry.complete = async () => {
    const draft = safely(() => readTrainerDraft(key, workspace));
    const failures = entry.failures ?? writeQueueStatus().failureCount;
    await flushWrites();
    if (writeQueueStatus().failureCount !== failures) return;
    safely(() => {
      if (readTrainerDraft(key, workspace)?.revision === draft?.revision) {
        forgetTrainerDraft(key, workspace);
      }
    });
  };

  safely(() => {
    const draft = readTrainerDraft(key, workspace);
    if (!draft) return;
    policy.restore?.(draft.extra, draft.context);
    applyFormDraft(root, draft.values);
    policy.afterRestore?.(draft.extra);
  });
  entry.restoring = false;
  root.addEventListener("input", remember, options);
  root.addEventListener("change", remember, options);
  root.addEventListener("draftchange", remember, options);
  root.addEventListener(
    "submit",
    () => {
      entry.failures = writeQueueStatus().failureCount;
    },
    { ...options, capture: true },
  );
  root.addEventListener(
    "click",
    (event) => {
      if (event.target.closest(".modal-cancel, .modal-close-btn, [data-draft-cancel]")) {
        entry.discard();
        entry.cancelled = true;
      } else if (policy.completeOn && event.target.closest(policy.completeOn)) {
        entry.failures = writeQueueStatus().failureCount;
      } else if (policy.read) {
        // Structural changes (add/remove/reorder) need no input event. Read after their handler.
        queueMicrotask(remember);
      }
    },
    { ...options, capture: true },
  );
  root.addEventListener(
    "cancel",
    () => {
      entry.cancelled = true;
      entry.discard();
    },
    options,
  );
  root.addEventListener(
    "close",
    () => {
      if (entry.completing && !entry.cancelled) void entry.complete();
      else safely(() => dismissDraftResume(key, workspace));
      abort.abort();
      if (opened.get(root.id) === entry) opened.delete(root.id);
    },
    options,
  );
}

/** Non-dialog forms explicitly report completion after their successful submit handler. */
export function finishTrainerFormDraft(id) {
  const entry = opened.get(id);
  if (entry) {
    entry.cancelled = false;
    entry.completing = true;
    void entry.complete();
  }
}

export function cancelTrainerFormDraft(id) {
  opened.get(id)?.discard();
}

export function hasTrainerFormDraft(kind, subject) {
  try {
    return Boolean(readTrainerDraft(JSON.stringify([kind, subject])));
  } catch {
    return false;
  }
}

/** A queued successful write has not yet cleared its durable draft. A transient re-render must not
 * reopen that editor in the gap, or it would replace the freshly committed display with an input. */
export function isCompletingTrainerFormDraft(id) {
  return opened.get(id)?.completing === true;
}

/** Called before changing workspaces, while the old workspace is still active. */
export function suspendTrainerFormDrafts() {
  for (const entry of opened.values()) {
    entry.abort.abort();
  }
  opened.clear();
}
