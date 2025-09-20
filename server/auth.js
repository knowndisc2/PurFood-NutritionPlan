const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { findUserByEmail, createUser } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SALT_ROUNDS = 12;

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8 && 
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const registerUser = async (userData) => {
  const { email, password, firstName, lastName } = userData;
  
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
  }
  
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }
  
  const hashedPassword = await hashPassword(password);
  
  const newUser = createUser({
    email,
    password: hashedPassword,
    firstName: firstName || '',
    lastName: lastName || ''
  });
  
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const loginUser = async (email, password) => {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  authMiddleware
};
