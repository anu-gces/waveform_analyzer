from database import get_db, return_db
from datetime import datetime

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
            
def insert_user(user_data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (id, email, password_hash, email_verification_token)
            VALUES (%s, %s, %s, %s)
        """, (
            user_data["id"],
            user_data["email"],
            user_data["password_hash"],
            user_data["email_verification_token"]
        ))
        conn.commit()
    finally:
        return_db(conn)
            
            
def verify_user_email(token: str) -> bool:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email_verification_token = %s AND is_email_verified = FALSE", (token,))
        row = cur.fetchone()
        if not row:
            return False
        cur.execute("""
            UPDATE users
            SET is_email_verified = TRUE,
                email_verified_at = %s,
                updated_at = %s
            WHERE id = %s
        """, (datetime.utcnow(), datetime.utcnow(), row[0]))
        conn.commit()
        return True
    finally:
        return_db(conn)
        
        
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import HTTPException
from database import get_db, return_db

def create_marker(project_id: UUID, note: str, timestamp: float):
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()

        marker_id = uuid4()
        now = datetime.utcnow()

        print(f"Creating marker with ID: {marker_id}, Project ID: {project_id}, Note: {note}, Timestamp: {timestamp}")
        cursor.execute("""
            INSERT INTO markers (id, project_id, note, timestamp, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (str(marker_id), str(project_id), note, timestamp, now, now))

        connection.commit()
        return {"id": str(marker_id), "message": "Marker created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create marker inside create_marker: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)


def get_markers_by_project(project_id: UUID):
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id, project_id, note, timestamp, created_at, updated_at FROM markers WHERE project_id = %s",
            (str(project_id),)  # Convert UUID to string
        )
        rows = cursor.fetchall()

        markers = [{
            "id": str(row[0]),
            "project_id": str(row[1]),
            "note": row[2],
            "timestamp": row[3],
            "created_at": row[4],
            "updated_at": row[5]
        } for row in rows]

        return markers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch markers: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)


def update_marker(marker_id: UUID, note: str, timestamp: float):
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()

        now = datetime.utcnow()

        cursor.execute("""
            UPDATE markers
            SET note = %s, timestamp = %s, updated_at = %s
            WHERE id = %s
        """, (note, timestamp, now, marker_id))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Marker not found")

        connection.commit()
        return {"message": "Marker updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update marker: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)


def delete_marker(marker_id: UUID):
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM markers WHERE id = %s", (marker_id,))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Marker not found")

        connection.commit()
        return {"message": "Marker deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete marker: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)
