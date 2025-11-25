const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: String,
  phone: String,
  plan: {
    type: String,
    enum: ['small_business', 'enterprise', 'startup'],
    default: 'small_business'
  },
  latitude: Number,
  longitude: Number
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
