const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
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
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  newMessage: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  newReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reviewResponse: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  profileUpdates: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  marketingEmails: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailFrequency: {
    type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
    defaultValue: 'immediate'
  }
});

module.exports = NotificationPreference;
