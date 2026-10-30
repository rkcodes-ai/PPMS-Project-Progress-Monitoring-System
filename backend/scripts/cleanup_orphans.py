#!/usr/bin/env python3
"""
Orphaned File Cleanup Utility for PPMS Document Storage.
Compares physical files on the local filesystem with active database records,
identifying and safely cleaning orphaned or abandoned files without data loss.
"""

import os
import sys
import sqlite3
import argparse
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_DB_PATH = BACKEND_DIR / "ppms.db"
DEFAULT_UPLOADS_DIR = BACKEND_DIR / "uploads"

def find_orphaned_files(db_path: Path, uploads_dir: Path):
    """
    Finds physical files in uploads directory that have no matching record in the database.
    """
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")

    if not uploads_dir.exists():
        print(f"Uploads directory does not exist yet: {uploads_dir}")
        return []

    # 1. Fetch valid stored file paths from SQLite
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT file_path FROM documents;")
        rows = cursor.fetchall()
        # Normalize stored paths
        db_paths = set()
        for r in rows:
            if r[0]:
                db_paths.add(Path(r[0]).resolve())
    finally:
        conn.close()

    # 2. Walk uploads folder
    orphans = []
    for root, _, files in os.walk(uploads_dir):
        for f in files:
            if f in (".gitkeep", ".gitignore"):
                continue
            file_path = (Path(root) / f).resolve()
            if file_path not in db_paths:
                orphans.append(file_path)

    return orphans

def main():
    parser = argparse.ArgumentParser(description="PPMS Orphaned File Detector & Cleanup Utility")
    parser.add_argument("--clean", action="store_true", help="Permanently delete orphaned files")
    parser.add_argument("--db", type=str, default=str(DEFAULT_DB_PATH), help="Path to SQLite DB")
    parser.add_argument("--dir", type=str, default=str(DEFAULT_UPLOADS_DIR), help="Path to uploads directory")

    args = parser.parse_args()
    db_path = Path(args.db)
    uploads_dir = Path(args.dir)

    print(f"[*] Scanning for orphaned documents in: {uploads_dir}")
    print(f"[*] Cross-referencing against database: {db_path}")

    orphans = find_orphaned_files(db_path, uploads_dir)

    if not orphans:
        print("[OK] No orphaned files detected. File storage and database are completely synchronized.")
        return

    print(f"[!] Found {len(orphans)} orphaned file(s):")
    total_reclaimable_bytes = 0
    for o in orphans:
        size = o.stat().st_size
        total_reclaimable_bytes += size
        print(f"  - {o} ({size / 1024:.2f} KB)")

    print(f"\nTotal reclaimable disk space: {total_reclaimable_bytes / 1024:.2f} KB")

    if args.clean:
        print("[*] Performing safe cleanup of orphaned files...")
        cleaned = 0
        for o in orphans:
            try:
                o.unlink()
                cleaned += 1
            except Exception as e:
                print(f"  [ERROR] Could not delete {o}: {e}")
        print(f"[SUCCESS] Cleaned {cleaned} orphaned file(s).")
    else:
        print("[INFO] Dry run complete. Use --clean to permanently delete orphaned files.")

if __name__ == "__main__":
    main()
