require('dotenv').config();
const db = require('./db/Index');

const addRenderColumns = async () => {
    try {
        console.log('Adding render columns to briefs table...');

        await db.query(`
      ALTER TABLE briefs 
      ADD COLUMN IF NOT EXISTS render_status VARCHAR(50) DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS render_files JSONB DEFAULT '[]'
    `);

        console.log('✅ Render columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        process.exit(1);
    }
};

addRenderColumns();
