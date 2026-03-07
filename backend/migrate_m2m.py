import sqlite3
import os

db_path = os.path.join("backend", "myvco.db")

def migrate_m2m():
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Create association table
        print("Creating company_staff association table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS company_staff (
                company_id INTEGER NOT NULL,
                staff_id INTEGER NOT NULL,
                PRIMARY KEY (company_id, staff_id),
                FOREIGN KEY(company_id) REFERENCES companies (id),
                FOREIGN KEY(staff_id) REFERENCES staff (id)
            )
        """)

        # 2. Migrate existing data from staff.company_id to association table
        cursor.execute("PRAGMA table_info(staff)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'company_id' in columns:
            print("Migrating existing company_id relations...")
            cursor.execute("SELECT id, company_id FROM staff WHERE company_id IS NOT NULL")
            existing_relations = cursor.fetchall()
            for staff_id, company_id in existing_relations:
                cursor.execute("INSERT OR IGNORE INTO company_staff (company_id, staff_id) VALUES (?, ?)", (company_id, staff_id))
            
            # 3. Create a new staff table without company_id
            print("Recreating staff table without company_id column...")
            # Get current schema but skip company_id
            cursor.execute("PRAGMA table_info(staff)")
            staff_columns = cursor.fetchall()
            
            # Filter out company_id
            new_col_names = [col[1] for col in staff_columns if col[1] != 'company_id']
            # Reconstruct CREATE TABLE (simplified)
            cursor.execute("""
                CREATE TABLE staff_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    department_id INTEGER,
                    name VARCHAR,
                    role VARCHAR,
                    personality TEXT,
                    expertise JSON,
                    system_prompt TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    fired_at DATETIME,
                    fired_reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(department_id) REFERENCES departments (id)
                )
            """)
            
            # Copy data
            cursor.execute(f"INSERT INTO staff_new ({', '.join(new_col_names)}) SELECT {', '.join(new_col_names)} FROM staff")
            
            # Rename
            cursor.execute("DROP TABLE staff")
            cursor.execute("ALTER TABLE staff_new RENAME TO staff")
            
            # Re-create indexes
            cursor.execute("CREATE INDEX ix_staff_id ON staff (id)")
            cursor.execute("CREATE INDEX ix_staff_name ON staff (name)")

        conn.commit()
        print("M2M Migration successful!")
    except Exception as e:
        conn.rollback()
        print(f"M2M Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_m2m()
