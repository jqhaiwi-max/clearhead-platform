---
name: API Server validation pattern
description: How to do request validation in the api-server package
---

The api-server does NOT have `zod` installed as a direct dependency.

**How to apply:**
- For new routes, use manual JS validation (`if (!field) return res.status(400)...`)
- Or import schemas from `@workspace/api-zod` which has zod internally
- Never `import { z } from "zod"` or `import { z } from "zod/v4"` directly in api-server routes

**Why:** esbuild will fail to bundle the route with "Could not resolve zod" since it's not in the package's node_modules.
