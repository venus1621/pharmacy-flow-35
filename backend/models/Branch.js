const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  pharmacy_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  phone: String,
  is_active: {
    type: Boolean,
    default: true
  },
  latitude: Number,
  longitude: Number
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Branch', branchSchema);
