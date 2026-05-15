import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsREioXO3GXIPy4mRAj0coWbW5WR8pF5U",
  authDomain: "shvorim.firebaseapp.com",
  projectId: "shvorim",
  storageBucket: "shvorim.firebasestorage.app",
  messagingSenderId: "549147972349",
  appId: "1:549147972349:web:79ddee1d2ed7efe83b6494"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);