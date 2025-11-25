const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine'
  },
  stock_id: mongoose.Schema.Types.ObjectId,
  alert_type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  current_quantity: Number,
  threshold_quantity: Number,
  expiry_date: Date,
  is_read: {
    type: Boolean,
    default: false
  },
  is_resolved: {
    type: Boolean,
    default: false
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  resolved_at: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Alert', alertSchema);
