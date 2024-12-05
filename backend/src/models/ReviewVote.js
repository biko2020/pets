const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReviewVote = sequelize.define('ReviewVote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reviewId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Reviews',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  voteType: {
    type: DataTypes.ENUM('helpful', 'unhelpful'),
    allowNull: false
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['reviewId', 'userId']
    }
  ]
});

// A user can only vote once per review
ReviewVote.addHook('beforeCreate', async (vote, options) => {
  const existingVote = await ReviewVote.findOne({
    where: {
      reviewId: vote.reviewId,
      userId: vote.userId
    }
  });
  
  if (existingVote) {
    throw new Error('User has already voted on this review');
  }
});

module.exports = ReviewVote;
