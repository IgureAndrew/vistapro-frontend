const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET /api/messages/contacts - Get contacts for the authenticated user
router.get('/contacts', messagingController.getContacts);

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', messagingController.getUnreadCount);

// GET /api/messages/:contactId - Get conversation with a specific contact
router.get('/:contactId', messagingController.getConversation);

// POST /api/messages - Send a message
router.post('/', messagingController.sendMessage);

// PUT /api/messages/:contactId/read - Mark messages as read
router.put('/:contactId/read', messagingController.markAsRead);

module.exports = router;
