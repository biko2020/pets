const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../config/multer');
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  searchProfiles
} = require('../controllers/profileController');

// Public routes
router.get('/search', searchProfiles);

// Protected routes
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.post('/me/image', auth, upload.single('profileImage'), uploadProfileImage);
router.delete('/me/image', auth, deleteProfileImage);

module.exports = router;
