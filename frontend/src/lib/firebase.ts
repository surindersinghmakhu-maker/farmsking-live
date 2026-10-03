// Firebase Configuration for FarmsKing
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Note: Analytics is not supported in React Native, only web
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6QN0ziIfdBr0_M2tRJAnPA-UR7tSbODE",
  authDomain: "farmsking-f1d0d.firebaseapp.com",
  projectId: "farmsking-f1d0d",
  storageBucket: "farmsking-f1d0d.firebasestorage.app",
  messagingSenderId: "557259263742",
  appId: "1:557259263742:web:72855ee0ecafdabeb11faf",
  measurementId: "G-CZV16L4TBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
