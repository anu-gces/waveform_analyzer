# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/database.py
import psycopg2
from psycopg2 import pool

# Configure PostgreSQL connection
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "password"
POSTGRES_DB = "waveanalyzer"
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"

# Initialize connection pool
try:
    connection_pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,  # Minimum and maximum number of connections
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB
    )
    if connection_pool:
        print("PostgreSQL connection pool created successfully")
except Exception as e:
    print(f"Error creating PostgreSQL connection pool: {e}")

# Function to get a connection from the pool
def get_db():
    try:
        connection = connection_pool.getconn()
        if connection:
            print("Successfully connected to the database")
        return connection
    except Exception as e:
        print(f"Error getting connection from pool: {e}")
        raise e

# Function to return the connection to the pool
def return_db(connection):
    try:
        connection_pool.putconn(connection)
    except Exception as e:
        print(f"Error returning connection to pool: {e}")
