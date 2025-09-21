require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { scrapeMenu } = require('./scripts/menuScrape');
const { generatePlan } = require('./scripts/geminiIntegration');
const admin = require('./firebaseAdmin');
// const { router: sessionRouter } = require('./session');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust the first proxy (fixes express-rate-limit X-Forwarded-For validation)
app.set('trust proxy', 1);

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

// GET variant for quick manual testing in a browser or Postman
// Usage: /api/scrape/menu?mealTime=lunch&date=2025-09-20
app.get('/api/scrape/menu', async (req, res) => {
  try {
    const mealTime = (req.query?.mealTime || 'lunch').toLowerCase();
    const dateParam = req.query?.date || '';
    // Convert YYYY-MM-DD to YYYY/MM/DD for scraper if provided
    const date = dateParam ? String(dateParam).replaceAll('-', '/') : '';

    const data = await scrapeMenu({ mealTime, date });

    const outDir = path.join(process.cwd(), 'src', 'components', 'tmp');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
    const dateForFilename = (date || new Date().toISOString().slice(0,10).replace(/-/g,'/')).replaceAll('/', '-');
    const filename = `purdue_${mealTime.replace(' ', '_')}_${dateForFilename}.json`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return res.json({ file: filePath, data });
  } catch (e) {
    console.error('[Scrape][GET] Endpoint error', e);
    return res.status(500).json({ error: 'Failed to scrape menu (GET)', details: e.message });
  }
});

// Generate plan text using Gemini (Node) with posted goals and optional menu, then save to a text file
app.post('/api/ai/gemini', async (req, res) => {
  try {
    const body = req.body || {};
    const goals = body.goals || body; // support old shape
    const menu = body.menu || null;
    const planTextRaw = await generatePlan({ goals, menu });
    const planText = (planTextRaw || '').trim();
    if (!planText) return res.status(500).json({ error: 'Failed to generate plan text' });

    const outDir = path.join(__dirname, 'outputs');
    try { if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true }); } catch {}
    const filename = `gemini_plan_${Date.now()}.txt`;
    const filePath = path.join(outDir, filename);
    try {
      fs.writeFileSync(filePath, planText, 'utf8');
    } catch (e) {
      console.error('[AI] Failed to save output file:', e);
    }
    return res.json({ planText, file: filename });
  } catch (e) {
    console.error('[AI] Endpoint error:', e);
    return res.status(500).json({ error: 'Failed to run AI integration', details: e.message });
  }
});

// Scrape menu using Node (Puppeteer + Cheerio) and return the parsed JSON and file path
app.post('/api/scrape/menu', async (req, res) => {
  try {
    const mealTime = (req.body?.mealTime || 'lunch').toLowerCase();
    const date = req.body?.date || '';
    const data = await scrapeMenu({ mealTime, date });

    const outDir = path.join(process.cwd(), 'src', 'components', 'tmp');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
    const dateForFilename = (date || new Date().toISOString().slice(0,10).replace(/-/g,'/')).replaceAll('/', '-');
    const filename = `purdue_${mealTime.replace(' ', '_')}_${dateForFilename}.json`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return res.json({ file: filePath, data });
  } catch (e) {
    console.error('[Scrape] Endpoint error', e);
    return res.status(500).json({ error: 'Failed to scrape menu', details: e.message });
  }
});

// Debug endpoint: Firestore smoke test (set/get a doc at a known path)
app.get('/api/debug/firestore/smoke', async (req, res) => {
  try {
    const db = admin.firestore();
    const ts = Date.now();
    const ref = db.collection('_debug').doc('smoke');
    await ref.set({ ok: true, ts }, { merge: true });
    const snap = await ref.get();
    const result = snap.exists ? snap.data() : null;
    res.json({ ok: true, wrote: ts, read: result });
  } catch (e) {
    console.error('[Debug] Firestore smoke failed:', e);
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
});

// Debug endpoint: test user subcollection path
app.get('/api/debug/firestore/user-meals-smoke', async (req, res) => {
  try {
    // Use a provided uid or a placeholder to test path access
    const uid = req.query.uid || 'debug_user_placeholder';
    const db = admin.firestore();
    // Write a meal
    const col = db.collection('users').doc(uid).collection('meals');
    const write = await col.add({ name: 'debug-meal', createdAt: admin.firestore.FieldValue.serverTimestamp() });
    // Query meals
    const q = col.orderBy('createdAt', 'desc').limit(5);
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ ok: true, testWriteId: write.id, count: items.length, items });
  } catch (e) {
    console.error('[Debug] Firestore user-meals smoke failed:', e);
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to verify Firebase Admin project configuration
app.get('/api/debug/firebase', (req, res) => {
  try {
    const appOptions = admin.app().options || {};
    res.json({
      adminOptions: {
        projectId: appOptions.projectId || null,
        databaseURL: appOptions.databaseURL || null,
      },
      env: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || null,
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || null,
        FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null,
        has_SERVICE_ACCOUNT_JSON: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      }
    });
  } catch (e) {
    console.error('[Debug] Firebase inspect failed', e);
    res.status(500).json({ error: 'Debug failed', details: e.message });
  }
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

// Meal history endpoints (GET/POST on meals subcollection in Firestore)
app.post('/api/fb/meals', fbAuthMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const mealData = req.body;
    if (!mealData || !mealData.name) return res.status(400).json({ error: 'Meal data is invalid' });
    const docRef = await db
      .collection('users')
      .doc(req.fbUid)
      .collection('meals')
      .add({
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
    console.error('[Meals] Error code:', e?.code, 'message:', e?.message);
    console.error('[Meals] Error stack:', e.stack);
    // If Firestore returns NOT_FOUND (code 5), treat as empty result instead of 500
    if (e?.code === 5 || /NOT_FOUND/i.test(e?.message || '')) {
      console.warn('[Meals] NOT_FOUND from Firestore; returning empty array');
      return res.json([]);
    }
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
