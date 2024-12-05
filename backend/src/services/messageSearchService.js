const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Message = require('../models/Message');
const User = require('../models/User');

const messageSearchService = {
  /**
   * Search messages using full-text search
   * @param {string} query Search query
   * @param {Object} options Search options
   * @returns {Promise<Array>} Search results
   */
  async searchMessages(query, options = {}) {
    const {
      userId,
      conversationId,
      limit = 20,
      offset = 0,
      startDate,
      endDate,
      messageType
    } = options;

    // Convert query to tsquery format
    const tsquery = query
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/)
      .join(' & ');

    const whereClause = {
      [Op.and]: [
        sequelize.literal(`"searchVector" @@ to_tsquery('english', '${tsquery}')`)
      ]
    };

    // Add filters
    if (userId) {
      whereClause[Op.and].push({
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      });
    }

    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: startDate
      };
    }

    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: endDate
      };
    }

    if (messageType) {
      whereClause.messageType = messageType;
    }

    const results = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [
        [sequelize.literal(`ts_rank("searchVector", to_tsquery('english', '${tsquery}'))`), 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset
    });

    // Add highlight snippets
    const messages = await Promise.all(results.rows.map(async (message) => {
      const [[{ headline }]] = await sequelize.query(`
        SELECT ts_headline(
          'english',
          ?,
          to_tsquery('english', ?),
          'StartSel = <mark>, StopSel = </mark>, MaxWords=50, MinWords=20'
        ) as headline
      `, {
        replacements: [message.content, tsquery],
        type: sequelize.QueryTypes.SELECT
      });

      return {
        ...message.toJSON(),
        highlight: headline
      };
    }));

    return {
      messages,
      total: results.count,
      hasMore: offset + limit < results.count
    };
  },

  /**
   * Get message context (messages before and after)
   * @param {string} messageId Target message ID
   * @param {number} context Number of messages to fetch before and after
   * @returns {Promise<Object>} Messages with context
   */
  async getMessageContext(messageId, context = 5) {
    const targetMessage = await Message.findByPk(messageId);
    if (!targetMessage) {
      throw new Error('Message not found');
    }

    const [beforeMessages, afterMessages] = await Promise.all([
      Message.findAll({
        where: {
          conversationId: targetMessage.conversationId,
          createdAt: {
            [Op.lt]: targetMessage.createdAt
          }
        },
        order: [['createdAt', 'DESC']],
        limit: context
      }),
      Message.findAll({
        where: {
          conversationId: targetMessage.conversationId,
          createdAt: {
            [Op.gt]: targetMessage.createdAt
          }
        },
        order: [['createdAt', 'ASC']],
        limit: context
      })
    ]);

    return {
      before: beforeMessages.reverse(),
      target: targetMessage,
      after: afterMessages
    };
  }
};

module.exports = messageSearchService;
