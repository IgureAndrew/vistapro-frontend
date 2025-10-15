const { pool } = require('../config/database');

/**
 * Get contacts for a user based on their role and assignments
 * @param {number} userId - The user's ID
 * @param {string} userRole - The user's role
 * @returns {Promise<Object>} Success status and contacts data
 */
const getContacts = async (userId, userRole) => {
  try {
    // First get the user's unique_id
    const userQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    const userUniqueId = userQuery.rows[0].unique_id;

    let query;
    let params = [userId];

    switch (userRole) {
      case 'MasterAdmin':
        // Master Admin can message all users
        query = `
          SELECT DISTINCT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location, u.email
          FROM users u
          WHERE u.id != $1 AND u.role IN ('SuperAdmin', 'Admin', 'Marketer')
          ORDER BY u.role, u.first_name, u.last_name
        `;
        break;

      case 'SuperAdmin':
        // SuperAdmin can message assigned admins and marketers
        query = `
          SELECT DISTINCT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location, u.email
          FROM users u
          WHERE u.id != $1 
            AND ((u.role = 'Admin' AND u.super_admin_id = $1) 
                 OR (u.role = 'Marketer' AND u.super_admin_id = $1))
          ORDER BY u.role, u.first_name, u.last_name
        `;
        break;

      case 'Admin':
        // Admin can message assigned marketers
        query = `
          SELECT DISTINCT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location, u.email
          FROM users u
          WHERE u.id != $1 
            AND u.role = 'Marketer' 
            AND u.admin_id = $1
          ORDER BY u.first_name, u.last_name
        `;
        break;

      case 'Marketer':
        // Marketer can message their assigned admin and superadmin
        query = `
          SELECT DISTINCT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location, u.email
          FROM users u
          WHERE u.id != $1 
            AND ((u.role = 'Admin' AND u.id = (SELECT admin_id FROM users WHERE id = $1)) 
                 OR (u.role = 'SuperAdmin' AND u.id = (SELECT super_admin_id FROM users WHERE id = $1)))
          ORDER BY u.role, u.first_name, u.last_name
        `;
        break;

      default:
        return { success: false, message: 'Invalid user role' };
    }

    const result = await pool.query(query, params);
    
    return {
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        unique_id: user.unique_id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        location: user.location,
        email: user.email
      }))
    };
  } catch (error) {
    console.error('Error getting contacts:', error);
    return { success: false, message: 'Failed to fetch contacts' };
  }
};

/**
 * Get conversation between two users
 * @param {number} userId - Current user's ID
 * @param {number} contactId - Contact's ID
 * @returns {Promise<Object>} Success status and messages data
 */
const getConversation = async (userId, contactId) => {
  try {
    // Get unique_ids for both users
    const userQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [userId]);
    const contactQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [contactId]);
    
    if (userQuery.rows.length === 0 || contactQuery.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const userUniqueId = userQuery.rows[0].unique_id;
    const contactUniqueId = contactQuery.rows[0].unique_id;

    const query = `
      SELECT m.id, m.sender, m.recipient, m.message, m.created_at, m.is_read,
             s.first_name as sender_name, s.last_name as sender_last_name,
             r.first_name as recipient_name, r.last_name as recipient_last_name
      FROM messages m
      JOIN users s ON m.sender = s.unique_id
      JOIN users r ON m.recipient = r.unique_id
      WHERE (m.sender = $1 AND m.recipient = $2) 
         OR (m.sender = $2 AND m.recipient = $1)
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [userUniqueId, contactUniqueId]);
    
    return {
      success: true,
      data: result.rows.map(msg => ({
        id: msg.id,
        sender_id: msg.sender,
        receiver_id: msg.recipient,
        message: msg.message,
        created_at: msg.created_at,
        read_at: msg.is_read ? msg.created_at : null,
        sender_name: `${msg.sender_name} ${msg.sender_last_name}`,
        receiver_name: `${msg.recipient_name} ${msg.recipient_last_name}`,
        is_sent: msg.sender === userUniqueId
      }))
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { success: false, message: 'Failed to fetch conversation' };
  }
};

/**
 * Send a message
 * @param {number} senderId - Sender's ID
 * @param {number} receiverId - Receiver's ID
 * @param {string} message - Message content
 * @returns {Promise<Object>} Success status and message data
 */
const sendMessage = async (senderId, receiverId, message) => {
  try {
    // Get unique_ids for both users
    const senderQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [senderId]);
    const receiverQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [receiverId]);
    
    if (senderQuery.rows.length === 0 || receiverQuery.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const senderUniqueId = senderQuery.rows[0].unique_id;
    const receiverUniqueId = receiverQuery.rows[0].unique_id;

    const query = `
      INSERT INTO messages (sender, recipient, message, message_type, is_read, is_delivered)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, sender, recipient, message, created_at, is_read
    `;

    const result = await pool.query(query, [senderUniqueId, receiverUniqueId, message, 'text', false, false]);
    const newMessage = result.rows[0];

    return {
      success: true,
      data: {
        id: newMessage.id,
        sender_id: newMessage.sender,
        receiver_id: newMessage.recipient,
        message: newMessage.message,
        created_at: newMessage.created_at,
        read_at: newMessage.is_read ? newMessage.created_at : null
      }
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: 'Failed to send message' };
  }
};

/**
 * Mark messages as read
 * @param {number} userId - User's ID
 * @param {number} contactId - Contact's ID
 * @returns {Promise<Object>} Success status
 */
const markAsRead = async (userId, contactId) => {
  try {
    // Get unique_ids for both users
    const userQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [userId]);
    const contactQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [contactId]);
    
    if (userQuery.rows.length === 0 || contactQuery.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const userUniqueId = userQuery.rows[0].unique_id;
    const contactUniqueId = contactQuery.rows[0].unique_id;

    const query = `
      UPDATE messages 
      SET is_read = true, updated_at = NOW()
      WHERE sender = $1 AND recipient = $2 AND is_read = false
    `;

    await pool.query(query, [contactUniqueId, userUniqueId]);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, message: 'Failed to mark messages as read' };
  }
};

/**
 * Get unread message count for a user
 * @param {number} userId - User's ID
 * @returns {Promise<Object>} Success status and unread count
 */
const getUnreadCount = async (userId) => {
  try {
    // Get user's unique_id
    const userQuery = await pool.query('SELECT unique_id FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    const userUniqueId = userQuery.rows[0].unique_id;

    const query = `
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE recipient = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userUniqueId]);
    
    return {
      success: true,
      data: { unread_count: parseInt(result.rows[0].unread_count) }
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, message: 'Failed to get unread count' };
  }
};

module.exports = {
  getContacts,
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount
};
