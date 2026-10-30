# PPMS Database & Document Storage Backup & Restoration Procedure

## 1. Disaster Recovery Overview

The Project Progress Monitoring System (PPMS) provides automated, zero-cost disaster recovery procedures using standard Python libraries and SQLite's transactional Online Backup API.

The recovery architecture addresses both critical components of the system:

1. **Relational Database (`ppms.db`)**: Stores all users, academic sections, projects, tasks, milestones, reports, reviews, messages, audit events, and notifications.
2. **Document Storage (`./uploads`)**: Stores physical student submissions, report attachments, synopsis files, and project documents.

### Key Operational Guarantees

* **Zero Downtime Online Backup**: Uses SQLite's C-level Online Backup API (`source_conn.backup(dest_conn)`) to safely snapshot live databases without locking readers or stopping the backend.
* **Cryptographic Integrity Validation**: Every backup generates a SHA-256 companion file (`.sha256`) that is cryptographically validated before restoration.
* **PRAGMA Integrity Check**: Verifies that pages, b-trees, and indexes are healthy via `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
* **Automated Pre-Restore Safety Copy**: Restoration creates `ppms_pre_restore_safety_<timestamp>.db` before overwriting the active database.
* **Synchronized Storage Archives**: Creates timestamped zip archives of the physical `./uploads` directory with companion checksums.
* **Storage-to-Database Synchronization**: Includes an automated orphan file detector (`scripts/cleanup_orphans.py`) to prevent orphaned disk bloat.

---

## 2. Quick Command Reference

All commands are executed from the `backend/` directory:

```powershell
cd "c:\Users\selva\OneDrive\Desktop\EE PPMS\backend"

# 1. Full System Backup (Database + Uploaded Documents)
.\.venv\Scripts\python scripts/db_backup_restore.py backup-all

# 2. Database-Only Backup
.\.venv\Scripts\python scripts/db_backup_restore.py backup

# 3. Document-Storage-Only Backup
.\.venv\Scripts\python scripts/db_backup_restore.py backup-uploads

# 4. List All Available Backups and Status
.\.venv\Scripts\python scripts/db_backup_restore.py list

# 5. Restore Database from a Specific Backup File
.\.venv\Scripts\python scripts/db_backup_restore.py restore backups/ppms_backup_<timestamp>.db

# 6. Restore Document Storage from a Specific Archive
.\.venv\Scripts\python scripts/db_backup_restore.py restore-uploads backups/ppms_uploads_<timestamp>.zip

# 7. Audit and Verify Active Database Integrity
.\.venv\Scripts\python scripts/db_backup_restore.py verify

# 8. Check for Orphaned Files in Document Storage (Dry-Run)
.\.venv\Scripts\python scripts/cleanup_orphans.py
```

---

## 3. Step-by-Step Backup Procedures

### 3.1 Creating a Full System Backup

To create an atomic, timestamped snapshot of both the database and uploaded documents:

```powershell
.\.venv\Scripts\python scripts/db_backup_restore.py backup-all
```

#### Verified Terminal Output for Full Backup

```text
[*] Initiating transactional SQLite online backup from: C:\Users\...\backend\ppms.db
[SUCCESS] Backup successfully created:
  File: C:\Users\...\backend\backups\ppms_backup_20261025_093358.db
  Size: 1276.00 KB
  SHA-256: 00f5f9f7ec42bd912de89507fd1e37a0e13640a3ad279769097f0b5b4ac55b63
  Verified Records: 13 Sections | 25 Projects | 70 Users
[*] Creating archive of uploads directory from: C:\Users\...\backend\uploads
[SUCCESS] Uploads archive created: ppms_uploads_20261025_093358.zip (1.20 MB, SHA-256: 5c7443bb0157b3a1515f1805a2aa5fc37cb38c5ce0e914d4a17eb148de0daf16)
```

### 3.2 Inspecting Existing Backups

To view the history, sizes, integrity, and timestamps of all stored snapshots:

```powershell
.\.venv\Scripts\python scripts/db_backup_restore.py list
```

#### Verified Terminal Output for Backups List

```text
Available PPMS Database Backups (2 found in C:\Users\...\backend\backups):
Filename                            Size (KB)    Integrity    Created
---------------------------------------------------------------------------
ppms_backup_20261025_093358.db      1276.00      VALID [OK]   2026-10-25 15:03:58
ppms_backup_20261025_084508.db      1100.00      VALID [OK]   2026-10-25 14:15:08
```

---

## 4. Step-by-Step Restoration Procedures

### 4.1 Restoring the SQLite Database

To restore from a backup:

```powershell
.\.venv\Scripts\python scripts/db_backup_restore.py restore backups/ppms_backup_20261025_093358.db
```

#### Database Restoration Lifecycle

1. **Cryptographic Validation**: Reads companion `.sha256` and computes actual file hash. If a checksum mismatch occurs, restoration aborts immediately.
2. **Integrity Validation**: Runs SQLite `PRAGMA integrity_check` on the backup file before restoring.
3. **Safety Snapshot**: Automatically copies the active `ppms.db` to `ppms_pre_restore_safety_<timestamp>.db` to ensure zero accidental data loss.
4. **Online Stream Restoration**: Restores data pages safely into `ppms.db`.
5. **Post-Restore Integrity Audit**: Executes `PRAGMA integrity_check` on the target database and verifies records count.

### 4.2 Restoring Document Storage

To restore document files from an archive:

```powershell
.\.venv\Scripts\python scripts/db_backup_restore.py restore-uploads backups/ppms_uploads_20261025_093358.zip
```

#### Storage Restoration Lifecycle

1. Verifies SHA-256 checksum of the archive.
2. Extracts physical documents into `./uploads`.
3. Verifies file presence.

---

## 5. Storage Integrity & Orphan Cleanup

To ensure that the filesystem and database metadata remain synchronized, the orphan cleanup tool inspects the document storage:

```powershell
# Dry run (default — no files deleted):
.\.venv\Scripts\python scripts/cleanup_orphans.py

# Permanent cleanup (only executed with explicit --clean flag):
.\.venv\Scripts\python scripts/cleanup_orphans.py --clean
```

---

## 6. Active Database Health Verification

To verify that the active database is healthy and retains all 13 sections and 25 seeded projects:

```powershell
.\.venv\Scripts\python scripts/db_backup_restore.py verify
```

### Active Database Verified Output

```text
[*] Running diagnostic audit on active database: C:\Users\...\backend\ppms.db
[OK] Database integrity verified: PRAGMA integrity_check passed.
     Database file size: 1276.00 KB
     Academic Sections : 13 (Expected: 13)
     Seeded Projects   : 25 (Expected: 25)
     Registered Users  : 70
     Tasks             : 139
     Milestones        : 100
     Progress Reports  : 46
     Documents         : 0
     Messages          : 79
     Notifications     : 1869
```
