import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Grid,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ConversationList from '../components/messages/ConversationList';
import MessageList from '../components/messages/MessageList';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const MessagingPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/api/messages/conversations');
        setConversations(response.data.conversations);
        if (response.data.conversations.length > 0 && !selectedUserId) {
          setSelectedUserId(response.data.conversations[0].otherUser.id);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
    // Set up periodic refresh
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUserId) return;

      setIsLoadingMessages(true);
      try {
        const response = await axios.get(
          `/api/messages/conversation/${selectedUserId}?page=${currentPage}`
        );
        if (currentPage === 1) {
          setMessages(response.data.messages);
        } else {
          setMessages((prev) => [...response.data.messages, ...prev]);
        }
        setHasMoreMessages(response.data.pagination.hasMore);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUserId, currentPage]);

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentPage(1);
    setMessages([]);
    setHasMoreMessages(true);
  };

  const handleLoadMoreMessages = () => {
    if (!isLoadingMessages && hasMoreMessages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedUserId) return;

    try {
      const response = await axios.post('/api/messages', {
        receiverId: selectedUserId,
        content,
      });

      setMessages((prev) => [response.data.data, ...prev]);

      // Update conversation list
      const updatedConversations = conversations.map((conv) => {
        if (conv.otherUser.id === selectedUserId) {
          return {
            ...conv,
            latestMessage: {
              content,
              createdAt: new Date().toISOString(),
            },
          };
        }
        return conv;
      });
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const selectedConversation = conversations.find(
    (conv) => conv.otherUser.id === selectedUserId
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('messages.title')}
      </Typography>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: selectedUserId && isMobile ? 'none' : 'block',
            height: '100%',
          }}
        >
          <ConversationList
            conversations={conversations}
            selectedUserId={selectedUserId || undefined}
            onSelectConversation={handleSelectConversation}
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: !selectedUserId && isMobile ? 'none' : 'block',
            height: '100%',
          }}
        >
          {selectedUserId && selectedConversation ? (
            <MessageList
              messages={messages}
              otherUser={selectedConversation.otherUser}
              isLoading={isLoadingMessages}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMoreMessages}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography color="text.secondary">
                {t('messages.selectConversation')}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default MessagingPage;
