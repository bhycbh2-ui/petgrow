# PetInfo CMS Security Notes

- PetInfo administrative operations never trust a client-side admin flag.
- The server resolves the logged-in user from the existing session.
- The server resolves the administrator role from `pg_admins`.
- The centralized `roleCan(role, "petinfo")` capability gate is required.
- The short-lived admin token must be supplied in `x-petgrow-admin-token` and is verified server-side.
- Report-only and ads-only roles are denied PetInfo management.
- Invalid scheduled-publish input is rejected rather than becoming a server error.
- Admin list/CRUD responses are marked `no-store`.
- Public list responses contain active, already-published records only.
- Create/update/toggle/delete/import operations are written to the existing administrator audit trail.

Future security phase: move admin PIN attempt throttling from instance-local memory to a distributed/persistent limiter and perform a complete session/CSRF/header/input-validation review across all APIs.
