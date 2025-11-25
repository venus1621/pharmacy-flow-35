const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
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
  unit_price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('TransactionItem', transactionItemSchema);
