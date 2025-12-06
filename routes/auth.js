const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Password validation helper
const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain a number';
    return null;
};

// POST /api/auth/register
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('name').trim().escape().notEmpty().withMessage('Name required'),
    body('password').notEmpty().withMessage('Password required'),
    body('role').isIn(['client', 'consultant', 'admin']).withMessage('Invalid role')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
        return res.status(400).json({ error: passwordError });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(12); // Increased salt rounds
        const password_hash = await bcrypt.hash(password, salt);

        // Save user to database
        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            [name, email, password_hash, role]
        );

        const user = result.rows[0];
        console.log(`✅ New user registered: ${email}`); // Safe logging
        res.status(201).json({ message: 'User registered successfully!', user });

    } catch (error) {
        console.error('Registration Error:', error.message); // Don't log full error
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already in use.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
});


// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`); // Safe logging - no password!

    try {
        // 1. Find the user by email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            console.warn(`Login failed: No user found - ${email}`);
            // Use generic message to prevent user enumeration
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];

        // 2. Compare the provided password with the hashed password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            console.warn(`Login failed: Invalid password - ${email}`);
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // 3. Create and send the JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Don't send the password hash back to the client
        delete user.password_hash;

        console.log(`✅ Login successful: ${email}`);
        res.json({
            message: 'Login successful!',
            token,
            user
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});


module.exports = router;
