const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUser } = require('../models/User');

const isValidPassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[@&*!]/.test(password)) return false;
    return true;
};

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'agriassist_default_secret_2026_change_me',
        { expiresIn: '7d' }
    );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, location } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@ & * !)'
            });
        }

        const User = getUser();
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: password,
            role: role || 'farmer',
            phone: phone || null,
            location: location || null
        });

        const token = generateToken(user);
        res.status(201).json({
            access_token: token,
            token_type: 'bearer',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, location: user.location }
        });
    } catch (error) {
        console.error('Register error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ 
            message: `Server error during registration: ${error.message}`,
            details: error.name
        });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const User = getUser();
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        const token = generateToken(user);
        res.json({
            access_token: token,
            token_type: 'bearer',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
