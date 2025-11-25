const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('branch_id', 'name location')
      .populate('pharmacist_id', 'full_name')
      .sort({ created_at: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

exports.getTransactionsByPharmacist = async (req, res) => {
  try {
    const { pharmacistId } = req.params;
    const transactions = await Transaction.find({ pharmacist_id: pharmacistId })
      .populate('branch_id', 'name location')
      .sort({ created_at: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions by pharmacist error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

exports.getTransactionItems = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await TransactionItem.find({ transaction_id: id })
      .populate('medicine_id', 'name brand_name');
    res.json(items);
  } catch (error) {
    console.error('Get transaction items error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction items' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { branch_id, pharmacist_id, total_amount, payment_method } = req.body;

    const transaction = new Transaction({
      branch_id,
      pharmacist_id,
      total_amount,
      payment_method
    });

    await transaction.save();
    await transaction.populate('branch_id', 'name location');
    await transaction.populate('pharmacist_id', 'full_name');
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

exports.createTransactionItem = async (req, res) => {
  try {
    const { transaction_id, medicine_id, quantity, unit_price, subtotal } = req.body;

    const item = new TransactionItem({
      transaction_id,
      medicine_id,
      quantity,
      unit_price,
      subtotal
    });

    await item.save();
    await item.populate('medicine_id', 'name brand_name');
    res.status(201).json(item);
  } catch (error) {
    console.error('Create transaction item error:', error);
    res.status(500).json({ error: 'Failed to create transaction item' });
  }
};
