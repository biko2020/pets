import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Divider,
  Box,
  Paper,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  latestMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedUserId?: string;
  onSelectConversation: (userId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedUserId,
  onSelectConversation,
}) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={2}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {conversations.map((conversation, index) => (
          <React.Fragment key={conversation.otherUser.id}>
            <ListItem
              alignItems="flex-start"
              button
              selected={selectedUserId === conversation.otherUser.id}
              onClick={() => onSelectConversation(conversation.otherUser.id)}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conversation.unreadCount}
                  color="primary"
                  invisible={conversation.unreadCount === 0}
                >
                  <Avatar>
                    {conversation.otherUser.firstName[0]}
                    {conversation.otherUser.lastName[0]}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between">
                    <Typography component="span" variant="subtitle1">
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {formatDistanceToNow(new Date(conversation.latestMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {conversation.latestMessage.content}
                  </Typography>
                }
              />
            </ListItem>
            {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
        {conversations.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography align="center" color="text.secondary">
                  {t('messages.noConversations')}
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default ConversationList;
