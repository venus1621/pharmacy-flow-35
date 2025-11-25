const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand_name: String,
  category: {
    type: String,
    required: true
  },
  description: String,
  manufacturer: String,
  unit: {
    type: String,
    default: 'piece'
  },
  requires_prescription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Medicine', medicineSchema);
