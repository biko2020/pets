const websocketService = require('./websocket');

// Store typing status in memory
const typingStatus = new Map();

// Clean up typing status after timeout
const TYPING_TIMEOUT = 5000; // 5 seconds

const typingService = {
  // Start typing indicator
  startTyping(userId, conversationId) {
    const key = `${conversationId}:${userId}`;
    const existingTimeout = typingStatus.get(key)?.timeout;
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => {
      this.stopTyping(userId, conversationId);
    }, TYPING_TIMEOUT);
    
    typingStatus.set(key, {
      timeout,
      timestamp: Date.now()
    });
    
    // Notify other participants in the conversation
    this.broadcastTypingStatus(userId, conversationId, true);
  },
  
  // Stop typing indicator
  stopTyping(userId, conversationId) {
    const key = `${conversationId}:${userId}`;
    const existing = typingStatus.get(key);
    
    if (existing) {
      clearTimeout(existing.timeout);
      typingStatus.delete(key);
    }
    
    // Notify other participants in the conversation
    this.broadcastTypingStatus(userId, conversationId, false);
  },
  
  // Check if user is typing
  isTyping(userId, conversationId) {
    const key = `${conversationId}:${userId}`;
    const status = typingStatus.get(key);
    
    if (!status) return false;
    
    // Check if typing status is still valid
    const isValid = (Date.now() - status.timestamp) < TYPING_TIMEOUT;
    
    if (!isValid) {
      this.stopTyping(userId, conversationId);
      return false;
    }
    
    return true;
  },
  
  // Get all users typing in a conversation
  getTypingUsers(conversationId) {
    const typingUsers = [];
    
    for (const [key, status] of typingStatus.entries()) {
      const [convId, userId] = key.split(':');
      
      if (convId === conversationId && this.isTyping(userId, conversationId)) {
        typingUsers.push(userId);
      }
    }
    
    return typingUsers;
  },
  
  // Broadcast typing status to conversation participants
  async broadcastTypingStatus(userId, conversationId, isTyping) {
    const Conversation = require('../models/Conversation');
    const User = require('../models/User');
    
    try {
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{
          model: User,
          as: 'participants'
        }]
      });
      
      if (!conversation) return;
      
      // Get user info for the typing indicator
      const typingUser = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName']
      });
      
      // Notify all participants except the typing user
      conversation.participants.forEach(participant => {
        if (participant.id !== userId) {
          websocketService.sendToUser(participant.id, {
            type: 'TYPING_INDICATOR',
            payload: {
              conversationId,
              user: typingUser,
              isTyping
            }
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  },
  
  // Clean up typing status for a user (e.g., on disconnect)
  cleanupUser(userId) {
    for (const [key, status] of typingStatus.entries()) {
      if (key.includes(`:${userId}`)) {
        const [conversationId] = key.split(':');
        this.stopTyping(userId, conversationId);
      }
    }
  }
};

module.exports = typingService;
