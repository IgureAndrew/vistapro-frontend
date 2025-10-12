const messagingService = require('../services/messagingService');
const { getIo } = require('../socket');

/**
 * Get contacts for the authenticated user
 */
const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await messagingService.getContacts(userId, userRole);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getContacts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get conversation between authenticated user and a contact
 */
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid contact ID is required'
      });
    }

    const result = await messagingService.getConversation(userId, parseInt(contactId));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getConversation controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Send a message
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const result = await messagingService.sendMessage(userId, receiverId, message.trim());
    
    if (result.success) {
      // Emit real-time message to both users
      try {
        const io = getIo();
        const roomName = `conversation_${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;
        
        // Get sender info for the real-time message
        const { pool } = require('../config/database');
        const senderQuery = await pool.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [userId]
        );
        const sender = senderQuery.rows[0];
        
        const realTimeMessage = {
          ...result.data,
          sender_name: `${sender.first_name} ${sender.last_name}`,
          is_sent: false // For the receiver
        };
        
        io.to(roomName).emit('new_message', realTimeMessage);
        console.log(`📨 Real-time message sent to room: ${roomName}`);
      } catch (socketError) {
        console.error('Socket error:', socketError);
        // Don't fail the request if socket fails
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Mark messages as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid contact ID is required'
      });
    }

    const result = await messagingService.markAsRead(userId, parseInt(contactId));
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in markAsRead controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get unread message count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await messagingService.getUnreadCount(userId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getUnreadCount controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getContacts,
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount
};
