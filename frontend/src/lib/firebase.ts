// Firebase Configuration for FarmsKing
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Note: Analytics is not supported in React Native, only web
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4ZPSAJcbb7xHzPdWlmqNo0yX2rnLeIgo",
  authDomain: "farmsking-510606.firebaseapp.com",
  projectId: "farmsking-510606",
  storageBucket: "farmsking-510606.firebasestorage.app",
  messagingSenderId: "742233980320",
  appId: "1:742233980320:web:baebebe2a59b7a4857b8c5",
  measurementId: "G-42NJGE0F0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
