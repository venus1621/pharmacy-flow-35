const mongoose = require('mongoose');

const mainStockSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  purchase_price: {
    type: Number,
    required: true
  },
  batch_number: String,
  manufacture_date: Date,
  expire_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('MainStock', mainStockSchema);
