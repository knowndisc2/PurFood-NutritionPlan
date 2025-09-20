import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_mL7IrpkpLUjywnGmOxLDwO85a-11vbM",
  authDomain: "general-nutrition-manager.firebaseapp.com",
  projectId: "general-nutrition-manager",
  // Use the correct default bucket domain for Firebase Storage
  storageBucket: "general-nutrition-manager.appspot.com",
  messagingSenderId: "925229683098",
  appId: "1:925229683098:web:139dfcef86e7020c1a2a23",
  measurementId: "G-MFHW5E5J0C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword };
