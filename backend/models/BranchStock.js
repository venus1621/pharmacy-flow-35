const mongoose = require('mongoose');

const branchStockSchema = new mongoose.Schema({
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
    default: 0
  },
  selling_price: {
    type: Number,
    required: true
  },
  batch_number: String,
  expire_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('BranchStock', branchStockSchema);
