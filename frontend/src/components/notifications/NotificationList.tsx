import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Box,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationListProps {
  onNotificationClick?: (notification: any) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onNotificationClick }) => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuNotification, setMenuNotification] = React.useState<string | null>(null);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const handleNotificationMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuNotification(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuNotification(null);
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'review':
        return '⭐';
      case 'review_response':
        return '📝';
      default:
        return '🔔';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h6" component="div">
          {t('notifications.title')}
        </Typography>
        <Box>
          <Tooltip title={t('notifications.markAllRead')}>
            <IconButton
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              size="small"
            >
              <DoneAllIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('notifications.menu')}>
            <IconButton
              onClick={handleNotificationMenuClick}
              size="small"
            >
              <Badge badgeContent={unreadCount} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      <List>
        {notifications.map((notification) => (
          <ListItem
            key={notification.id}
            button
            onClick={() => handleNotificationClick(notification)}
            sx={{
              bgcolor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <Box mr={2} fontSize="1.5rem">
              {getNotificationIcon(notification.type)}
            </Box>
            <ListItemText
              primary={notification.title}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {notification.content}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                </React.Fragment>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => handleMenuClick(e, notification.id)}
              >
                <MoreVertIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {notifications.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography align="center" color="text.secondary">
                  {t('notifications.empty')}
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (menuNotification) {
              deleteNotification(menuNotification);
            }
            handleMenuClose();
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notificationMenuAnchorEl}
        open={Boolean(notificationMenuAnchorEl)}
        onClose={handleNotificationMenuClose}
      >
        <MenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
          <DoneAllIcon fontSize="small" sx={{ mr: 1 }} />
          {t('notifications.markAllRead')}
        </MenuItem>
        <MenuItem onClick={clearAll} disabled={notifications.length === 0}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('notifications.clearAll')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationList;
