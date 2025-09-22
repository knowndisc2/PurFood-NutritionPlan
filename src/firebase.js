import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB_mL7IrpkpLUjywnGmOxLDwO85a-11vbM",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "general-nutrition-manager.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "general-nutrition-manager",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "general-nutrition-manager.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "925229683098",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:925229683098:web:139dfcef86e7020c1a2a23",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MFHW5E5J0C"
};

// Debug logging for production
if (process.env.NODE_ENV === 'production') {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
    authDomain: firebaseConfig.authDomain ? 'Set' : 'Missing',
    projectId: firebaseConfig.projectId ? 'Set' : 'Missing'
  });
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, db };
