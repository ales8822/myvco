# backend/migrate_split_library.py
import sqlite3
import os
import shutil
from datetime import datetime

DB_PATH = "backend/myvco.db"
BACKUP_PATH = f"backend/myvco_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    # 1. Backup
    print(f"Creating backup at {BACKUP_PATH}...")
    shutil.copy2(DB_PATH, BACKUP_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 2. Update library_items table
        print("Updating library_items table...")
        # Check if category already exists
        cursor.execute("PRAGMA table_info(library_items)")
        columns = [col[1] for col in cursor.fetchall()]
        if "category" not in columns:
            cursor.execute("ALTER TABLE library_items ADD COLUMN category VARCHAR(50) DEFAULT 'manifesto'")
            print("Added 'category' column to library_items.")
        else:
            print("'category' column already exists in library_items.")

        # 3. Update staff table
        print("Updating staff table...")
        cursor.execute("PRAGMA table_info(staff)")
        columns = [col[1] for col in cursor.fetchall()]
        if "knowledge_base" not in columns:
            cursor.execute("ALTER TABLE staff ADD COLUMN knowledge_base TEXT")
            print("Added 'knowledge_base' column to staff.")
        else:
            print("'knowledge_base' column already exists in staff.")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
        print("Rolling back changes...")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
