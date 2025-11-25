const Branch = require('../models/Branch');

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('pharmacy_id', 'name')
      .sort({ created_at: -1 });
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

exports.getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id).populate('pharmacy_id', 'name');

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { pharmacy_id, name, location, phone, latitude, longitude } = req.body;

    const branch = new Branch({
      pharmacy_id,
      name,
      location,
      phone,
      latitude,
      longitude
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, phone, is_active, latitude, longitude } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      id,
      { name, location, phone, is_active, latitude, longitude },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndDelete(id);

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};
