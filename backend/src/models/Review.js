const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Profiles',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 2000]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  moderationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  helpfulVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unhelpfulVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  response: {
    type: DataTypes.TEXT
  },
  responseDate: {
    type: DataTypes.DATE
  }
});

module.exports = Review;
