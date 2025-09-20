require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const admin = require('./firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 4000;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// In development, disable COOP/COEP to avoid popup/window.close issues with Firebase auth
if ((process.env.NODE_ENV || 'development') !== 'production') {
  app.use(helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
} else {
  app.use(helmet());
}
app.use(cors({
  origin: (origin, cb) => {
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      // Allow all origins in development (covers localhost, 127.0.0.1, LAN IPs)
      return cb(null, true);
    }
    const allowed = ['https://your-domain.com'];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Firebase ID token verification middleware
async function fbAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.fbUid = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// User profile endpoints (GET/PUT on user doc)
app.get('/api/fb/profile', fbAuthMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const doc = await db.collection('users').doc(req.fbUid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User profile not found' });
    return res.json(doc.data());
  } catch (e) {
    console.error('Profile fetch failed', e);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/fb/profile', fbAuthMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const { email, ...profileData } = req.body; // email is not mutable
    await db.collection('users').doc(req.fbUid).set(profileData, { merge: true });
    return res.json({ message: 'Profile updated' });
  } catch (e) {
    console.error('Profile update failed', e);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Meal history endpoints (GET/POST on meals subcollection)
app.post('/api/fb/meals', fbAuthMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const mealData = req.body;
    if (!mealData || !mealData.name) return res.status(400).json({ error: 'Meal data is invalid' });
    const docRef = await db.collection('users').doc(req.fbUid).collection('meals').add({
      ...mealData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: docRef.id });
  } catch (e) {
    console.error('Meal create failed', e);
    return res.status(500).json({ error: 'Failed to save meal' });
  }
});

app.get('/api/fb/meals', fbAuthMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const db = admin.firestore();
    const snap = await db.collection('users').doc(req.fbUid).collection('meals')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(items);
  } catch (e) {
    console.error('Meals fetch failed', e);
    return res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    // Only serve React app for non-API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../build', 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
} else {
  // In development, just handle unknown API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
  
  // For non-API routes in development, let React dev server handle them
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      note: 'In development, make sure React dev server is running on port 3000'
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✓`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
