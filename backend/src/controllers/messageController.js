const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, subject, content, parentMessageId } = req.body;

    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      subject,
      content,
      parentMessageId
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get latest message from each conversation
    const conversations = await Message.findAll({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('id')), 'latestMessageId'],
        'senderId',
        'receiverId'
      ],
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      group: [
        sequelize.literal(`LEAST(senderId, receiverId), GREATEST(senderId, receiverId)`),
        'senderId',
        'receiverId'
      ],
      order: [[sequelize.literal('latestMessageId'), 'DESC']],
      limit,
      offset,
      raw: true
    });

    // Get the actual messages and user details
    const conversationDetails = await Promise.all(conversations.map(async (conv) => {
      const latestMessage = await Message.findByPk(conv.latestMessageId);
      const otherUserId = conv.senderId === userId ? conv.receiverId : conv.senderId;
      const otherUser = await User.findByPk(otherUserId, {
        attributes: ['id', 'firstName', 'lastName']
      });

      const unreadCount = await Message.count({
        where: {
          receiverId: userId,
          senderId: otherUserId,
          isRead: false
        }
      });

      return {
        otherUser,
        latestMessage,
        unreadCount
      };
    }));

    const totalConversations = await Message.count({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', 
          sequelize.literal(`LEAST(senderId, receiverId), GREATEST(senderId, receiverId)`)
        )), 'count']
      ],
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      raw: true
    });

    const totalPages = Math.ceil(totalConversations / limit);

    res.json({
      conversations: conversationDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalConversations,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: otherUserId
          },
          {
            senderId: otherUserId,
            receiverId: userId
          }
        ]
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    const totalPages = Math.ceil(messages.count / limit);

    res.json({
      messages: messages.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: messages.count,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversation', error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: {
        id,
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};
