import sqlite3
import os

db_path = os.path.join("backend", "myvco.db")

def migrate():
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Get current schema of staff table
        cursor.execute("PRAGMA table_info(staff)")
        columns = cursor.fetchall()
        
        # columns format: (cid, name, type, notnull, dflt_value, pk)
        col_names = [col[1] for col in columns]
        print(f"Found columns: {', '.join(col_names)}")

        # 2. Check if company_id is already nullable (notnull == 0)
        company_id_col = next((col for col in columns if col[1] == 'company_id'), None)
        if company_id_col and company_id_col[3] == 0:
            print("company_id is already nullable. No migration needed.")
            return

        print("Migrating staff table to allow null company_id...")

        # 3. Create a new table with same schema but nullable company_id
        # We'll use the current PRAGMA info to reconstruct the CREATE TABLE statement 
        # but with company_id being nullable.
        
        # For simplicity in this specific case, we know the schema from models/staff.py
        # We'll create staff_new, copy data, drop staff, rename staff_new.
        
        cursor.execute("""
            CREATE TABLE staff_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
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
                FOREIGN KEY(company_id) REFERENCES companies (id),
                FOREIGN KEY(department_id) REFERENCES departments (id)
            )
        """)
        
        # 4. Copy data
        cursor.execute(f"INSERT INTO staff_new ({', '.join(col_names)}) SELECT {', '.join(col_names)} FROM staff")
        
        # 5. Drop old table
        cursor.execute("DROP TABLE staff")
        
        # 6. Rename new table
        cursor.execute("ALTER TABLE staff_new RENAME TO staff")
        
        # 7. Re-create index (Staff model says index=True for id and name)
        cursor.execute("CREATE INDEX ix_staff_id ON staff (id)")
        cursor.execute("CREATE INDEX ix_staff_name ON staff (name)")

        conn.commit()
        print("Migration successful!")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
