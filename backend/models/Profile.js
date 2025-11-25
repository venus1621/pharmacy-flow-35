const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const profileSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'pharmacist'],
    default: 'pharmacist'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Hash password before saving
profileSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
profileSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Profile', profileSchema);
