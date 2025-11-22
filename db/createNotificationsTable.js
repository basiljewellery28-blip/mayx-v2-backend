require('dotenv').config();
const db = require('./Index.js');

const createNotificationsTable = async () => {
    try {
        console.log('Creating notifications table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'comment', 'status_change'
        message TEXT NOT NULL,
        related_id INTEGER, -- brief_id usually
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Notifications table created successfully!');
    } catch (error) {
        console.error('❌ Error creating notifications table:', error);
    } finally {
        process.exit();
    }
};

createNotificationsTable();
