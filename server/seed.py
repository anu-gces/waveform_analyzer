-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Foreign key to users
    name VARCHAR(255) NOT NULL, -- Project name
    song_url TEXT NOT NULL, -- CDN or local URL for the song file
    seeker_position FLOAT DEFAULT 0, -- Time elapsed in seconds
    zoom_factor FLOAT DEFAULT 1.0, -- Zoom level of the time-domain graph
    fft_data JSONB, -- FFT data as JSON array (can be large)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create markers table
CREATE TABLE markers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- Foreign key to projects
    timestamp FLOAT NOT NULL, -- Time in the song the marker is placed (in seconds)
    note TEXT, -- User-defined note or description for the marker
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a test user (replace with your hash function for production)
INSERT INTO users (email, password_hash)
VALUES ('testuser@example.com', 'hashed_password_here');

-- Insert a test project for the user
INSERT INTO projects (user_id, name, song_url, seeker_position, zoom_factor, fft_data)
VALUES 
(1, 'Test Project', '/local/path/to/song.mp3', 30.0, 1.5, '[0.1, 0.2, 0.3, ...]');

-- Insert a test marker for the project
INSERT INTO markers (project_id, timestamp, note)
VALUES 
(1, 12.5, 'Intro section');
