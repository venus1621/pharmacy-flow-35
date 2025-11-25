const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: String,
  approved_at: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
