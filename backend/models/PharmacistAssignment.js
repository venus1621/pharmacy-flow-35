const mongoose = require('mongoose');

const pharmacistAssignmentSchema = new mongoose.Schema({
  pharmacist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  assigned_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PharmacistAssignment', pharmacistAssignmentSchema);
