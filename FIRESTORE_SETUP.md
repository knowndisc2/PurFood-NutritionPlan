# Firestore Setup Instructions

## 1. Set Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and paste this EXACT rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own meal history
    match /users/{userId}/mealHistory/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read/write their own user profile and settings
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish** after pasting the rules.

## 2. Verify Your Environment

Your `.env` file should contain (already correct):
```
REACT_APP_FIREBASE_PROJECT_ID=general-nutrition-manager
REACT_APP_FIREBASE_API_KEY=AIzaSyB_mL7IrpkpLUjywnGmOxLDwO85a-11vbM
REACT_APP_FIREBASE_AUTH_DOMAIN=general-nutrition-manager.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=general-nutrition-manager.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=925229683098
REACT_APP_FIREBASE_APP_ID=1:925229683098:web:139dfcef86e7020c1a2a23
REACT_APP_FIREBASE_MEASUREMENT_ID=G-MFHW5E5J0C
```

## 3. Firestore Document Schema

When you generate a meal plan, it creates this document structure:

```
users/{userId}/mealHistory/{autoId}
{
  createdAt: Timestamp,
  rawText: string,
  userId: string,
  totals: {
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  },
  plans: [
    {
      id: string,
      name: string,
      foodItems: string,
      calories: number,
      protein: number,
      carbs: number,
      fat: number
    }
  ]
}
```

## 4. Testing Steps

1. **Restart your dev server** after any `.env` changes
2. **Sign in** to the app (required for Firestore access)
3. **Generate a meal plan** - check browser console for logs
4. **Check Firestore Console** at: users → {your-uid} → mealHistory
5. **Check the app's Meal History panel** for live updates

## 5. Troubleshooting

If you still get permission errors:

1. **Verify you're signed in** - check browser console for user UID
2. **Check the correct Firebase project** - should be "general-nutrition-manager"
3. **Ensure Firestore is enabled** in Native mode (not Realtime Database)
4. **Check browser console** for detailed error messages

## 6. Quick Test

Open browser DevTools Console and run this test:

```javascript
// Test Firestore write
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();
const user = auth.currentUser;

if (!user) {
  console.log('❌ Not signed in');
} else {
  console.log('✅ Signed in as:', user.uid);
  
  addDoc(collection(db, 'users', user.uid, 'mealHistory'), {
    createdAt: serverTimestamp(),
    rawText: 'Test entry',
    totals: { calories: 100, protein: 10, carbs: 15, fat: 5 },
    plans: [],
    userId: user.uid
  }).then((docRef) => {
    console.log('✅ Test write successful! Document ID:', docRef.id);
  }).catch((error) => {
    console.log('❌ Test write failed:', error.message);
  });
}
```
