const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const Pharmacy = require('../models/Pharmacy');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.signUp = async (req, res) => {
  try {
    const { email, password, full_name, role, pharmacy_name, pharmacy_address, pharmacy_phone } = req.body;

    // Check if user already exists
    const existingUser = await Profile.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new Profile({
      email,
      password, // Will be hashed by pre-save hook
      full_name,
      role: role || 'pharmacist'
    });

    await user.save();

    // If owner, create pharmacy
    if (role === 'owner' && pharmacy_name) {
      const pharmacy = new Pharmacy({
        owner_id: user._id,
        name: pharmacy_name,
        address: pharmacy_address,
        phone: pharmacy_phone
      });
      await pharmacy.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ error: 'Sign up failed' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await Profile.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
};

exports.signOut = async (req, res) => {
  res.json({ message: 'Signed out successfully' });
};

exports.getSession = async (req, res) => {
  res.json({ user: req.user });
};
