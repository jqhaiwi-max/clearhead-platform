---
name: GitHub auto-sync via connector token
description: How to push Replit code to GitHub automatically without a manually pasted PAT, and the pitfalls that come up.
---

Replit's built-in "GitHub" connection (added via the integrations system) already carries an OAuth
token that can authenticate a plain `git push` over HTTPS — you don't need a manually pasted PAT for
this. Fetch it fresh at push time (tokens expire) via the connector API rather than caching it:

```
GET https://${REPLIT_CONNECTORS_HOSTNAME}/api/v2/connection?include_secrets=true&connector_names=github
Header: X_REPLIT_TOKEN: repl ${REPL_IDENTITY}   (use "depl ${WEB_REPL_RENEWAL}" in deployed/prod contexts)
```
Response: `items[0].settings.access_token`. Use as `https://x-access-token:${token}@github.com/OWNER/REPO.git`.

**Why:** A manually-pasted `GITHUB_PAT` secret is easy to get wrong (copy/paste errors, silent
revocation) and returns a generic 401 with no useful diagnostic short of testing against
`https://api.github.com/user`. The connector token is auto-refreshed by Replit and doesn't go stale.

**How to apply:** When wiring any "push Replit changes to GitHub automatically" feature (e.g. a
`postMerge` script), validate any user-supplied `GITHUB_PAT` against `GET /user` before trusting it,
and always keep the connector token as a fallback. Also note the connector's default OAuth scope is
`repo` (+ read:org/read:user/etc) but **not** `workflow` — pushes touching `.github/workflows/*` will
be rejected unless a classic PAT with the `workflow` scope is supplied.

**Divergence gotcha:** if GitHub's `main` has commits Replit's local history doesn't (e.g. from a
previous manual push or unrelated fix applied directly on GitHub), a normal `git push` is rejected
(non-fast-forward). Don't auto-force-push — that silently destroys the GitHub-only commits. Confirm
with the user before doing a one-time reconciliation force-push, then let future pushes fast-forward
normally.
