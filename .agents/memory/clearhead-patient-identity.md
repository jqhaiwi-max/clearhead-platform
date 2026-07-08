---
name: Clearhead patient identity model
description: How unauthenticated patient appointment lookups are scoped, since patients don't have Supabase accounts.
---

Clearhead patients never log in — only admins authenticate via Supabase JWT. `GET /api/appointments` originally returned every appointment in the system to any caller, since the "My Sessions" page had no way to identify the current patient.

**Decision:** `GET /api/appointments` now branches on `isAdminRequest(req)` (in `requireAdmin.ts`):
- Valid admin bearer token → full unfiltered list (used by the admin dashboard).
- No/invalid token → requires `?email=` and `?phone=` query params, and returns only appointments matching `patientEmail` exactly plus `patientPhone` (or null, since phone is optional at booking time).

**Why:** Building a full patient auth/identity system was out of scope; email+phone lookup is the pragmatic middle ground between "leak everyone's data" and "require login for a booking flow that intentionally has none."

**How to apply:** The frontend persists `{email, phone}` to `localStorage` under `clearhead_patient_contact` right after a successful booking (`Checkout.tsx`), and `Appointments.tsx` reads it to auto-query; if absent it shows a lookup form asking the visitor to re-enter their booking email/phone. If a similar "let a guest look up their own record" need comes up elsewhere in this app (e.g. ratings, cancellations), follow the same email+phone-scoping pattern rather than inventing a new one.
