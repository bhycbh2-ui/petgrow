# PetInfo CMS API

Base: `/api/petinfo`

## Public
`GET ?action=list&page=1&pageSize=100&category=health&q=검색어`

Returns published, active PetInfo records. Public responses use a short CDN cache with stale-while-revalidate.

## Admin authentication
Admin actions require a valid PetGrow login session and `x-petgrow-admin-token`. Authorization is decided by the centralized `petinfo` capability; currently superadmin and operator roles are allowed.

## Admin actions
- `GET ?action=admin-list`
- `POST ?action=admin-save`
- `POST ?action=admin-toggle`
- `POST ?action=admin-delete`
- `POST ?action=admin-import`

Changes are written to `pg_pet_info` and relevant actions are recorded through the existing admin audit log.
