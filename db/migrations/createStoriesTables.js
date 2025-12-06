const db = require('../Index');

const createStoriesTables = async () => {
    try {
        // Stories table
        await db.query(`
            CREATE TABLE IF NOT EXISTS stories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                image_url TEXT,
                category TEXT DEFAULT 'other',
                likes_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                moderation_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Stories table created');

        // Story likes table
        await db.query(`
            CREATE TABLE IF NOT EXISTS story_likes (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(story_id, user_id)
            )
        `);
        console.log('✅ Story likes table created');

        // Story saves table
        await db.query(`
            CREATE TABLE IF NOT EXISTS story_saves (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(story_id, user_id)
            )
        `);
        console.log('✅ Story saves table created');

        // Story reports table (for moderation)
        await db.query(`
            CREATE TABLE IF NOT EXISTS story_reports (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL,
                reporter_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                details TEXT,
                status TEXT DEFAULT 'pending',
                reviewed_by INTEGER,
                reviewed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                FOREIGN KEY (reporter_id) REFERENCES users(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id)
            )
        `);
        console.log('✅ Story reports table created');

        console.log('✅ All stories tables initialized successfully');
    } catch (error) {
        console.error('Error creating stories tables:', error);
        throw error;
    }
};

module.exports = { createStoriesTables };

// Run if called directly
if (require.main === module) {
    createStoriesTables()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
