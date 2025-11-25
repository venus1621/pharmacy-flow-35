const Medicine = require('../models/Medicine');

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
};

exports.getMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, brand_name, category, description, manufacturer, unit, requires_prescription } = req.body;

    const medicine = new Medicine({
      name,
      brand_name,
      category,
      description,
      manufacturer,
      unit,
      requires_prescription
    });

    await medicine.save();
    res.status(201).json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ error: 'Failed to create medicine' });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand_name, category, description, manufacturer, unit, requires_prescription } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { name, brand_name, category, description, manufacturer, unit, requires_prescription },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
};
