import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import VerificationCode from '../models/verificationCode';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
const { validationResult } require ('express-validator');

dotenv.config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate random verification code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// User Registration
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const newUser = new User({ email, password });
    await newUser.save();

    // Send verification code to the user's email
    await sendVerificationCode(email);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify.',
      userId: newUser._id, // Optionally include the user ID
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Send Verification Code
const sendVerificationCode = async (email: string): Promise<void> => {
  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

  // Save the verification code to the database
  const verificationCode = new VerificationCode({ email, code, expiresAt });
  await verificationCode.save();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    // Handle error without throwing it, or send a response to indicate failure
    return;
  }
};

// Verify Email Code
export const verifyCode = async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body;

  try {
    const verification = await VerificationCode.findOne({ email }).sort({ createdAt: -1 });

    if (!verification || verification.code !== code) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    if (new Date() > new Date(verification.expiresAt)) {
      res.status(400).json({ message: 'Verification code has expired' });
      return;
    }

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// User Login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
