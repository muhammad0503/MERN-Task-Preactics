const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==============================================================
// 1. [POST] /api/auth/register - Register a new user account
// ==============================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 2. Check if email already registered
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // 3. Create user (password will be hashed via pre-save hook in User model)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });
    await user.save();

    // 4. Automatically establish session upon registration
    req.session.userId = user._id;

    // 5. Send back user object (password excluded via toJSON method)
    res.status(201).json({
      message: 'Account registered successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
});

// ==============================================================
// 2. [POST] /api/auth/login - Authenticate user & start session
// ==============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // 2. Locate user by email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Verify password hash using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Save user identifier to session store
    req.session.userId = user._id;

    res.status(200).json({
      message: 'Signed in successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
});

// ==============================================================
// 3. [POST] /api/auth/logout - Destroy session & clear cookie
// ==============================================================
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ message: 'Already logged out' });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destroy error:', err);
      return res.status(500).json({ message: 'Could not log out. Please try again.' });
    }

    // Clear session cookie from browser
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Signed out successfully' });
  });
});

// ==============================================================
// 4. [GET] /api/auth/me or /api/auth/current-user - Get session user
// ==============================================================
const getCurrentUserHandler = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated', user: null });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie('connect.sid');
      return res.status(401).json({ message: 'User account not found', user: null });
    }

    res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    console.error('Current user error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

router.get('/me', getCurrentUserHandler);
router.get('/current-user', getCurrentUserHandler);

module.exports = router;

