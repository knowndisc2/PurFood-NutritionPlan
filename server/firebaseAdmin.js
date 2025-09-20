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
      // Try multiple path resolution strategies
      let resolvedPath = path.resolve(__dirname, saPath);
      console.log('[Firebase Admin] Trying path resolution strategy 1:', resolvedPath);

      if (fs.existsSync(resolvedPath)) {
        serviceAccount = require(resolvedPath);
        console.log('[Firebase Admin] ✓ Successfully loaded service account from:', resolvedPath);
        console.log('[Firebase Admin] ✓ Service account type:', serviceAccount.type);
        console.log('[Firebase Admin] ✓ Service account project_id:', serviceAccount.project_id);
      } else {
        // Try from project root
        resolvedPath = path.resolve(process.cwd(), saPath);
        console.log('[Firebase Admin] Trying path resolution strategy 2:', resolvedPath);

        if (fs.existsSync(resolvedPath)) {
          serviceAccount = require(resolvedPath);
          console.log('[Firebase Admin] ✓ Successfully loaded service account from:', resolvedPath);
          console.log('[Firebase Admin] ✓ Service account type:', serviceAccount.type);
          console.log('[Firebase Admin] ✓ Service account project_id:', serviceAccount.project_id);
        } else {
          console.error(`[Firebase Admin] ✗ Service account file not found at path: ${resolvedPath}`);
          console.error('[Firebase Admin] Available JSON files in server directory:');
          try {
            fs.readdirSync(__dirname).filter(f => f.endsWith('.json')).forEach(f => {
              console.error(`[Firebase Admin]   - ${f}`);
            });
          } catch (e) {
            console.error('[Firebase Admin] Could not read server directory');
          }
        }
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
