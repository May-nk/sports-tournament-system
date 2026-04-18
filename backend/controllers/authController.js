const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

/* ─── helpers ────────────────────────────────────────────────────── */
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (user) => ({
  id:    user._id,
  name:  user.name,
  email: user.email,
  role:  user.role,
});

// ─────────────────────────────────────────────────────────────────────
// @desc    Register a new user (captain by default)
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // --- validation --------------------------------------------------
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- duplicate check --------------------------------------------
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // --- hash password explicitly (pre-save hook is a backup) -------
    console.log('[register] hashing password for:', normalizedEmail);
    const hashed = await bcrypt.hash(password, 10);
    console.log('[register] hash starts with $2b$:', hashed.startsWith('$2b$'));

    // --- create user ------------------------------------------------
    const user = await User.create({
      name:     name.trim(),
      email:    normalizedEmail,
      password: hashed,
      role:     role === 'admin' ? 'admin' : 'captain',
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[register] error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// @desc    Authenticate a user & return token
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- validation --------------------------------------------------
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[login] attempt for:', normalizedEmail);

    // --- find user ---------------------------------------------------
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('[login] user not found');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log('[login] stored hash starts with $2b$:', user.password.startsWith('$2b$'));
    console.log('[login] stored hash preview:', user.password.slice(0, 10) + '...');

    // --- compare password -------------------------------------------
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[login] password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- success -----------------------------------------------------
    const token = generateToken(user._id, user.role);
    console.log('[login] success – role:', user.role);

    return res.json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[login] error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login };
