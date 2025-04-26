# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/seed.py

import uuid
import bcrypt
from datetime import datetime
from database import get_db, return_db

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_default_user():
    user_id = str(uuid.uuid4())
    email = "anu@anu.com"
    raw_password = "123"
    password_hash = hash_password(raw_password)
    created_at = datetime.utcnow()

    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()

        # Check if user already exists
        cursor.execute("SELECT * FROM users WHERE email = %s;", (email,))
        if cursor.fetchone():
            print(f"User {email} already exists. Skipping insert.")
            return

        insert_sql = """
        INSERT INTO users (id, email, password_hash, is_email_verified, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        cursor.execute(insert_sql, (
            user_id, email, password_hash, True, created_at, created_at
        ))
        connection.commit()
        print(f"Seeded default user: {email}")
    except Exception as e:
        print(f"Error seeding default user: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)

if __name__ == "__main__":
    seed_default_user()
    print("Seeding completed.")
