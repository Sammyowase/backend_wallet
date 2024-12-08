import express from 'express';
import { check } from 'express-validator';
import { registerUser, loginUser, verifyCode } from '../controllers/authControllers';

const router = express.Router();

// User Registration
router.post(
  '/register',
  [
    check('email').isEmail().withMessage('Please provide a valid email'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  registerUser
);

// User Login
router.post('/login', loginUser);

// Email Verification
router.post('/verify-code', verifyCode);

export default router;
