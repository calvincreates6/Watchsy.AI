import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1haa4o8Ki-gbPwINu9WdYbCqtOt1uEg0",
  authDomain: "watchsy6.firebaseapp.com",
  projectId: "watchsy6",
  storageBucket: "watchsy6.firebasestorage.app",
  messagingSenderId: "462078176319",
  appId: "1:462078176319:web:4c58f0d1417f54ba0adc8a",
  measurementId: "G-VD263CX2ZR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
