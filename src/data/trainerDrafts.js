// Local, workspace-scoped unsaved work. Never part of a backup or Drive's record graph.
// The format version belongs to drafts, not the deployed build. A sandbox reset clears its
// entire bucket through storageNamespace; another workspace's bucket is never touched.
import { readForWorkspace, writeForWorkspace } from "./storageNamespace.js";
import { activeWorkspace } from "./workspace.js";

export const TRAINER_DRAFT_KEY = "librept_form_drafts";

function readBucket(workspace) {
  const raw = readForWorkspace(TRAINER_DRAFT_KEY, workspace);
  if (!raw) return { version: 1, drafts: {}, resume: null };
  const bucket = JSON.parse(raw);
  if (bucket?.version !== 1 || !bucket.drafts || typeof bucket.drafts !== "object") {
    throw new Error("Unsupported form draft format");
  }
  return bucket;
}

export function readTrainerDraft(key, workspace = activeWorkspace()) {
  return readBucket(workspace).drafts[key] || null;
}

export function writeTrainerDraft(key, draft, workspace = activeWorkspace()) {
  const bucket = readBucket(workspace);
  bucket.drafts[key] = draft;
  if (draft.resume !== false) bucket.resume = key;
  writeForWorkspace(TRAINER_DRAFT_KEY, workspace, JSON.stringify(bucket));
}

export function forgetTrainerDraft(key, workspace = activeWorkspace()) {
  const bucket = readBucket(workspace);
  delete bucket.drafts[key];
  if (bucket.resume === key) bucket.resume = null;
  writeForWorkspace(TRAINER_DRAFT_KEY, workspace, JSON.stringify(bucket));
}

export function dismissDraftResume(key, workspace = activeWorkspace()) {
  const bucket = readBucket(workspace);
  if (bucket.resume !== key) return;
  bucket.resume = null;
  writeForWorkspace(TRAINER_DRAFT_KEY, workspace, JSON.stringify(bucket));
}

export function trainerDraftToResume(workspace = activeWorkspace()) {
  const bucket = readBucket(workspace);
  return bucket.drafts[bucket.resume] || null;
}

export function hasSessionFormDraft(sessionId, workspace = activeWorkspace()) {
  try {
    return Object.values(readBucket(workspace).drafts).some(
      (draft) => draft.context?.sessionId === sessionId,
    );
  } catch {
    return false;
  }
}

/** Erasure must reach unsaved copies too. Pending database and signup reviews can contain the
 * subject without a stable id, so either review is discarded as a whole. */
export function forgetClientDrafts(clientId, workspace = activeWorkspace()) {
  const bucket = readBucket(workspace);
  for (const [key, draft] of Object.entries(bucket.drafts)) {
    if (
      draft.context?.clientId !== clientId &&
      draft.kind !== "backup-review" &&
      draft.kind !== "signup-review"
    )
      continue;
    delete bucket.drafts[key];
    if (bucket.resume === key) bucket.resume = null;
  }
  writeForWorkspace(TRAINER_DRAFT_KEY, workspace, JSON.stringify(bucket));
}
