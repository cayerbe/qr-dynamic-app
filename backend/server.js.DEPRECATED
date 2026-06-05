const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
initializeApp({
  credential: cert(serviceAccount)
});

// Get Firestore instance
const db = getFirestore();

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER
};

// Check email configuration
if (!emailConfig.user || !emailConfig.pass) {
  console.warn('WARNING: Email configuration is incomplete. Email verification will not work.');
}

// Create email transporter
const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  host: 'smtp.gmail.com',  // Add this line
  port: 587,               // Add this line
  secure: false,           // Add this line
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass
  }
});

// Test email configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Server error occurred', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
};

// Validate request body middleware
const validateRegistrationInput = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = {};

  if (!username || username.trim() === '') {
    errors.username = 'Username is required';
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Valid email is required';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, token, userId) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const verificationUrl = `${clientUrl}/verify-email?token=${token}&userId=${userId}`;
  
  const mailOptions = {
    from: emailConfig.from,
    to: email,
    subject: 'Email Verification - Dynamic QR Code Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Dynamic QR Code Platform!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>Dynamic QR Code Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Register endpoint
app.post('/api/register', validateRegistrationInput, async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hour expiration
    
    // Create new user in Firestore
    const userRef = db.collection('users').doc();
    const userId = userRef.id;
    
    await userRef.set({
      id: userId,
      username,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationExpires: verificationExpires.toISOString(),
      createdAt: new Date().toISOString()
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, userId);
    
    // Generate JWT token (but mark it as unverified)
    const token = jwt.sign(
      { 
        id: userId, 
        username,
        email,
        isVerified: false
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return success with token
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      emailVerificationSent: emailSent,
      token,
      user: {
        id: userId,
        username,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        isVerified: false
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify email endpoint
app.get('/api/verify-email', async (req, res, next) => {
  try {
    const { token, userId } = req.query;
    
    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing verification parameters' });
    }
    
    // Find the user
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if already verified
    if (userData.isVerified) {
      return res.status(400).json({ error: 'Email already verified', alreadyVerified: true });
    }
    
    // Check token validity
    if (userData.verificationToken !== token) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    // Check token expiration
    const verificationExpires = new Date(userData.verificationExpires);
    if (verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired', expired: true });
    }
    
    // Update user as verified
    await db.collection('users').doc(userId).update({
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      updatedAt: new Date().toISOString()
    });
    
    // Generate new token with verified status
    const newToken = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username,
        email: userData.email,
        isVerified: true
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return res.status(200).json({
      message: 'Email verified successfully',
      token: newToken,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        isVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email endpoint
app.post('/api/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find the user
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      // For security reasons, don't reveal if the email exists or not
      return res.status(200).json({ message: 'If your email exists in our system, a verification email has been sent.' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if already verified
    if (userData.isVerified) {
      return res.status(400).json({ error: 'Email already verified', alreadyVerified: true });
    }
    
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hour expiration
    
    // Update user with new verification token
    await db.collection('users').doc(userDoc.id).update({
      verificationToken,
      verificationExpires: verificationExpires.toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, userDoc.id);
    
    return res.status(200).json({
      message: 'If your email exists in our system, a verification email has been sent.',
      emailSent
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint with verification check
app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user in Firestore
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const userData = userSnapshot.docs[0].data();
    
    // Check password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check if user email is verified
    if (!userData.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified', 
        emailVerified: false,
        email: userData.email
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username, 
        email: userData.email,
        isVerified: true
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return success with token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        isVerified: userData.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

// Authentication middleware - updated to check verified status
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified', emailVerified: false });
    }
    
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Don't return the password
    const { password, verificationToken, verificationExpires, ...userWithoutPassword } = userData;
    
    res.json({
      message: 'Profile data retrieved successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

// Check email endpoint
app.get('/api/check-email', async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    
    res.json({
      exists: !userSnapshot.empty
    });
  } catch (error) {
    next(error);
  }
});

// Apply error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app; // For testing purposes