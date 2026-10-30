# PPMS SECURITY AUDIT AND HARDENING REPORT

## 1. Authentication and Credential Protection

### Password Storage & Key Derivation

* **Algorithm:** Direct `bcrypt` with work factor (salt rounds) = 12.
* **Storage:** Passwords are never stored in plaintext. Only the derived `$2b$12$...` string is stored in `users.hashed_password`.
* **Zero API Hash Leakage:** `UserProfileResponse` explicitly omits `hashed_password`. Password hashes are never serialized into JSON responses.
* **Audit Logging Without Sensitive Data:** Audit events record security actions (`LOGIN`, `LOGOUT`, `ROLE_SWITCH`, `PASSWORD_CHANGE`) alongside client IP addresses, but never record passwords, raw tokens, or secret keys.

### JWT Token Architecture

* **Algorithm:** `HS256` signed using centralized `SECRET_KEY`.
* **Payload Claims:**
  - `sub`: User ID (integer string).
  - `roles`: List of assigned academic roles.
  - `active_role`: Currently selected active role.
  - `iat`: Timestamp of issue.
  - `exp`: Explicit expiration (defaults to 24 hours).
* **Token Validation:** Signature and expiration are validated on every protected endpoint by `decode_access_token`. Expired or tampered tokens return HTTP 401 Unauthorized.

---

## 2. Multi-Role Authorization & Access Control

Access control is enforced on every backend route via FastAPI dependency injection (`get_current_user_and_token` and custom checker functions). The frontend UI hides unauthorized actions, but the backend serves as the authoritative security boundary.

### Role Authorization Rules

| Role | Authorized Scope | Restricted Scope |
| --- | --- | --- |
| **HOD** | Department-wide oversight of all 25 projects, 13 sections, analytics, and CSV exports. | Cannot read private direct messages between other users. |
| **Advisor** | Access to all projects and students within assigned academic section (e.g. `Section 2A`). | Forbidden from accessing projects or students in other sections (HTTP 403). |
| **Mentor** | Access to supervised academic projects and submitted deliverables. | Forbidden from accessing unassigned projects' private records or discussions (HTTP 403). |
| **Student** | Access to their assigned team project, tasks, reports, documents, discussions, and certificates. | Forbidden from accessing other student teams' projects, reports, or discussions (HTTP 403). |

### Role Switching Security

* Users with multiple roles (e.g. `adv_3a` who is both an `ADVISOR` and `MENTOR`) switch roles via `POST /api/v1/auth/switch-role`.
* The backend verifies that `target_role` exists in the user's database records in `user_roles`. Users cannot escalate privileges by requesting unassigned roles.

---

## 3. Secure Password Change Workflow

Implemented via `POST /api/v1/auth/change-password`:

1. **Authentication Requirement:** Must supply valid JWT Bearer token.
2. **Current Password Verification:** Verifies current password against stored hash using `bcrypt.checkpw`.
3. **Password Policy Enforcement:**
   - Minimum 8 characters.
   - Confirmation password must match exactly.
   - New password cannot be identical to current password.
4. **Immediate Re-Hashing:** New password is hashed with 12 bcrypt salt rounds before saving.
5. **Audit Logging:** An audit entry is recorded with action `PASSWORD_CHANGE`.

---

## 4. Injection, Traversal, and Cross-Site Scripting Defenses

* **SQL Injection:** Zero raw SQL concatenation. All queries use SQLAlchemy ORM or parameterized `text()` queries.
* **Path Traversal:** File uploads strip directory traversal tokens (`..`, `/`, `\`). Stored files are renamed to UUIDs. File downloads verify that the target path resolves within the expected upload directory.
* **Cross-Site Scripting (XSS):** React automatically escapes all rendered text in JSX. User messages and project titles are rendered as text content, not raw HTML.
