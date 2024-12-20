const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Message extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id'
        }
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 5000]
        }
      },
      status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read'),
        defaultValue: 'sent'
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      attachments: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text'
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      threadId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'MessageThreads',
          key: 'id'
        }
      },
      isThreadReply: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      reactionSummary: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
          const rawValue = this.getDataValue('reactionSummary');
          return rawValue || {};
        }
      },
      searchVector: {
        type: DataTypes.TSVECTOR,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Message',
      hooks: {
        afterCreate: async (message, options) => {
          const websocketService = require('../services/websocket');
          
          // Notify recipient of new message
          websocketService.sendToUser(message.recipientId, {
            type: 'NEW_MESSAGE',
            payload: message
          });
          
          // Mark as delivered if recipient is online
          if (websocketService.isUserOnline(message.recipientId)) {
            await message.update({
              status: 'delivered',
              deliveredAt: new Date()
            });
            
            // Notify sender of delivery status
            websocketService.sendToUser(message.senderId, {
              type: 'MESSAGE_DELIVERED',
              payload: {
                messageId: message.id,
                deliveredAt: message.deliveredAt
              }
            });
          }
        },
        beforeCreate: async (message, options) => {
          if (message.content) {
            const searchableContent = [
              message.content,
              message.metadata.title || '',
              message.metadata.tags?.join(' ') || ''
            ].join(' ');

            await sequelize.query(
              'SELECT to_tsvector(\'english\', ?) as vector',
              {
                bind: [searchableContent],
                type: sequelize.QueryTypes.SELECT
              }
            ).then(([{vector}]) => {
              message.searchVector = vector;
            });
          }
        }
      }
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { as: 'Sender', foreignKey: 'senderId' });
    this.belongsTo(models.User, { as: 'Recipient', foreignKey: 'recipientId' });
    this.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
    this.belongsTo(models.MessageThread, { foreignKey: 'threadId' });
  }

  async createThread() {
    const MessageThread = require('./MessageThread');
    
    const thread = await MessageThread.create({
      parentMessageId: this.id,
      participantIds: [this.senderId, this.recipientId]
    });
    
    await this.update({ threadId: thread.id });
    return thread;
  }

  async updateReactionSummary() {
    const MessageReaction = require('./MessageReaction');
    
    const reactions = await MessageReaction.findAll({
      where: { messageId: this.id },
      attributes: [
        'emoji',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['emoji']
    });
    
    const summary = {};
    reactions.forEach(reaction => {
      summary[reaction.emoji] = reaction.get('count');
    });
    
    await this.update({ reactionSummary: summary });
  }
}

Message.init(sequelize);

module.exports = Message;
