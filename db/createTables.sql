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

-- 5. Create the 'stories' table (Love Stories Feature)
CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category VARCHAR(50) DEFAULT 'other',
    likes_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create the 'story_likes' table
CREATE TABLE IF NOT EXISTS story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- 7. Create the 'story_saves' table
CREATE TABLE IF NOT EXISTS story_saves (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- 8. Create the 'story_reports' table (Content Moderation)
CREATE TABLE IF NOT EXISTS story_reports (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create the 'conversations' table (Messaging)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    consultant_id INTEGER NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, consultant_id)
);

-- 10. Create the 'messages' table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);