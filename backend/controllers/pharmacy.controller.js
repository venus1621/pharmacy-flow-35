const Pharmacy = require('../models/Pharmacy');

exports.getPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ owner_id: req.user.id })
      .populate('owner_id', 'full_name email');

    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacy' });
  }
};

exports.createPharmacy = async (req, res) => {
  try {
    const { name, address, phone, plan, latitude, longitude } = req.body;

    const pharmacy = new Pharmacy({
      owner_id: req.user.id,
      name,
      address,
      phone,
      plan: plan || 'small_business',
      latitude,
      longitude
    });

    await pharmacy.save();
    res.status(201).json(pharmacy);
  } catch (error) {
    console.error('Create pharmacy error:', error);
    res.status(500).json({ error: 'Failed to create pharmacy' });
  }
};

exports.updatePharmacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, plan, latitude, longitude } = req.body;

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { _id: id, owner_id: req.user.id },
      { name, address, phone, plan, latitude, longitude },
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error('Update pharmacy error:', error);
    res.status(500).json({ error: 'Failed to update pharmacy' });
  }
};
