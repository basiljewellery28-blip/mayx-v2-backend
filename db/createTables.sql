-- db/createTables.sql
-- This script creates the initial tables for the MAYX database.

-- 1. Create the 'briefs' table
CREATE TABLE IF NOT EXISTS briefs (
    id SERIAL PRIMARY KEY,
    brief_number VARCHAR(255) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    consultant_id INTEGER NOT NULL,
    style_code_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    current_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the 'brief_versions' table
CREATE TABLE IF NOT EXISTS brief_versions (
    id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES briefs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL, -- Using JSONB for efficient JSON storage and querying in PostgreSQL
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the 'renders' table
CREATE TABLE IF NOT EXISTS renders (
    id SERIAL PRIMARY KEY,
    brief_version_id INTEGER REFERENCES brief_versions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    render_notes TEXT,
    render_status VARCHAR(50) DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (We will add more tables for users, clients, consultants, etc. later)
-- For now, we can run this to create the core brief-related tables.