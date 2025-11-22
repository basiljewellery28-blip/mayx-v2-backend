require('dotenv').config();
const db = require('./db/Index.js');

const createCommentsTable = async () => {
    try {
        console.log('Creating comments table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        brief_id INTEGER REFERENCES briefs(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        attachment_url TEXT,
        brief_version_id INTEGER REFERENCES brief_versions(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Comments table created successfully!');
    } catch (error) {
        console.error('❌ Error creating comments table:', error);
    } finally {
        process.exit();
    }
};

createCommentsTable();
