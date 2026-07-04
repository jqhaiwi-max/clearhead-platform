---
name: DB seeding approach
description: How to seed the database in this monorepo
---

The `scripts/` package does not have drizzle-orm or pg installed, so tsx-based seed scripts fail with MODULE_NOT_FOUND.

**How to apply:**
- Seed via `psql "$DATABASE_URL"` with a heredoc containing raw SQL INSERT statements
- Example: `psql "$DATABASE_URL" << 'ENDSQL' ... ENDSQL`
- This is the reliable, dependency-free seeding approach for this project

**Why:** The scripts package has no database driver dependencies; installing them would add unnecessary bloat. psql is available in the nix environment.
