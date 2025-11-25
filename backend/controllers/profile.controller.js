const Profile = require('../models/Profile');

exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find()
      .select('-password')
      .sort({ created_at: -1 });
    res.json(profiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id).select('-password');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    const profile = new Profile({
      full_name,
      email,
      password,
      role: role || 'pharmacist'
    });

    await profile.save();
    
    const profileData = profile.toObject();
    delete profileData.password;
    
    res.status(201).json(profileData);
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name } = req.body;

    const profile = await Profile.findByIdAndUpdate(
      id,
      { full_name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
