import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface MessageListProps {
  messages: Message[];
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  otherUser,
  isLoading,
  hasMore,
  onLoadMore,
  onSendMessage,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages.length, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    if (element.scrollTop === 0 && hasMore && !isLoading) {
      onLoadMore();
    }
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          {otherUser.firstName} {otherUser.lastName}
        </Typography>
      </Box>

      <Box
        ref={listRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        )}

        {hasMore && !isLoading && (
          <Box display="flex" justifyContent="center" mb={2}>
            <Button onClick={onLoadMore} variant="text">
              {t('messages.loadMore')}
            </Button>
          </Box>
        )}

        <List>
          {messages.map((message) => {
            const isOwnMessage = message.sender.id === user?.id;

            return (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  {!isOwnMessage && (
                    <Avatar sx={{ mr: 1 }}>
                      {message.sender.firstName[0]}
                      {message.sender.lastName[0]}
                    </Avatar>
                  )}
                  <Box>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                        color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('messages.typeMessage')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isSending}
          size="small"
          sx={{ mr: 1 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={isSending || !newMessage.trim()}
        >
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default MessageList;
