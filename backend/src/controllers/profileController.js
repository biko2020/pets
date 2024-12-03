const Profile = require('../models/Profile');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      companyName,
      description,
      address,
      city,
      country,
      phone,
      website,
      categories,
      languages,
      businessHours,
      services
    } = req.body;

    const profile = await Profile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update profile fields
    await profile.update({
      companyName: companyName || profile.companyName,
      description: description || profile.description,
      address: address || profile.address,
      city: city || profile.city,
      country: country || profile.country,
      phone: phone || profile.phone,
      website: website || profile.website,
      categories: categories || profile.categories,
      languages: languages || profile.languages,
      businessHours: businessHours || profile.businessHours,
      services: services || profile.services
    });

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profile = await Profile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Delete old profile image if exists
    if (profile.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles/', profile.profileImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Update profile with new image
    profile.profileImage = req.file.filename;
    await profile.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload profile image', error: error.message });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.user.id } });

    if (!profile || !profile.profileImage) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    // Delete profile image file
    const imagePath = path.join(__dirname, '../../uploads/profiles/', profile.profileImage);
    await fs.unlink(imagePath);

    // Update profile
    profile.profileImage = null;
    await profile.save();

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete profile image', error: error.message });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const { category, city, query } = req.query;
    let whereClause = {};

    if (category) {
      whereClause.categories = { [Op.contains]: [category] };
    }

    if (city) {
      whereClause.city = city;
    }

    if (query) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { companyName: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ]
      };
    }

    const profiles = await Profile.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['firstName', 'lastName']
      }],
      order: [['rating', 'DESC']]
    });

    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search profiles', error: error.message });
  }
};
