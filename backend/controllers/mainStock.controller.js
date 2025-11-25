const MainStock = require('../models/MainStock');

exports.getAllStock = async (req, res) => {
  try {
    const stock = await MainStock.find()
      .populate('medicine_id', 'name brand_name category unit')
      .sort({ created_at: -1 });
    res.json(stock);
  } catch (error) {
    console.error('Get main stock error:', error);
    res.status(500).json({ error: 'Failed to fetch main stock' });
  }
};

exports.getStockByMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const stock = await MainStock.find({ medicine_id: medicineId })
      .populate('medicine_id', 'name brand_name category unit');
    res.json(stock);
  } catch (error) {
    console.error('Get stock by medicine error:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

exports.createStock = async (req, res) => {
  try {
    const { medicine_id, quantity, purchase_price, batch_number, manufacture_date, expire_date } = req.body;

    const stock = new MainStock({
      medicine_id,
      quantity,
      purchase_price,
      batch_number,
      manufacture_date,
      expire_date
    });

    await stock.save();
    await stock.populate('medicine_id', 'name brand_name category unit');
    res.status(201).json(stock);
  } catch (error) {
    console.error('Create main stock error:', error);
    res.status(500).json({ error: 'Failed to create main stock' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, purchase_price, batch_number, expire_date } = req.body;

    const stock = await MainStock.findByIdAndUpdate(
      id,
      { quantity, purchase_price, batch_number, expire_date },
      { new: true, runValidators: true }
    ).populate('medicine_id', 'name brand_name category unit');

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(stock);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await MainStock.findByIdAndDelete(id);

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ error: 'Failed to delete stock' });
  }
};
