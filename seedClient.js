require('dotenv').config();
const db = require('./db/Index.js');
const bcrypt = require('bcrypt');

async function seedClient() {
    try {
        const email = 'client@example.com';
        const password = 'client123';
        const name = 'Test Client';
        const role = 'client';

        console.log(`Checking for user ${email}...`);
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length === 0) {
            console.log('Client not found. Creating...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            await db.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [name, email, hash, role]
            );
            console.log(`Client created: ${email} / ${password}`);
        } else {
            console.log('Client already exists.');
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding client:', err);
        process.exit(1);
    }
}

seedClient();
