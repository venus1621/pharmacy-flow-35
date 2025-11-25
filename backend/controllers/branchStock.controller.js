const BranchStock = require('../models/BranchStock');

exports.getAllBranchStock = async (req, res) => {
  try {
    const stock = await BranchStock.find()
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name category unit')
      .sort({ created_at: -1 });
    res.json(stock);
  } catch (error) {
    console.error('Get branch stock error:', error);
    res.status(500).json({ error: 'Failed to fetch branch stock' });
  }
};

exports.getStockByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const stock = await BranchStock.find({ branch_id: branchId })
      .populate('medicine_id', 'name brand_name category unit')
      .sort({ created_at: -1 });
    res.json(stock);
  } catch (error) {
    console.error('Get stock by branch error:', error);
    res.status(500).json({ error: 'Failed to fetch branch stock' });
  }
};

exports.createBranchStock = async (req, res) => {
  try {
    const { branch_id, medicine_id, quantity, selling_price, batch_number, expire_date } = req.body;

    const stock = new BranchStock({
      branch_id,
      medicine_id,
      quantity,
      selling_price,
      batch_number,
      expire_date
    });

    await stock.save();
    await stock.populate('medicine_id', 'name brand_name category unit');
    res.status(201).json(stock);
  } catch (error) {
    console.error('Create branch stock error:', error);
    res.status(500).json({ error: 'Failed to create branch stock' });
  }
};

exports.updateBranchStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, selling_price, batch_number, expire_date } = req.body;

    const stock = await BranchStock.findByIdAndUpdate(
      id,
      { quantity, selling_price, batch_number, expire_date },
      { new: true, runValidators: true }
    ).populate('medicine_id', 'name brand_name category unit');

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(stock);
  } catch (error) {
    console.error('Update branch stock error:', error);
    res.status(500).json({ error: 'Failed to update branch stock' });
  }
};

exports.deleteBranchStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await BranchStock.findByIdAndDelete(id);

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Delete branch stock error:', error);
    res.status(500).json({ error: 'Failed to delete branch stock' });
  }
};
