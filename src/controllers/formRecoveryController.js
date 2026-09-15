// Connect the audited form inventory to real modal/view lifecycles. Observing open state also
// covers native dialog.showModal callers and route-owned dialogs without replacing the router.
import { trainerDraftToResume } from "../data/trainerDrafts.js";
import { activeWorkspace } from "../data/workspace.js";
import {
  openTrainerFormDraft,
  suspendTrainerFormDrafts,
} from "../modules/common/trainerFormDraft.js";
import { formRecoveryPolicies } from "./formRecoveryPolicies.js";

let deps;
let policies = [];
let suspended = false;
const mounted = new Map();

function visible(root) {
  if (!root?.isConnected) return false;
  const dialog = root.closest("dialog");
  if (dialog) return dialog.open;
  if (root.id === "splash-trainer-details")
    return !document.getElementById("app-splash")?.hidden && root.getClientRects().length > 0;
  return root.closest(".app-view")?.classList.contains("active") === true;
}

function scan() {
  if (suspended) return;
  for (const policy of policies) {
    const root = document.getElementById(policy.root);
    if (!visible(root)) {
      mounted.delete(policy.id);
      continue;
    }
    const signature = JSON.stringify([activeWorkspace(), policy.subject?.() || "new"]);
    const prior = mounted.get(policy.id);
    if (prior?.root === root && prior.signature === signature) continue;
    mounted.set(policy.id, { root, signature });
    for (const selector of policy.exclude || []) {
      for (const field of root.querySelectorAll(selector)) field.dataset.draft = "never";
    }
    for (const field of root.querySelectorAll(policy.cancel || "[data-draft-cancel]"))
      field.dataset.draftCancel = "";
    openTrainerFormDraft(root, policy, deps.t);
  }
}

export function initFormRecovery(injected) {
  deps = injected;
  policies = formRecoveryPolicies(deps);
  const observer = new MutationObserver(scan);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open", "class"],
  });
  document.addEventListener("formdraftopen", (event) => {
    const policy = policies.find((item) => item.root === event.detail);
    if (policy) mounted.delete(policy.id);
    queueMicrotask(scan);
  });
  scan();
}

export function suspendFormRecovery() {
  suspended = true;
  suspendTrainerFormDrafts();
  mounted.clear();
}

export function resumeFormRecovery(requestedPath = location.pathname) {
  suspended = false;
  scan();
  let draft;
  try {
    draft = trainerDraftToResume();
  } catch {
    return;
  }
  if (!draft) return;
  const base = new URL(document.baseURI).pathname;
  if (![base, `${base}index.html`, draft.route].includes(requestedPath)) return;
  const policy = policies.find((item) => item.id === draft.kind);
  if (!policy || typeof draft.route !== "string" || !draft.route.startsWith(base)) return;
  deps.navigateToPath(draft.route.slice(base.length - 1));
  policy.reopen(draft.context || {});
  scan();
}
