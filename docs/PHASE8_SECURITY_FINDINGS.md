# PPMS Phase 8 — Comprehensive Security Audit & Findings Report

## 1. Executive Summary

As part of Phase 8 Production-Readiness and Hardening, a comprehensive, evidence-based security audit was conducted across the Project Progress Monitoring System (PPMS). The audit covered the entire authentication lifecycle, role-based authorization scopes, database relational integrity, filesystem and document safety, and API configuration hardening.

All identified vulnerabilities and configuration gaps were systematically remediated, validated with automated regression tests, and verified in real browser integration suites.

---

## 2. Security Findings Matrix & Remediation Summary

| ID | Finding Title | Severity | Impact | Status | Remediation Summary |
| --- | --- | --- | --- | --- | --- |
| **SEC-01** | Token Persistence After Password Change | **HIGH** | Stolen or existing JWTs remained valid after password reset | **RESOLVED** | Introduced `token_version` on `User` model; incremented on password change; previous tokens rejected with 401 |
| **SEC-02** | SQLite Foreign-Key Enforcement Disabled by Default | **MEDIUM** | Relational integrity constraints could be bypassed at runtime | **RESOLVED** | Added `PRAGMA foreign_keys = ON` connection listener to SQLAlchemy engine |
| **SEC-03** | Internal Filesystem Path Exposure in System Status | **LOW** | System status endpoint exposed server's internal directory path | **RESOLVED** | Replaced `upload_dir` filesystem path with boolean `configured: True` flag |
| **SEC-04** | Overly Permissive CORS (`*`) in Production | **MEDIUM** | Allowed arbitrary web origins to send authenticated requests | **RESOLVED** | Implemented environment-aware CORS: strict origin whitelisting in production mode |
| **SEC-05** | Production Startup Without Strong Secret Validation | **MEDIUM** | Production deployment could run with default placeholder secret | **RESOLVED** | Added startup check in `main.py` that fails if `SECRET_KEY` is a default placeholder or < 32 chars |
| **SEC-06** | Interactive API Docs Exposed in Production | **LOW** | Exposed OpenAPI schema and Swagger UI to unauthenticated users | **RESOLVED** | Configured `docs_url=None` and `openapi_url=None` when `APP_ENV=production` |
| **SEC-07** | Monolithic Frontend Bundle Triggering Size Warnings | **LOW** | Single 910 kB bundle created slow initial load times | **RESOLVED** | Implemented Rollup `manualChunks` in `vite.config.ts`, splitting into 4 cached chunks < 350 kB |

---

## 3. Deep-Dive Audit Analysis

### 3.1 Authentication & Session Security

1. **Password Hashing & Salting**:
   * Passwords are encrypted using `bcrypt.gensalt(rounds=12)`.
   * Plaintext passwords are never stored in the database.
   * API responses never return password hashes or salt strings (`UserProfileResponse` strictly excludes credentials).
   * Password verification uses constant-time bcrypt string comparison (`verify_password`).

2. **Session Invalidation on Password Change (Remediated SEC-01)**:
   * **Previous Behavior**: JWTs were stateless and valid until expiration (`exp`), even if the user changed credentials.
   * **Hardened Behavior**: The `User` model now tracks `token_version: int`. Every token encodes the current `token_version`. When a user updates their password via `POST /api/v1/auth/change-password`, `token_version` increments by 1.
   * **Verification**: Immediate subsequent calls using the old token fail with `HTTP 401 Unauthorized ("Could not validate credentials or session expired")`. The user receives a fresh token in the response to maintain active continuity on the current device.

3. **Client-Side Identity Protection**:
   * Sender identity in discussion messages and document uploads is derived directly from the decoded, cryptographically signed token (`user.id`).
   * Clients cannot spoof or impersonate another user ID via request bodies.

---

### 3.2 Role-Based Access Control (RBAC) & Negative Authorization

Strict authorization boundaries are enforced by `app/api/deps.py`:

* **HOD**: Permitted to view department-wide academic data and all 25 CSE projects. Blocked from private direct messages unless explicitly enrolled.
* **Advisor**: Permitted to access only the sections assigned to them via `AdvisorAssignment`.
  * *Negative Test*: Advisor 2A (assigned to Section 2A) attempting to query Project 3 (Section 2B) returns `403 Forbidden ("Access denied: You are not the assigned advisor for section 'CSE-B'")`.
* **Mentor**: Permitted to view and supervise only assigned projects.
  * *Negative Test*: Mentor attempting to view or review an unassigned project returns `403 Forbidden ("Access denied: You are not assigned to supervise this project")`.
* **Student**: Permitted to view only their assigned team project.
  * *Negative Test*: Student Lead 2 attempting to view Project 1 returns `403 Forbidden ("Access denied: You are not an authorized member of this project team")`.
  * *Negative Test*: Student attempting to delete a document uploaded by another user returns `403 Forbidden ("Students may only delete documents they uploaded")`.

---

### 3.3 Database Relational Integrity & SQLite Pragma (Remediated SEC-02)

* **Foreign Key Enforcement**: In Python's default SQLite driver, foreign key constraints are not enforced unless explicitly commanded on each connection.
* **Hardened Implementation**:

```python
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

* **Integrity Validation**:
  * `PRAGMA integrity_check` verified: `ok`.
  * `PRAGMA foreign_key_check` verified: `0 violations`.
  * Destructive foreign key insertion test confirmed `sqlalchemy.exc.IntegrityError` rejection.

---

### 3.4 Filesystem & Document Security

* **Path Traversal Defense**: All filenames undergo strict sanitization, stripping path traversal sequences (`..`, `/`, `\`).
* **Storage Obfuscation**: Documents are stored under randomized UUID filenames (`f"{uuid.uuid4().hex}{ext}"`) in `./uploads/documents`. Physical filesystem paths are never exposed to clients.
* **File Quota Enforcement**: Files exceeding `15 MB` (15,728,640 bytes) are rejected during stream consumption and immediately deleted from disk.
* **Whitelist Validation**: Restricted to safe academic file formats (`.pdf`, `.docx`, `.doc`, `.txt`, `.pptx`, `.xlsx`, `.zip`, `.png`, `.jpg`).
* **Orphan File Detection**: `scripts/cleanup_orphans.py` cross-references physical disk files with database metadata and defaults to dry-run mode to prevent accidental file deletion.

---

### 3.5 API & Environment Hardening (Remediated SEC-04, SEC-05, SEC-06)

* **Environment Modes**:
  * In `development`: Full developer convenience, interactive Swagger UI (`/api/v1/docs`), and open local CORS.
  * In `production`: Interactive documentation disabled (`docs_url=None`), CORS strictly restricted to whitelisted origins (`BACKEND_CORS_ORIGINS` + `FRONTEND_ORIGIN`), and startup fails immediately if a placeholder `SECRET_KEY` is detected.
* **Operational Diagnostics**:
  * `GET /api/v1/system/status` reports health, compliance, section count (13), and project count (25) without exposing passwords, secret keys, SMTP credentials, or server directory paths.

---

## 4. Verification Evidence

* **Automated Backend Security Tests**: 84 passed (`tests/test_phase8_audit.py` added 7 dedicated security and negative tests).
* **Automated Frontend Unit Tests**: 32 passed across 8 test suites.
* **Playwright E2E Integration Suite**: 7 passed across all 4 roles.
* **Production Build**: Zero TypeScript errors, 0 Rollup chunk warnings.
