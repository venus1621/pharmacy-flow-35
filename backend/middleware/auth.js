const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const user = await Profile.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user._id,
      full_name: user.full_name,
      role: user.role,
      email: user.email
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if user is owner
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// Check if user is pharmacist
const requirePharmacist = (req, res, next) => {
  if (req.user.role !== 'pharmacist' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Pharmacist access required' });
  }
  next();
};

module.exports = {
  authenticate,
  requireOwner,
  requirePharmacist
};
