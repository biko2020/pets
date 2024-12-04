const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Send a message
router.post('/', auth, messageController.sendMessage);

// Get all conversations
router.get('/conversations', auth, messageController.getConversations);

// Get conversation with specific user
router.get('/conversation/:otherUserId', auth, messageController.getConversation);

// Delete a message
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;
