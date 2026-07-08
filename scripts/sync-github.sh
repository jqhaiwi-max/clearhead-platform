#!/bin/bash
# Pushes the current commit to the GitHub mirror so it stays in sync with Replit.
#
# This runs automatically after every task merge (see the [postMerge] section in
# .replit, which points at scripts/post-merge.sh -> this script). It is intentionally
# best-effort: a sync failure should never block dependency install/migrations or
# fail the merge itself.
#
# Token resolution: each candidate is validated against the GitHub API before use,
# so a stale/invalid one never silently blocks the sync.
#   1. GITHUB_PAT secret, if set and valid (a classic PAT with "repo" + "workflow"
#      scopes additionally lets this push changes to .github/workflows/*).
#   2. The Replit "GitHub" connection (already authorized in this project). Its
#      OAuth token is fetched fresh from Replit's connector API on every run, so
#      it never goes stale like a manually pasted token can.
#
# If neither is available/valid, the sync is skipped rather than failing.
set -uo pipefail

GITHUB_REPO="${GITHUB_REPO:-jqhaiwi-max/clearhead-platform}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "[github-sync] Not a git repository - skipping GitHub sync."
  exit 0
fi

token_is_valid() {
  local candidate="$1"
  [ -n "$candidate" ] || return 1
  local status
  status="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: token ${candidate}" https://api.github.com/user)"
  [ "$status" = "200" ]
}

resolve_token() {
  if token_is_valid "${GITHUB_PAT:-}"; then
    echo "$GITHUB_PAT"
    return 0
  fi
  if [ -n "${GITHUB_PAT:-}" ]; then
    echo "[github-sync] GITHUB_PAT is set but failed GitHub authentication - falling back to the GitHub connection." >&2
  fi

  local connector_token
  connector_token="$(node "$(dirname "$0")/fetch-github-connector-token.mjs" 2>/dev/null)"
  if token_is_valid "$connector_token"; then
    echo "$connector_token"
    return 0
  fi

  return 1
}

TOKEN="$(resolve_token)"

if [ -z "$TOKEN" ]; then
  echo "[github-sync] No valid GITHUB_PAT and no authorized GitHub connection found - skipping GitHub sync."
  exit 0
fi

CURRENT_SHA="$(git rev-parse HEAD)"
REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${GITHUB_REPO}.git"

echo "[github-sync] Pushing ${CURRENT_SHA} to https://github.com/${GITHUB_REPO} (${GITHUB_BRANCH})..."

if git push "$REMOTE_URL" "HEAD:refs/heads/${GITHUB_BRANCH}" 2>&1 | sed "s#x-access-token:[^@]*@#x-access-token:***@#g"; then
  echo "[github-sync] Synced to GitHub successfully."
else
  echo "[github-sync] Push failed - repo may have diverged or the token may lack permission. Manual push may be required."
  exit 1
fi
