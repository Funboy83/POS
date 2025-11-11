import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableNetwork } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDqAy8d-b9fL8Sau8pmA-H6IKABDbh1QAU",
  authDomain: "studio-5302783866-e8cbe.firebaseapp.com",
  projectId: "studio-5302783866-e8cbe",
  storageBucket: "studio-5302783866-e8cbe.firebasestorage.app",
  messagingSenderId: "712849024007",
  appId: "1:712849024007:web:227b92c686fc3007f3f6a2"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

const isConfigured = Object.values(firebaseConfig).every(
  (value) => value !== undefined && value !== null && value !== ''
);

if (isConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    
    if (typeof window !== 'undefined') {
      enableNetwork(db);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase configuration is incomplete.');
}

export { db, isConfigured, app, auth };
