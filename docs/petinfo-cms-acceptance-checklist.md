# PetInfo CMS Acceptance Checklist

## Backend
- [ ] Public list returns only active, published items.
- [ ] Category and search filters work.
- [ ] Page/pageSize bounds are enforced.
- [ ] Invalid scheduled-publish dates return 400.
- [ ] Missing records return 404 on toggle/delete.

## Authorization
- [ ] Superadmin can manage PetInfo.
- [ ] Operator can manage PetInfo.
- [ ] Report/ads roles cannot manage PetInfo.
- [ ] Expired or missing admin token is denied.
- [ ] Admin changes create audit-log records.

## Admin CMS
- [ ] Create Korean-only content.
- [ ] Add/edit English content.
- [ ] Edit existing content.
- [ ] Hide/show content.
- [ ] Schedule future publication.
- [ ] Delete content with confirmation.
- [ ] Mobile admin layout remains usable.

## User cutover (Phase 2)
- [ ] Existing hardcoded PetInfo is migrated and counted.
- [ ] DB content is loaded first.
- [ ] Legacy content appears only as emergency fallback.
- [ ] Korean/English rendering works.
- [ ] Search and categories work.
- [ ] Bookmarks survive source migration by stable IDs.
- [ ] 20-item pagination works on web/mobile/app.
- [ ] Daily featured rotation works.

## Quality gate
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Draft PR checks are green before merge.
