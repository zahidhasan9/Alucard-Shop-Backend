 import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import transporter from './emailsender.js';

export const generateHashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (currentPassword, storedPassword) => {
  return bcrypt.compare(currentPassword, storedPassword);
};

export const verifyEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const otpStore = new Map();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured.');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
};

export const checkOTP = (email, userProvidedOtp) => {
  const otpEntry = otpStore.get(email);

  if (!otpEntry) {
    return 'OTP not found or expired';
  }

  if (Date.now() > otpEntry.expiresAt) {
    otpStore.delete(email);
    return 'OTP expired';
  }

  if (String(userProvidedOtp) === String(otpEntry.otp)) {
    otpStore.delete(email);
    return 'success';
  }

  return 'failed';
};

export const removeFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};