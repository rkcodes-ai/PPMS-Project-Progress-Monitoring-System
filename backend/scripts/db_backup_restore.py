#!/usr/bin/env python3
"""
Zero-Cost SQLite Database Backup and Restoration Utility for PPMS.
Provides transactional online backups, SHA-256 checksum verification,
pre-restore safety snapshots, and SQLite PRAGMA integrity verification.
"""

import os
import sys
import shutil
import sqlite3
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Resolve base directories
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_DB_PATH = BACKEND_DIR / "ppms.db"
DEFAULT_BACKUP_DIR = BACKEND_DIR / "backups"

def compute_sha256(filepath: Path) -> str:
    """Computes SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def verify_sqlite_integrity(db_path: Path) -> bool:
    """Runs PRAGMA integrity_check and foreign_key_check on an SQLite database."""
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        res = cursor.fetchone()
        if not res or res[0] != "ok":
            print(f"[ERROR] Integrity check failed: {res}")
            return False
        
        cursor.execute("PRAGMA foreign_key_check;")
        fk_errors = cursor.fetchall()
        if fk_errors:
            print(f"[WARNING] Foreign key check reported {len(fk_errors)} issues.")
            return False

        return True
    finally:
        conn.close()

def get_db_metrics(db_path: Path) -> dict:
    """Extracts record counts for key tables."""
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        counts = {}
        for table in ["sections", "projects", "users", "tasks", "milestones", "progress_reports", "documents", "messages", "notifications"]:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table};")
                counts[table] = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                counts[table] = 0
        return counts
    finally:
        conn.close()

def backup_database(db_path: Path, backup_dir: Path) -> Path:
    """Performs an online, zero-downtime backup of the SQLite database."""
    if not db_path.exists():
        raise FileNotFoundError(f"Database file not found: {db_path}")

    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"ppms_backup_{timestamp}.db"
    sha_file = backup_dir / f"ppms_backup_{timestamp}.sha256"

    print(f"[*] Initiating transactional SQLite online backup from: {db_path}")
    source_conn = sqlite3.connect(str(db_path))
    dest_conn = sqlite3.connect(str(backup_file))

    try:
        # SQLite Online Backup API ensures consistent copy without locking out readers
        source_conn.backup(dest_conn, pages=100)
    finally:
        dest_conn.close()
        source_conn.close()

    # Verify backup integrity
    if not verify_sqlite_integrity(backup_file):
        backup_file.unlink(missing_ok=True)
        raise RuntimeError("Generated backup failed PRAGMA integrity check!")

    # Calculate SHA-256
    sha256_hash = compute_sha256(backup_file)
    with open(sha_file, "w") as f:
        f.write(f"{sha256_hash}  {backup_file.name}\n")

    size_kb = backup_file.stat().st_size / 1024
    print(f"[SUCCESS] Backup successfully created:")
    print(f"  File: {backup_file}")
    print(f"  Size: {size_kb:.2f} KB")
    print(f"  SHA-256: {sha256_hash}")

    metrics = get_db_metrics(backup_file)
    print(f"  Verified Records: {metrics['sections']} Sections | {metrics['projects']} Projects | {metrics['users']} Users")
    return backup_file

def restore_database(backup_file: Path, target_db_path: Path):
    """Safely restores a backup with pre-restore safety snapshot and SHA validation."""
    if not backup_file.exists():
        raise FileNotFoundError(f"Backup file not found: {backup_file}")

    # Check SHA-256 if .sha256 file exists
    sha_file = backup_file.with_suffix(".sha256")
    if sha_file.exists():
        expected_sha = sha_file.read_text().split()[0].strip()
        actual_sha = compute_sha256(backup_file)
        if expected_sha != actual_sha:
            raise ValueError(f"Checksum mismatch! Expected: {expected_sha}, Got: {actual_sha}")
        print(f"[+] SHA-256 verification passed: {actual_sha}")

    # Verify backup integrity before restoration
    if not verify_sqlite_integrity(backup_file):
        raise ValueError("Backup file failed SQLite integrity check. Restoration aborted.")

    # Create safety pre-restore snapshot of existing target DB
    if target_db_path.exists():
        safety_timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safety_file = target_db_path.parent / f"ppms_pre_restore_safety_{safety_timestamp}.db"
        print(f"[*] Creating safety snapshot of active database: {safety_file.name}")
        shutil.copy2(target_db_path, safety_file)

    print(f"[*] Restoring database from {backup_file.name} to {target_db_path}...")
    source_conn = sqlite3.connect(str(backup_file))
    dest_conn = sqlite3.connect(str(target_db_path))
    try:
        source_conn.backup(dest_conn, pages=100)
    finally:
        dest_conn.close()
        source_conn.close()

    # Final check on target
    if not verify_sqlite_integrity(target_db_path):
        raise RuntimeError("Restored database failed integrity check!")

    metrics = get_db_metrics(target_db_path)
    print(f"[SUCCESS] Database restored successfully!")
    print(f"  Active Records: {metrics['sections']} Sections | {metrics['projects']} Projects | {metrics['users']} Users")

def list_backups(backup_dir: Path):
    """Lists all available backups with timestamps, sizes, and integrity status."""
    if not backup_dir.exists():
        print(f"No backup directory found at: {backup_dir}")
        return

    backups = sorted(backup_dir.glob("ppms_backup_*.db"), reverse=True)
    if not backups:
        print(f"No database backups found in {backup_dir}")
        return

    print(f"\nAvailable PPMS Database Backups ({len(backups)} found in {backup_dir}):")
    print(f"{'Filename':<35} {'Size (KB)':<12} {'Integrity':<12} {'Created'}")
    print("-" * 75)

    for b in backups:
        size_kb = b.stat().st_size / 1024
        mtime = datetime.fromtimestamp(b.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        is_ok = verify_sqlite_integrity(b)
        status_str = "VALID [OK]" if is_ok else "CORRUPTED"
        print(f"{b.name:<35} {size_kb:<12.2f} {status_str:<12} {mtime}")

def verify_active_database(db_path: Path):
    """Runs a complete diagnostic check on the active database."""
    print(f"[*] Running diagnostic audit on active database: {db_path}")
    if not db_path.exists():
        print(f"[ERROR] Database file does not exist: {db_path}")
        sys.exit(1)

    is_ok = verify_sqlite_integrity(db_path)
    if not is_ok:
        print("[ERROR] Database integrity audit failed!")
        sys.exit(1)

    metrics = get_db_metrics(db_path)
    size_kb = db_path.stat().st_size / 1024
    print(f"[OK] Database integrity verified: PRAGMA integrity_check passed.")
    print(f"     Database file size: {size_kb:.2f} KB")
    print(f"     Academic Sections : {metrics['sections']} (Expected: 13)")
    print(f"     Seeded Projects   : {metrics['projects']} (Expected: >= 325)")
    print(f"     Registered Users  : {metrics['users']}")
    print(f"     Tasks             : {metrics['tasks']}")
    print(f"     Milestones        : {metrics['milestones']}")
    print(f"     Progress Reports  : {metrics['progress_reports']}")
    print(f"     Documents         : {metrics['documents']}")
    print(f"     Messages          : {metrics['messages']}")
    print(f"     Notifications     : {metrics['notifications']}")

DEFAULT_UPLOADS_DIR = BACKEND_DIR / "uploads"

def backup_uploads(uploads_dir: Path, backup_dir: Path) -> Path:
    """Creates a compressed, timestamped archive of uploaded documents with SHA-256."""
    uploads_dir.mkdir(parents=True, exist_ok=True)
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    archive_base = backup_dir / f"ppms_uploads_{timestamp}"
    
    print(f"[*] Creating archive of uploads directory from: {uploads_dir}")
    archive_path_str = shutil.make_archive(str(archive_base), "zip", root_dir=str(uploads_dir))
    archive_path = Path(archive_path_str)
    
    sha256_hash = compute_sha256(archive_path)
    sha_file = archive_path.with_name(f"{archive_path.name}.sha256")
    with open(sha_file, "w") as f:
        f.write(f"{sha256_hash}  {archive_path.name}\n")
        
    size_kb = archive_path.stat().st_size / 1024
    print(f"[SUCCESS] Uploads archive created: {archive_path.name} ({size_kb:.2f} KB, SHA-256: {sha256_hash})")
    return archive_path

def restore_uploads(backup_zip: Path, target_uploads_dir: Path):
    """Safely extracts uploaded documents archive with checksum validation."""
    if not backup_zip.exists():
        raise FileNotFoundError(f"Uploads archive not found: {backup_zip}")
        
    sha_file = backup_zip.with_name(f"{backup_zip.name}.sha256")
    if sha_file.exists():
        expected_sha = sha_file.read_text().split()[0].strip()
        actual_sha = compute_sha256(backup_zip)
        if expected_sha != actual_sha:
            raise ValueError(f"Checksum mismatch on uploads archive! Expected: {expected_sha}, Got: {actual_sha}")
        print(f"[+] SHA-256 verification passed: {actual_sha}")
        
    target_uploads_dir.mkdir(parents=True, exist_ok=True)
    print(f"[*] Extracting uploads archive {backup_zip.name} to {target_uploads_dir}...")
    shutil.unpack_archive(str(backup_zip), str(target_uploads_dir), "zip")
    print(f"[SUCCESS] Uploads directory restored successfully.")

def main():
    parser = argparse.ArgumentParser(description="PPMS Zero-Cost Database Backup & Restore Utility")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Backup command
    subparsers.add_parser("backup", help="Create a timestamped online backup of the active database")

    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore active database from a specified backup file")
    restore_parser.add_argument("backup_file", type=str, help="Path to the backup .db file")

    # Backup uploads
    subparsers.add_parser("backup-uploads", help="Create a timestamped zip archive of the uploads directory")

    # Restore uploads
    restore_up_parser = subparsers.add_parser("restore-uploads", help="Restore uploads directory from a zip archive")
    restore_up_parser.add_argument("archive_file", type=str, help="Path to the backup zip archive")

    # Full backup (database + uploads)
    subparsers.add_parser("backup-all", help="Create both database backup and uploads archive")

    # List command
    subparsers.add_parser("list", help="List all available backups in the backup directory")

    # Verify command
    subparsers.add_parser("verify", help="Audit integrity and records of the active database")

    args = parser.parse_args()

    if args.command == "backup":
        backup_database(DEFAULT_DB_PATH, DEFAULT_BACKUP_DIR)
    elif args.command == "restore":
        restore_database(Path(args.backup_file), DEFAULT_DB_PATH)
    elif args.command == "backup-uploads":
        backup_uploads(DEFAULT_UPLOADS_DIR, DEFAULT_BACKUP_DIR)
    elif args.command == "restore-uploads":
        restore_uploads(Path(args.archive_file), DEFAULT_UPLOADS_DIR)
    elif args.command == "backup-all":
        backup_database(DEFAULT_DB_PATH, DEFAULT_BACKUP_DIR)
        backup_uploads(DEFAULT_UPLOADS_DIR, DEFAULT_BACKUP_DIR)
    elif args.command == "list":
        list_backups(DEFAULT_BACKUP_DIR)
    elif args.command == "verify":
        verify_active_database(DEFAULT_DB_PATH)

if __name__ == "__main__":
    main()
