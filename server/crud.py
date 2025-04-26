from database import get_db, return_db

def get_user_by_email(email: str):
    sql = "SELECT * FROM users WHERE email = %s;"
    connection = get_db()
    try:
        cursor = connection.cursor()
        cursor.execute(sql, (email,))
        user = cursor.fetchone()
        if user:
            # Assuming the users table has these fields in this order
            return {
                "id": user[0],                     # UUID
                "email": user[1],                  # Email
                "password_hash": user[2],          # Hashed password
                "is_email_verified": user[3],      # Email verification status
                "email_verification_token": user[4],  # Verification token
                "email_verified_at": user[5],      # Timestamp of email verification
                "created_at": user[6],             # Creation timestamp
                "updated_at": user[7],             # Last updated timestamp
            }
        return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None
    finally:
        if connection:
            cursor.close()
            return_db(connection)