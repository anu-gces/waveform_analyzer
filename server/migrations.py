from database import get_db, return_db

def create_users_table():
    """Create the users table in the PostgreSQL database."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,                      -- Unique user ID
        email VARCHAR(255) UNIQUE NOT NULL,       -- User's email address
        password_hash TEXT NOT NULL,              -- Hashed password
        is_email_verified BOOLEAN DEFAULT FALSE,  -- Email verification status
        email_verification_token UUID,            -- Token for verifying email
        email_verified_at TIMESTAMP,              -- Timestamp when email was verified
        created_at TIMESTAMP DEFAULT NOW() NOT NULL, -- Creation timestamp
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL  -- Last updated timestamp
    );
    """
    connection = None
    try:
        # Get a connection from the pool
        connection = get_db()
        cursor = connection.cursor()

        # Execute the SQL statement
        cursor.execute(create_table_sql)
        connection.commit()

        print("`users` table created successfully!")
    except Exception as e:
        print(f"Error creating `users` table: {e}")
    finally:
        # Return the connection to the pool
        if connection:
            cursor.close()
            return_db(connection)


def create_projects_table():
    """Create the projects table in the PostgreSQL database."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        song_url TEXT NOT NULL,
        seeker_position FLOAT DEFAULT 0,
        zoom_factor FLOAT DEFAULT 1.0,
        loop_start FLOAT,
        loop_end FLOAT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()
        cursor.execute(create_table_sql)
        connection.commit()
        print("`projects` table created successfully!")
    except Exception as e:
        print(f"Error creating `projects` table: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)

            
def create_markers_table():
    """Create the markers table in the PostgreSQL database."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS markers (
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL,
        note TEXT,
        timestamp FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """
    connection = None
    try:
        connection = get_db()
        cursor = connection.cursor()
        cursor.execute(create_table_sql)
        connection.commit()
        print("`markers` table created successfully!")
    except Exception as e:
        print(f"Error creating `markers` table: {e}")
    finally:
        if connection:
            cursor.close()
            return_db(connection)
            
def create_indexes():
    """Create indexes on commonly queried fields in the database."""
    create_indexes_sql = """
    -- Index for faster lookups by email in the users table
    CREATE INDEX IF NOT EXISTS idx_user_email ON users (email);

    -- Index for faster lookups by user_id in the projects table
    CREATE INDEX IF NOT EXISTS idx_user_projects ON projects (user_id);

    -- Index for faster lookups by project_id in the markers table
    CREATE INDEX IF NOT EXISTS idx_project_markers ON markers (project_id);
    """
    connection = None
    try:
        # Get a connection from the pool
        connection = get_db()
        cursor = connection.cursor()

        # Execute the SQL statement
        cursor.execute(create_indexes_sql)
        connection.commit()

        print("Indexes created successfully!")
    except Exception as e:
        print(f"Error creating indexes: {e}")
    finally:
        # Return the connection to the pool
        if connection:
            cursor.close()
            return_db(connection)

if __name__ == "__main__":
    create_users_table()
    create_projects_table()
    create_markers_table()
    create_indexes()
    