# PPMS DATABASE AND STORAGE ARCHITECTURE

## 1. Relational Database Overview

PPMS utilizes an embedded, single-file relational database powered by **SQLite** and managed through **SQLAlchemy 2.x**.

### Advantages of Embedded SQLite for Academic Operations

* **Zero Operational Cost:** No hosted database fees, no external connection latency, no network credentials to manage.
* **ACID Transactions:** Full support for transactional atomicity, consistency, isolation, and durability.
* **Instant Portability:** The complete database state resides in `backend/ppms.db` (approx. 1.1 MB for 13 sections, 25 projects, and 70 users).
* **High Concurrency for Academic Reads:** SQLite handles hundreds of concurrent read transactions via WAL (Write-Ahead Logging) mode and connection pools.

---

## 2. Relational Schema Catalog

The schema enforces strict referential integrity across 18 core tables:

| Table Name | Primary Key | Key Foreign Keys & Relationships | Purpose |
| --- | --- | --- | --- |
| `departments` | `id` | Relates to `users`, `sections` | Academic departments (e.g. CSE) |
| `academic_periods` | `id` | Relates to `sections` | Academic terms (e.g. 2026-2027) |
| `sections` | `id` | `department_id`, `academic_period_id` | Cohort sections (13 seeded CSE sections) |
| `roles` | `id` | Unique `name` (`HOD`, `ADVISOR`, `MENTOR`, `STUDENT`) | Role-based authorization catalog |
| `users` | `id` | `department_id`, `section_id` | Core identity and profile information |
| `user_roles` | `id` | `user_id`, `role_id` (Unique composite) | Multi-role assignment (e.g. ADVISOR + MENTOR) |
| `advisor_assignments` | `id` | `user_id`, `section_id` | Official advisor oversight scoping |
| `mentor_assignments` | `id` | `user_id`, `project_id` | Faculty mentor project supervision |
| `projects` | `id` | `section_id`, `mentor_id`, `created_by_id` | Academic capstone & mini projects (25 seeded) |
| `project_members` | `id` | `project_id`, `user_id` (Unique composite) | Student team membership |
| `tasks` | `id` | `project_id`, `assignee_id`, `milestone_id` | Weighted deliverables (effort weights 1-100) |
| `milestones` | `id` | `project_id` | Key stage gates and target deadlines |
| `progress_reports` | `id` | `project_id`, `submitted_by_id` | Periodic written submissions (weekly/bi-weekly) |
| `report_reviews` | `id` | `report_id`, `reviewer_id` | Formal faculty evaluation and feedback |
| `documents` | `id` | `project_id`, `uploaded_by_id` | Document metadata and storage paths |
| `conversations` | `id` | `project_id` (Optional) | Project discussion threads or direct chats |
| `conversation_participants` | `id` | `conversation_id`, `user_id` | Participant membership & last read markers |
| `messages` | `id` | `conversation_id`, `sender_id` | Message text content, timestamps, read status |
| `notifications` | `id` | `recipient_id` | In-app notification queue |
| `audit_events` | `id` | `user_id` | Security audit trail (logins, role switches, password changes) |

---

## 3. Document and Local Storage System

### Directory Hierarchy

```text
backend/
├── ppms.db                         # Authoritative SQLite database
├── backups/                        # Offline timestamped backups (.db & .sha256)
└── uploads/
    └── documents/                  # Physical file store (UUID-named files)
```

### Storage Security Controls

1. **UUID-Based Filenames:** Uploaded files are stored with cryptographically random UUID names on disk (e.g., `a7c390fa4d1b4c9e802319ef6d78213b.pdf`). The original human-readable filename is stored safely in the database metadata table.
2. **Path Traversal Protection:** Input filenames are cleaned to strip `../`, `..\\`, and path separator sequences before processing.
3. **15 MB Quota Limit:** Uploads are streamed in 64 KB chunks. If total bytes exceed 15,728,640 (15 MB), the stream is immediately aborted, disk remnants are removed, and HTTP 400 is returned.
4. **Extension and MIME Validation:** Only authorized academic file formats are permitted:
   - Documents: `.pdf`, `.docx`, `.doc`, `.txt`, `.pptx`, `.xlsx`, `.zip`
   - Images: `.png`, `.jpg`, `.jpeg`
5. **Direct Download vs. Inline Preview:**
   - `GET /api/v1/documents/{id}/download` triggers browser download with `Content-Disposition: attachment`.
   - `GET /api/v1/documents/{id}/preview` renders the document inline with `Content-Disposition: inline`.
   - Both endpoints enforce strict role-based access checks (`check_document_access`).

---

## 4. Maintenance and Orphaned File Cleanup

If a document upload transaction is interrupted or an unlinked file is left in storage, the cleanup utility safely compares disk files against database records:

### Dry Run (Report Only)

```powershell
python scripts/cleanup_orphans.py
```

### Active Cleanup (Reclaim Disk Space)

```powershell
python scripts/cleanup_orphans.py --clean
```
