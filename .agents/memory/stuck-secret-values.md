---
name: Stuck secret values
description: A secret can keep serving a stale value even after the user re-enters it or it is deleted — verify before blaming the user's credential.
---

Observed once with `RESEND_API_KEY`: user pasted a fresh Resend key (`re_...`) three times via the secure `requestEnvVar` form, restarting workflows each time, yet the running processes and even the raw shell (`bash -c 'echo $RESEND_API_KEY'`) kept returning an unrelated `ghp_...` (GitHub token) value. `deleteEnvVars` followed by `viewEnvVars` still reported the secret as present/true. Only manually deleting it from the Replit Secrets UI (lock icon in sidebar) actually cleared it (`viewEnvVars` then showed `false`), after which a fresh `requestEnvVar` took effect correctly.

**Why:** Repeatedly asking the user to "paste it again" when the real fault is a stuck platform-side value wastes their time and looks like the user is doing something wrong. `viewEnvVars` only reports existence (true/false), not the value, so verifying the actual injected value requires reading it from a running process/shell (e.g. `bash -c 'echo ${KEY:0:4}'`) — don't just trust `viewEnvVars` returning `true`.

**How to apply:** If a freshly-provided secret produces an error that looks like "wrong/invalid credential" (e.g. 401 "API key is invalid") even after re-entry and workflow restarts, check the actual runtime value's prefix/length via shell before asking the user to regenerate the key again. If the value clearly doesn't match the format the user described pasting, it's a stuck secret — have the user delete it manually from the Secrets UI, confirm via `viewEnvVars` it now reads `false`, then re-request it.
