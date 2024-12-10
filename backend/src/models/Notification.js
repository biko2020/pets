const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {
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
      type: {
        type: DataTypes.ENUM('message', 'review', 'review_response', 'system', 'booking', 'profile_update'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: DataTypes.DATE
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'low'
      },
      sourceId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the source entity that triggered the notification'
      }
    }, {
      sequelize,
      modelName: 'Notification',
      hooks: {
        afterCreate: async (notification, options) => {
          const websocketService = require('../services/websocket');
          
          // Send real-time notification to the user
          websocketService.sendToUser(notification.userId, {
            type: 'NEW_NOTIFICATION',
            payload: notification
          });
        }
      }
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
  }

  // Mark notification as read
  async markAsRead() {
    if (!this.isRead) {
      await this.update({
        isRead: true,
        readAt: new Date()
      });
    }
  }

  // Create a static method to bulk mark notifications as read
  static async markMultipleAsRead(notificationIds) {
    await this.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { 
        where: { 
          id: notificationIds 
        } 
      }
    );
  }

  // Create a notification for a user
  static async createNotification(userId, notificationData) {
    return this.create({
      userId,
      ...notificationData,
      isRead: false
    });
  }

  // Get unread notifications count
  static async getUnreadCount(userId) {
    return this.count({
      where: { 
        userId, 
        isRead: false 
      }
    });
  }
}

Notification.init(sequelize);

module.exports = Notification;
