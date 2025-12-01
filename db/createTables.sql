-- db/createTables.sql
-- This script creates the initial tables for the MAYX database.

-- 0. Create the 'clients' table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact_number VARCHAR(50),
    profile_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 4. Create the 'products' table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Ring', 'Earring', etc.
    sub_category VARCHAR(100), -- 'Engagement Rings', 'Mens Wedding Bands', etc.
    image_url TEXT,
    description TEXT,
    price DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);