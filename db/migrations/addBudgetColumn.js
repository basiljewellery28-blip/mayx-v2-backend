const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool for the migration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addBudgetColumn() {
    try {
        console.log('Adding budget column to briefs table...');

        await pool.query(`
      ALTER TABLE briefs 
      ADD COLUMN IF NOT EXISTS budget VARCHAR(100);
    `);

        console.log('✅ Successfully added budget column to briefs table');
    } catch (error) {
        console.error('❌ Error adding budget column:', error);
        throw error;
    } finally {
        await pool.end();
        process.exit(0);
    }
}

addBudgetColumn();
