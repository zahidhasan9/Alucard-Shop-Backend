import bcrypt from 'bcrypt';
import fs from 'node:fs';
import nodemailer from 'nodemailer';

///HashPassword
export const generateHashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
};

///verifyHashPassword
export const verifyPassword = async (
  currentPassword,
  storedPassword
  
) => {
  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    storedPassword
  );
  return isPasswordMatched;
};
//email verify
export const verifyEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// OTP
const otpStore = new Map();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};
//email sander
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Use 465 for SSL if secure is true
  secure: false, // Set to true for SSL
  auth: {
    user: 'hushibulhaque520@gmail.com',
    pass: 'kpjj scuh ubzv negy', // Replace with your generated App Password
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: 'hushibulhaque520@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
};

export const checkOTP = (email, userProvidedOtp) => {
  const otpEntry = otpStore.get(email);

  if (!otpEntry) {
    return 'OTP not found or expired';
  }

  if (Date.now() > otpEntry.expiresAt) {
    otpStore.delete(email); // Remove expired OTP
    return 'OTP expired';
  }

  if (String(userProvidedOtp) === String(otpEntry.otp)) {
    otpStore.delete(email); // Remove OTP after successful verification
    return 'success';
  } else {
    return 'failed';
  }
};

export const removeFile = (filePath) => {
  fs.unlinkSync(filePath);
};