const express = require('express');
const router = express.Router();
const db = require('../db/Index.js'); // Assumes your db connection is in /db/index.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Save user to database
        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            [name, email, password_hash, role]
        );

        const user = result.rows[0];
        res.status(201).json({ message: 'User registered successfully!', user });

    } catch (error) {
        console.error('Registration Error:', error);
        if (error.code === '23505') { // Unique constraint violation (email)
            return res.status(400).json({ error: 'Email already in use.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // 1. Find the user by email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            console.warn(`Login attempt: No user found with email ${email}`);
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];

        // 2. Compare the provided password with the hashed password in the database
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            console.warn(`Login attempt: Invalid password for user ${email}`);
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // 3. Create and send the JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET, // Make sure JWT_SECRET is in your .env file
            { expiresIn: '7d' } // Token expires in 7d
        );

        // Don't send the password hash back to the client
        delete user.password_hash;


        res.json({
            message: 'Login successful!',
            token,
            user // Send user info back to save in localStorage
        });

    } catch (error) {
        console.error('Login Server Error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});


module.exports = router;
