const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class NotificationPreference extends Model {
  static init(sequelize) {
    return super.init({
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
      pushNotifications: {
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
      bookingNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      marketingEmails: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      emailFrequency: {
        type: DataTypes.ENUM('immediate', 'daily', 'weekly', 'monthly'),
        defaultValue: 'immediate'
      },
      preferredLanguage: {
        type: DataTypes.STRING(10),
        defaultValue: 'en',
        validate: {
          isIn: [['en', 'es', 'fr', 'de', 'zh']]
        }
      }
    }, {
      sequelize,
      modelName: 'NotificationPreference',
      hooks: {
        afterCreate: async (preference, options) => {
          const websocketService = require('../services/websocket');
          
          // Notify user about preference update
          websocketService.sendToUser(preference.userId, {
            type: 'NOTIFICATION_PREFERENCES_UPDATED',
            payload: preference
          });
        }
      }
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
  }

  // Method to toggle a specific notification type
  async toggleNotification(type, enabled) {
    if (this.constructor.validNotificationTypes.includes(type)) {
      await this.update({ [type]: enabled });
      return this;
    }
    throw new Error('Invalid notification type');
  }

  // Method to update email frequency
  async updateEmailFrequency(frequency) {
    const validFrequencies = ['immediate', 'daily', 'weekly', 'monthly'];
    if (validFrequencies.includes(frequency)) {
      await this.update({ emailFrequency: frequency });
      return this;
    }
    throw new Error('Invalid email frequency');
  }

  // Static method to get or create preferences for a user
  static async getOrCreateForUser(userId) {
    const [preference, created] = await this.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        emailNotifications: true,
        pushNotifications: true
      }
    });
    return preference;
  }

  // Static list of valid notification types for validation
  static validNotificationTypes = [
    'emailNotifications',
    'pushNotifications',
    'newMessage',
    'newReview',
    'reviewResponse',
    'profileUpdates',
    'bookingNotifications',
    'marketingEmails'
  ];
}

NotificationPreference.init(sequelize);

module.exports = NotificationPreference;
