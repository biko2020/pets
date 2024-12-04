const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Create a review
router.post('/', auth, reviewController.createReview);

// Get reviews for a profile
router.get('/profile/:profileId', reviewController.getProfileReviews);

// Update a review
router.put('/:id', auth, reviewController.updateReview);

// Respond to a review (for profile owners)
router.post('/:id/respond', auth, reviewController.respondToReview);

// Delete a review
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
