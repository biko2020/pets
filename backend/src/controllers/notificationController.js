const Notification = require('../models/Notification');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: {
        userId: req.user.id
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const unreadCount = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    const totalPages = Math.ceil(notifications.count / limit);

    res.json({
      notifications: notifications.rows,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: notifications.count,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          id: {
            [Op.in]: notificationIds
          },
          userId: req.user.id
        }
      }
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Notification.destroy({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!result) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.destroy({
      where: {
        userId: req.user.id
      }
    });

    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
  }
};
