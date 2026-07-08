#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Keep the GitHub mirror in sync with Replit. Best-effort: never fails the merge.
bash scripts/sync-github.sh || echo "[post-merge] GitHub sync did not complete; see log above."
