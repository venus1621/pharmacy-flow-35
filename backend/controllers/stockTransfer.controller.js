const StockTransfer = require('../models/StockTransfer');

exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await StockTransfer.find()
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name')
      .populate('requested_by', 'full_name')
      .populate('approved_by', 'full_name')
      .sort({ created_at: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

exports.getTransfersByPharmacist = async (req, res) => {
  try {
    const { pharmacistId } = req.params;
    const transfers = await StockTransfer.find({ requested_by: pharmacistId })
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name')
      .sort({ created_at: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('Get transfers by pharmacist error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { branch_id, medicine_id, quantity, requested_by, notes } = req.body;

    const transfer = new StockTransfer({
      branch_id,
      medicine_id,
      quantity,
      requested_by,
      notes
    });

    await transfer.save();
    await transfer.populate('branch_id', 'name location');
    await transfer.populate('medicine_id', 'name brand_name');
    await transfer.populate('requested_by', 'full_name');
    res.status(201).json(transfer);
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
};

exports.updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;

    const updateData = { status };
    if (status === 'approved') {
      updateData.approved_by = approved_by;
      updateData.approved_at = new Date();
    }

    const transfer = await StockTransfer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name')
      .populate('requested_by', 'full_name')
      .populate('approved_by', 'full_name');

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ error: 'Failed to update transfer' });
  }
};
