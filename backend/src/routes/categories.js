const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} = require('../controllers/categoryController');

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.post('/', adminAuth, createCategory);
router.put('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);
router.post('/reorder', adminAuth, reorderCategories);

module.exports = router;
