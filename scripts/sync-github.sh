#!/bin/bash
# Pushes the current commit to the GitHub mirror so it stays in sync with Replit.
#
# This runs automatically after every task merge (see the [postMerge] section in
# .replit, which points at scripts/post-merge.sh -> this script). It is intentionally
# best-effort: a sync failure should never block dependency install/migrations or
# fail the merge itself.
#
# Requires the GITHUB_PAT secret (repo + workflow scope). If it's missing, the sync
# is skipped rather than failing.
set -uo pipefail

GITHUB_REPO="${GITHUB_REPO:-jqhaiwi-max/clearhead-platform}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "[github-sync] GITHUB_PAT is not set - skipping GitHub sync."
  exit 0
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "[github-sync] Not a git repository - skipping GitHub sync."
  exit 0
fi

CURRENT_SHA="$(git rev-parse HEAD)"
REMOTE_URL="https://x-access-token:${GITHUB_PAT}@github.com/${GITHUB_REPO}.git"

echo "[github-sync] Pushing ${CURRENT_SHA} to https://github.com/${GITHUB_REPO} (${GITHUB_BRANCH})..."

if git push "$REMOTE_URL" "HEAD:refs/heads/${GITHUB_BRANCH}" 2>&1 | sed "s#x-access-token:[^@]*@#x-access-token:***@#g"; then
  echo "[github-sync] Synced to GitHub successfully."
else
  echo "[github-sync] Push failed - repo may have diverged or the PAT may lack permission. Manual push may be required."
  exit 1
fi
