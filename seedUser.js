require('dotenv').config();
const db = require('./db/Index.js');
const bcrypt = require('bcrypt');

const USERS = [
    {
        name: 'Admin User',
        email: 'admin@mayx.com',
        password: 'Admin123!',
        role: 'admin'
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah@browns.com',
        password: 'Consultant123!',
        role: 'consultant'
    },
    {
        name: 'Michael Thompson',
        email: 'michael@browns.com',
        password: 'Consultant123!',
        role: 'consultant'
    },
    {
        name: 'Emily Davis',
        email: 'emily@client.com',
        password: 'Client123!',
        role: 'client'
    },
    {
        name: 'James Wilson',
        email: 'james@client.com',
        password: 'Client123!',
        role: 'client'
    }
];

async function seed() {
    try {
        console.log('🌱 Starting user seeding...\n');

        // Create users table if not exists
        console.log('📋 Ensuring users table exists...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed each user
        for (const user of USERS) {
            console.log(`\n👤 Processing: ${user.name} (${user.role})`);

            const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [user.email]);

            if (userCheck.rows.length === 0) {
                const salt = await bcrypt.genSalt(12);
                const hash = await bcrypt.hash(user.password, salt);

                await db.query(
                    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                    [user.name, user.email, hash, user.role]
                );
                console.log(`   ✅ Created: ${user.email} / ${user.password}`);
            } else {
                // Update password to make sure it works with new requirements
                const salt = await bcrypt.genSalt(12);
                const hash = await bcrypt.hash(user.password, salt);
                await db.query(
                    'UPDATE users SET password_hash = $1 WHERE email = $2',
                    [hash, user.email]
                );
                console.log(`   🔄 Updated: ${user.email} / ${user.password}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 SEEDING COMPLETE! Test Users Created:\n');
        console.log('┌─────────────────────────────────────────────────────┐');
        console.log('│ ROLE        │ EMAIL                │ PASSWORD      │');
        console.log('├─────────────────────────────────────────────────────┤');
        console.log('│ Admin       │ admin@mayx.com       │ Admin123!     │');
        console.log('│ Consultant  │ sarah@browns.com     │ Consultant123!│');
        console.log('│ Consultant  │ michael@browns.com   │ Consultant123!│');
        console.log('│ Client      │ emily@client.com     │ Client123!    │');
        console.log('│ Client      │ james@client.com     │ Client123!    │');
        console.log('└─────────────────────────────────────────────────────┘');
        console.log('\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    }
}

seed();
