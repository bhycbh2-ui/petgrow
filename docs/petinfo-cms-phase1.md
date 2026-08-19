# PetInfo CMS Phase 1

## Goal
Move PetGrow PetInfo toward a database-backed CMS without breaking the current hardcoded PetInfo experience.

## Included
- `pg_pet_info` Postgres schema created lazily by `/api/petinfo`
- public PetInfo list API with category/search/pagination and short CDN cache
- administrator CRUD, visibility toggle, scheduled publishing, and bulk import
- centralized `petinfo` role capability for superadmin/operator
- admin audit logging for PetInfo changes
- PetInfo CMS modal in the existing admin center
- Node built-in permission tests
- GitHub Actions quality gate running tests and production build

## Safety strategy
The current user-facing hardcoded `TIPS_DATA` remains untouched in Phase 1. This prevents a blank PetInfo page before existing content is migrated to `pg_pet_info`.

## Phase 2 cutover
1. Seed/verify all current PetInfo records in `pg_pet_info`.
2. Change `TipsPage` to load `/api/petinfo?action=list` first.
3. Keep `TIPS_DATA` as an emergency fallback when the API is unavailable or the CMS table is empty.
4. Verify Korean/English search, category filters, bookmarks, daily featured rotation, mobile pagination, and admin hide/delete behavior.
5. After a stable period, remove the legacy spreadsheet path and eventually move hardcoded content out of `App.jsx`.
