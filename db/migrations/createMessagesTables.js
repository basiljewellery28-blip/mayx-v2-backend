const db = require('../Index');

const createMessagesTables = async () => {
    try {
        // Conversations table
        await db.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL,
                consultant_id INTEGER NOT NULL,
                last_message TEXT,
                last_message_at TIMESTAMP,
                unread_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id),
                FOREIGN KEY (consultant_id) REFERENCES users(id),
                UNIQUE(client_id, consultant_id)
            )
        `);
        console.log('✅ Conversations table created');

        // Messages table
        await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Messages table created');

        // Add assigned_consultant_id to users table if not exists
        try {
            await db.query(`
                ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_consultant_id INTEGER REFERENCES users(id)
            `);
            console.log('✅ Added assigned_consultant_id to users');
        } catch (e) {
            console.log('ℹ️ assigned_consultant_id column may already exist');
        }

        console.log('✅ All messages tables initialized successfully');
    } catch (error) {
        console.error('Error creating messages tables:', error);
        throw error;
    }
};

module.exports = { createMessagesTables };

// Run if called directly
if (require.main === module) {
    createMessagesTables()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
