# PetGrow Production Hardening Roadmap

## Target
Raise PetGrow from a working full-stack service to a production-grade service with measurable gates for backend, database, admin/CMS, security, QA, monitoring, backup, and deployment.

## Phase 1 — PetInfo CMS
- Database-backed PetInfo model
- Admin CRUD, visibility, scheduled publishing, import
- Centralized role capability
- Audit logging
- Safe legacy fallback strategy
- Unit/contract quality gate

## Phase 2 — PetInfo cutover and migration
- Migrate existing hardcoded PetInfo to DB
- Load CMS data first in the user PetInfo screen
- Emergency fallback to hardcoded data
- Verify bookmarks, search, pagination, language, featured rotation

## Phase 3 — Admin center completion
- Member search/detail
- Pet profile visibility for support purposes with strict authorization
- Community moderation workflow
- Content management consolidation
- Admin activity history and export

## Phase 4 — Security hardening
- Persistent distributed rate limiting for admin PIN/auth endpoints
- Input schema validation for APIs
- CSRF/session/cookie review
- Security headers and upload validation audit
- Least-privilege role review

## Phase 5 — QA automation
- Unit tests for pure logic and permissions
- API integration tests against an isolated test database
- Playwright E2E for login/session, pet CRUD, PetTalk, PetInfo, music, withdrawal, and admin flows
- Responsive regression checks for key mobile widths

## Phase 6 — Database reliability
- Explicit migrations instead of relying only on lazy schema creation
- Key JSON state normalization where operationally valuable
- Index review based on real queries
- Backup/restore drill and retention policy

## Phase 7 — Observability and deployment
- Structured error logging and alerting
- API latency/error dashboards
- Staging vs production separation
- Required quality checks before production merge/deploy
- Rollback runbook and release checklist

## Definition of done
A category is not marked complete by appearance alone. Each category needs automated checks, an operational runbook where applicable, and a verified failure/recovery path.
