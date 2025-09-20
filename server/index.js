require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const admin = require('./firebaseAdmin');
// const { router: sessionRouter } = require('./session');

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

// Mount session routes
// app.use(sessionRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/api/test-auth', async (req, res) => {
  try {
    // Test if Firebase Admin is working
    const testToken = req.headers.authorization?.replace('Bearer ', '');
    if (testToken) {
      const decoded = await admin.auth().verifyIdToken(testToken);
      return res.json({ success: true, uid: decoded.uid, message: 'Token verified successfully' });
    } else {
      return res.status(400).json({ error: 'No token provided' });
    }
  } catch (e) {
    console.error('Test auth failed:', e);
    return res.status(401).json({ error: 'Token verification failed', details: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Firebase ID token verification middleware
async function fbAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    console.log('[Auth] Authorization header:', authHeader.substring(0, 20) + '...');

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      console.log('[Auth] No token found in authorization header');
      return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }

    console.log('[Auth] Verifying token...');
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('[Auth] Token verified successfully for user:', decoded.uid);
    req.fbUid = decoded.uid;
    next();
  } catch (e) {
    console.error('[Auth] Token verification failed:', e.message);
    console.error('[Auth] Error stack:', e.stack);
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
    console.log('[Meals] Fetch request received for user:', req.fbUid);
    const limit = parseInt(req.query.limit) || 50;
    console.log('[Meals] Query limit:', limit);

    const db = admin.firestore();
    console.log('[Meals] Firestore instance created');

    const collectionRef = db.collection('users').doc(req.fbUid).collection('meals');
    console.log('[Meals] Collection reference created');

    const query = collectionRef.orderBy('createdAt', 'desc').limit(limit);
    console.log('[Meals] Query created');

    const snap = await query.get();
    console.log('[Meals] Query executed, documents found:', snap.size);

    const items = snap.docs.map(d => {
      const data = d.data();
      console.log('[Meals] Document:', d.id, 'createdAt:', data.createdAt);
      return { id: d.id, ...data };
    });

    console.log('[Meals] Returning', items.length, 'meal items');
    return res.json(items);
  } catch (e) {
    console.error('[Meals] Fetch failed:', e);
    console.error('[Meals] Error stack:', e.stack);
    return res.status(500).json({ error: 'Failed to fetch meals', details: e.message });
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
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✓`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
