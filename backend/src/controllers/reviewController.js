const Review = require('../models/Review');
const Profile = require('../models/Profile');
const User = require('../models/User');
const ReviewVote = require('../models/ReviewVote');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const emailService = require('../services/emailService');
const websocketService = require('../services/websocket');

exports.createReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { profileId, rating, title, content } = req.body;

    // Check if user has already reviewed this profile
    const existingReview = await Review.findOne({
      where: {
        userId: req.user.id,
        profileId
      }
    });

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({ message: 'You have already reviewed this profile' });
    }

    // Create review
    const review = await Review.create({
      userId: req.user.id,
      profileId,
      rating,
      title,
      content
    }, { transaction });

    // Update profile rating
    const profile = await Profile.findByPk(profileId);
    const reviews = await Review.findAll({
      where: { profileId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ],
      transaction
    });

    await profile.update({
      rating: Number(reviews[0].dataValues.averageRating).toFixed(1),
      reviewCount: reviews[0].dataValues.totalReviews
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

exports.getProfileReviews = async (req, res) => {
  try {
    const { profileId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      where: { profileId },
      include: [{
        model: User,
        attributes: ['firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(reviews.count / limit);

    res.json({
      reviews: reviews.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: reviews.count,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, content } = req.body;

    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    await review.update({
      rating,
      title,
      content
    });

    // Update profile rating
    const profile = await Profile.findByPk(review.profileId);
    const reviews = await Review.findAll({
      where: { profileId: review.profileId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ]
    });

    await profile.update({
      rating: Number(reviews[0].dataValues.averageRating).toFixed(1),
      reviewCount: reviews[0].dataValues.totalReviews
    });

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const review = await Review.findByPk(id, {
      include: [{
        model: Profile,
        where: { userId: req.user.id }
      }]
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    await review.update({
      response,
      responseDate: new Date()
    });

    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to review', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    await review.destroy({ transaction });

    // Update profile rating
    const profile = await Profile.findByPk(review.profileId);
    const reviews = await Review.findAll({
      where: { profileId: review.profileId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ],
      transaction
    });

    await profile.update({
      rating: Number(reviews[0]?.dataValues.averageRating || 0).toFixed(1),
      reviewCount: reviews[0]?.dataValues.totalReviews || 0
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

exports.voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Create vote and handle unique constraint
    try {
      await ReviewVote.create({
        reviewId,
        userId,
        voteType
      });

      // Update vote counts
      if (voteType === 'helpful') {
        await review.increment('helpfulVotes');
      } else {
        await review.increment('unhelpfulVotes');
      }

      return res.json({ message: 'Vote recorded successfully' });
    } catch (error) {
      if (error.message === 'User has already voted on this review') {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in voteReview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.increment('reportCount');
    
    // Auto-moderate if report threshold is reached
    if (review.reportCount >= 5) {
      await review.update({
        status: 'pending',
        moderationNotes: `Auto-moderated due to ${review.reportCount} reports. Latest reason: ${reason}`
      });
    }

    return res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Error in reportReview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNotes } = req.body;

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const review = await Review.findByPk(reviewId, {
      include: [
        { model: User, as: 'author' },
        { model: User, as: 'business' }
      ]
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({
      status,
      moderationNotes
    });

    // Notify users about moderation decision
    if (status === 'rejected') {
      await emailService.sendReviewRejectedEmail(review.author.email, {
        reviewTitle: review.title,
        moderationNotes
      });
    }

    return res.json({ message: 'Review moderated successfully' });
  } catch (error) {
    console.error('Error in moderateReview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createReview: exports.createReview,
  getProfileReviews: exports.getProfileReviews,
  updateReview: exports.updateReview,
  respondToReview: exports.respondToReview,
  deleteReview: exports.deleteReview,
  voteReview: exports.voteReview,
  reportReview: exports.reportReview,
  moderateReview: exports.moderateReview
};
