const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query string
        const token = new URL(req.url, 'http://localhost').searchParams.get('token');
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        // Verify token
        const decoded = await promisify(jwt.verify)(
          token,
          process.env.JWT_SECRET
        );

        const userId = decoded.id;
        this.clients.set(userId, ws);

        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('close', () => {
          this.clients.delete(userId);
        });

        // Handle incoming messages
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(userId, message);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Set up heartbeat
    this.heartbeat = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(this.heartbeat);
    });
  }

  handleMessage(userId, message) {
    // Handle different message types
    switch (message.type) {
      case 'read_messages':
        // Handle message read status
        break;
      case 'typing':
        // Handle typing indicators
        this.sendToUser(message.recipientId, {
          type: 'typing',
          senderId: userId,
          isTyping: message.isTyping
        });
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Send notification to specific user
  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, data) {
    userIds.forEach(userId => this.sendToUser(userId, data));
  }

  // Broadcast to all connected clients except sender
  broadcast(senderId, data) {
    this.clients.forEach((client, userId) => {
      if (userId !== senderId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Notification types
  sendMessageNotification(recipientId, data) {
    this.sendToUser(recipientId, {
      type: 'new_message',
      ...data
    });
  }

  sendReviewNotification(userId, data) {
    this.sendToUser(userId, {
      type: 'new_review',
      ...data
    });
  }

  sendReviewResponseNotification(userId, data) {
    this.sendToUser(userId, {
      type: 'review_response',
      ...data
    });
  }
}

let instance = null;

module.exports = {
  initialize: (server) => {
    instance = new WebSocketService(server);
    return instance;
  },
  getInstance: () => {
    if (!instance) {
      throw new Error('WebSocket service not initialized');
    }
    return instance;
  }
};
