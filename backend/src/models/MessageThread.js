const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageThread = sequelize.define('MessageThread', {
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
    defaultValue: []
  }
});

// Update thread statistics when a reply is added
MessageThread.addHook('beforeUpdate', async (thread, options) => {
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
  
  thread.participantIds = participants.map(p => p.senderId);
});

module.exports = MessageThread;
