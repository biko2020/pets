const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MessageThread extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      parentMessageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Messages',
          key: 'id'
        }
      },
      lastReplyAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      replyCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      participantIds: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          const rawValue = this.getDataValue('participantIds');
          return Array.isArray(rawValue) ? rawValue : [];
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted'),
        defaultValue: 'active'
      },
      lastMessagePreview: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'MessageThread',
      hooks: {
        beforeUpdate: async (thread, options) => {
          const Message = require('./Message');
          
          // Update reply count
          const replyCount = await Message.count({
            where: {
              threadId: thread.id
            }
          });
          
          thread.replyCount = replyCount;
          
          // Update participant list
          const participants = await Message.findAll({
            where: {
              threadId: thread.id
            },
            attributes: ['senderId'],
            group: ['senderId']
          });
          
          thread.participantIds = [...new Set(participants.map(p => p.senderId))];

          // Update last message preview
          const lastMessage = await Message.findOne({
            where: { threadId: thread.id },
            order: [['createdAt', 'DESC']]
          });

          if (lastMessage) {
            thread.lastMessagePreview = lastMessage.content.substring(0, 100);
            thread.lastReplyAt = lastMessage.createdAt;
          }
        },
        afterCreate: async (thread, options) => {
          const websocketService = require('../services/websocket');
          
          // Notify participants about new thread
          thread.participantIds.forEach(userId => {
            websocketService.sendToUser(userId, {
              type: 'NEW_MESSAGE_THREAD',
              payload: thread
            });
          });
        }
      }
    });
  }

  static associate(models) {
    this.belongsTo(models.Message, { 
      as: 'ParentMessage', 
      foreignKey: 'parentMessageId' 
    });
    this.hasMany(models.Message, { 
      foreignKey: 'threadId' 
    });
  }

  // Method to add a participant to the thread
  async addParticipant(userId) {
    const currentParticipants = this.participantIds || [];
    if (!currentParticipants.includes(userId)) {
      const updatedParticipants = [...new Set([...currentParticipants, userId])];
      await this.update({ participantIds: updatedParticipants });
    }
  }

  // Method to remove a participant from the thread
  async removeParticipant(userId) {
    const currentParticipants = this.participantIds || [];
    const updatedParticipants = currentParticipants.filter(id => id !== userId);
    await this.update({ participantIds: updatedParticipants });
  }

  // Method to check if a user is a participant
  isParticipant(userId) {
    return this.participantIds.includes(userId);
  }
}

MessageThread.init(sequelize);

module.exports = MessageThread;
