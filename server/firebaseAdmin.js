const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Supports either GOOGLE_APPLICATION_CREDENTIALS file path or SERVICE_ACCOUNT env JSON
if (!admin.apps.length) {
  let serviceAccount;
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (saPath) {
    console.log('[Firebase Admin] Debug: __dirname =', __dirname);
    console.log('[Firebase Admin] Debug: process.cwd() =', process.cwd());
    console.log('[Firebase Admin] Debug: FIREBASE_SERVICE_ACCOUNT_PATH =', saPath);
    console.log('[Firebase Admin] Debug: FIREBASE_SERVICE_ACCOUNT_JSON =', saJson ? '[SET]' : '[NOT SET]');
    try {
      // Build candidate paths to support running from repo root or from server/ directory
      const candidates = [];
      if (path.isAbsolute(saPath)) {
        candidates.push(saPath);
      } else {
        candidates.push(path.resolve(process.cwd(), saPath));
        candidates.push(path.resolve(__dirname, saPath));
        // If path starts with ./server and __dirname already ends with server, try one directory up
        const cleaned = saPath.replace(/^\.\//, '');
        if (cleaned.startsWith('server') && path.basename(__dirname) === 'server') {
          candidates.push(path.resolve(__dirname, '..', path.basename(saPath)));
        }
      }

      console.log('[Firebase Admin] Candidate service account paths:', candidates);
      const found = candidates.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      });

      if (found) {
        serviceAccount = require(found);
        console.log('[Firebase Admin] ✓ Loaded service account from:', found);
        console.log('[Firebase Admin] ✓ Service account project_id:', serviceAccount.project_id);
      } else {
        console.error('[Firebase Admin] ✗ Could not find service account file at any candidate path.');
      }
    } catch (e) {
      console.error('[Firebase Admin] ✗ Error reading service account file from path:', e.message);
      console.error('[Firebase Admin] Error stack:', e.stack);
    }
  } else if (saJson) {
    try {
      serviceAccount = JSON.parse(saJson);
      console.log('[Firebase Admin] Initializing with service account from JSON environment variable.');
    } catch (e) {
      console.error('[Firebase Admin] Error parsing service account JSON from environment variable:', e);
    }
  }

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
      });
      console.log('[Firebase Admin] ✓ Firebase Admin SDK initialized successfully');
    } catch (e) {
      console.error('[Firebase Admin] ✗ Failed to initialize Firebase Admin SDK:', e.message);
    }
  } else {
    console.warn('[Firebase Admin] ⚠ No service account credentials provided. Falling back to Application Default Credentials.');
    console.warn('[Firebase Admin] For local development, it is recommended to set FIREBASE_SERVICE_ACCOUNT_PATH in your .env file.');
    try {
      admin.initializeApp();
      console.log('[Firebase Admin] ✓ Initialized with Application Default Credentials');
    } catch (e) {
      console.error('[Firebase Admin] ✗ Failed to initialize with Application Default Credentials:', e.message);
    }
  }
}

// Log emulator usage for visibility during development
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // eslint-disable-next-line no-console
  console.log(`[Firebase Admin] Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

module.exports = admin;
