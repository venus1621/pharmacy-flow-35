const Alert = require('../models/Alert');

exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name')
      .populate('resolved_by', 'full_name')
      .sort({ created_at: -1 });
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.getAlertsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const alerts = await Alert.find({ branch_id: branchId })
      .populate('medicine_id', 'name brand_name')
      .sort({ created_at: -1 });
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts by branch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alert = await Alert.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('branch_id', 'name location')
      .populate('medicine_id', 'name brand_name');

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { is_read: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};

exports.markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        is_resolved: true,
        resolved_at: new Date(),
        resolved_by: userId
      },
      { new: true }
    ).populate('resolved_by', 'full_name');

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Mark alert as resolved error:', error);
    res.status(500).json({ error: 'Failed to mark alert as resolved' });
  }
};
