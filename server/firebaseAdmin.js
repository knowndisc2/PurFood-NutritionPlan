const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Supports either GOOGLE_APPLICATION_CREDENTIALS file path or SERVICE_ACCOUNT env JSON
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('[Firebase Admin] ✓ Initialized with service account key.');
  } catch (e) {
    console.error('[Firebase Admin] ✗ Failed to initialize with service account key:', e.message);
    console.warn('[Firebase Admin] Falling back to Application Default Credentials.');
    admin.initializeApp();
  }
}

// Log emulator usage for visibility during development
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // eslint-disable-next-line no-console
  console.log(`[Firebase Admin] Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

module.exports = admin;
