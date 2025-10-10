// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  loginUser, 
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword, 
  resetPassword, 
  getCurrentUser 
} = require('../controllers/authController');
const { verifyToken } = require("../middlewares/authMiddleware");

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d).{12,}$/)
      .withMessage('Password must contain at least one letter and one number.'),
    body('first_name').notEmpty().withMessage('First name is required.'),
    body('last_name').notEmpty().withMessage('Last name is required.'),
    body('role').isIn(['Marketer', 'Dealer']).withMessage('Role must be Marketer or Dealer.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    registerUser(req, res, next);
  }
);

// POST /api/auth/login with input validation
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    // Password must be at least 10 characters, contain at least one letter and one number,
    // and can include special characters.
    body('password')
      .isLength({ min: 10 })
      .withMessage('Password must be at least 10 characters long.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d).{10,}$/)
      .withMessage('Password must contain at least one letter and one number.')
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    // If validation passed, call the controller function
    loginUser(req, res, next);
  }
);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  [
    body('email').isEmail().withMessage('A valid email is required.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    resendVerificationEmail(req, res, next);
  }
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('A valid email is required.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    forgotPassword(req, res, next);
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('newPassword')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d).{12,}$/)
      .withMessage('Password must contain at least one letter and one number.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    resetPassword(req, res, next);
  }
);

// GET /api/auth/me
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
