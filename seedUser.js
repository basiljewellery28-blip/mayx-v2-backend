require('dotenv').config();
const db = require('./db/Index.js');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log('Creating users table if not exists...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'consultant',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const email = 'admin@mayx.com';
        const password = 'admin';
        const name = 'Admin User';
        const role = 'admin';

        console.log(`Checking for user ${email}...`);
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length === 0) {
            console.log('User not found. Creating...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            await db.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [name, email, hash, role]
            );
            console.log(`User created: ${email} / ${password}`);
        } else {
            console.log('User already exists.');
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding:', err);
        process.exit(1);
    }
}

seed();
