const express = require('express');
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, generateToken, authMiddleware } = require('./auth');

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, age, weight, height, activityLevel, dietaryRestrictions } = req.body;
    
    const user = await registerUser({
      email,
      password,
      firstName,
      lastName,
      age,
      weight,
      height,
      activityLevel,
      dietaryRestrictions
    });
    
    const token = generateToken(user);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({
      success: true,
      user,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    const user = await loginUser(email, password);
    const token = generateToken(user);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      user,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = { app, authMiddleware };
