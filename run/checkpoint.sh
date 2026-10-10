#!/bin/bash
# Copies this run folder to the branch trials/weeks-2026-10-10 on GitHub, so the run can be resumed
# from another machine if this one is reclaimed. Safe to run at any time; it commits only when
# something changed. Backups the app exported (runs/*/backups/) are copied too: they are the
# trainers' invented data, and a resumed runner restores from them.
set -euo pipefail
RUN="$(cd "$(dirname "$0")" && pwd)"
REPO="$(git -C "$RUN" rev-parse --show-toplevel)"
BRANCH=trials/weeks-2026-10-10
WT="${TMPDIR:-/tmp}/librept-trials-worktree"

if [ ! -d "$WT/.git" ] && [ ! -f "$WT/.git" ]; then
  if git -C "$REPO" ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
    git -C "$REPO" fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
    git -C "$REPO" worktree add -q -B "$BRANCH" "$WT" "origin/$BRANCH"
  else
    git -C "$REPO" worktree add -q --detach "$WT"
    git -C "$WT" checkout -q --orphan "$BRANCH"
    git -C "$WT" rm -rq --cached . >/dev/null 2>&1 || true
    find "$WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  fi
fi

# No rsync on the cloud image: replace the copy whole.
rm -rf "$WT/run"
cp -a "$RUN" "$WT/run"
cd "$WT"
git add -A run
if git diff --cached --quiet; then
  echo "checkpoint: nothing new"
  exit 0
fi
git commit -q -m "checkpoint $(date '+%F %T')"
git push -q -u origin "$BRANCH" 2>&1 | grep -v '^remote:' || true
echo "checkpoint: pushed $(git rev-parse --short HEAD) to $BRANCH"
