const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageReaction = sequelize.define('MessageReaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  messageId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Messages',
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
  emoji: {
    type: DataTypes.STRING(8),
    allowNull: false,
    validate: {
      // Validate that it's a single emoji
      is: /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1}$/
    }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['messageId', 'userId', 'emoji']
    }
  ]
});

// Hook to notify users when a reaction is added
MessageReaction.addHook('afterCreate', async (reaction, options) => {
  const websocketService = require('../services/websocket');
  const Message = require('./Message');
  const User = require('./User');

  try {
    const message = await Message.findByPk(reaction.messageId);
    const user = await User.findByPk(reaction.userId, {
      attributes: ['id', 'firstName', 'lastName', 'avatar']
    });

    // Notify message sender and recipient
    [message.senderId, message.recipientId].forEach(userId => {
      if (userId !== reaction.userId) {
        websocketService.sendToUser(userId, {
          type: 'MESSAGE_REACTION',
          payload: {
            messageId: message.id,
            reaction: reaction.emoji,
            user
          }
        });
      }
    });
  } catch (error) {
    console.error('Error sending reaction notification:', error);
  }
});

module.exports = MessageReaction;
