import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Removed GoogleAuthProvider
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLY_YkLicU_NW46g4oRjQoh73ERVEsWTU",
  authDomain: "academia-cia.firebaseapp.com",
  projectId: "academia-cia",
  storageBucket: "academia-cia.firebasestorage.app",
  messagingSenderId: "233837824736",
  appId: "1:233837824736:web:8bc6581e55ce8b81e29e85",
  measurementId: "G-X6HQBYPYT6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // googleProvider removed