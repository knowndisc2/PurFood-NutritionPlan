const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Supports either GOOGLE_APPLICATION_CREDENTIALS file path or SERVICE_ACCOUNT env JSON
if (!admin.apps.length) {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (saJson) {
    const creds = JSON.parse(saJson);
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  } else {
    // Falls back to application default credentials if available
    admin.initializeApp();
  }
}

// Log emulator usage for visibility during development
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // eslint-disable-next-line no-console
  console.log(`[Firebase Admin] Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

module.exports = admin;
