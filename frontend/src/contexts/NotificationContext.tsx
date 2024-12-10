import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import WebSocketService from '../services/websocket';
import { useAuth } from './AuthContext';
import { useSnackbar, SnackbarKey } from 'notistack';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  type: 'message' | 'review' | 'review_response' | 'system';
  title: string;
  content: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const ws = WebSocketService.getInstance();

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await axios.post('/api/notifications/mark-read', { notificationIds });
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      setUnreadCount(prev =>
        notifications.find(n => n.id === id)?.isRead ? prev : prev - 1
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to WebSocket notifications
      const unsubscribe = ws.onMessage('new_message', (data) => {
        const newNotification = data.notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show snackbar notification
        enqueueSnackbar(newNotification.content, {
          variant: 'info',
          autoHideDuration: 5000,
          action: (key: SnackbarKey) => (
            <React.Fragment>
              <button
                onClick={() => {
                  // Handle notification click (e.g., navigate to message)
                  markAsRead([newNotification.id]);
                }}
              >
                {t('common.view')}
              </button>
            </React.Fragment>
          ),
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
