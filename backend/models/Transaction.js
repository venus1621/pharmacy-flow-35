const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  pharmacist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Transaction', transactionSchema);
