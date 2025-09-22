const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Supports environment variables for serverless deployment
if (!admin.apps.length) {
  try {
    // Try environment variable first (for Vercel/serverless)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log('[Firebase Admin] ✓ Initialized with environment variable.');
    } else {
      // Fallback to local file (for development)
      const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        console.log('[Firebase Admin] ✓ Initialized with service account key.');
      } else {
        console.warn('[Firebase Admin] No credentials found, using Application Default Credentials');
        admin.initializeApp();
      }
    }
  } catch (e) {
    console.error('[Firebase Admin] ✗ Error initializing:', e.message);
    console.warn('[Firebase Admin] Falling back to Application Default Credentials.');
    try {
      admin.initializeApp();
    } catch (fallbackError) {
      console.error('[Firebase Admin] ✗ Fallback failed:', fallbackError.message);
    }
  }
}
// Log emulator usage for visibility during development
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // eslint-disable-next-line no-console
  console.log(`[Firebase Admin] Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

module.exports = admin;
