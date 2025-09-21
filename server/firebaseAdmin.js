const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Supports either GOOGLE_APPLICATION_CREDENTIALS file path or SERVICE_ACCOUNT env JSON
// In server/firebaseAdmin.js
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log('[Firebase Admin] ✓ Initialized with service account key.');
    } else {
      console.warn('[Firebase Admin] Service account key not found, using Application Default Credentials');
      admin.initializeApp();
    }
  } catch (e) {
    console.error('[Firebase Admin] ✗ Error initializing:', e.message);
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
