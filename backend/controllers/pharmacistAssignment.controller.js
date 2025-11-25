const PharmacistAssignment = require('../models/PharmacistAssignment');

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await PharmacistAssignment.find()
      .populate('pharmacist_id', 'full_name email role')
      .populate('branch_id', 'name location')
      .sort({ assigned_at: -1 });
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.getAssignmentsByPharmacist = async (req, res) => {
  try {
    const { pharmacistId } = req.params;
    const assignments = await PharmacistAssignment.find({ pharmacist_id: pharmacistId })
      .populate('branch_id', 'name location')
      .sort({ assigned_at: -1 });
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments by pharmacist error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { pharmacist_id, branch_id } = req.body;

    // Check if assignment already exists
    const existingAssignment = await PharmacistAssignment.findOne({
      pharmacist_id,
      branch_id
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Assignment already exists' });
    }

    const assignment = new PharmacistAssignment({
      pharmacist_id,
      branch_id
    });

    await assignment.save();
    await assignment.populate('pharmacist_id', 'full_name email role');
    await assignment.populate('branch_id', 'name location');
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await PharmacistAssignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};
