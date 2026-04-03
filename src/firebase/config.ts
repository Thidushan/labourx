import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBly15cEiImM9pfPc8R8YwePN4LLlOBeds",
  authDomain: "labourx-24c04.firebaseapp.com",
  projectId: "labourx-24c04",
  storageBucket: "labourx-24c04.firebasestorage.app",
  messagingSenderId: "194121668582",
  appId: "1:194121668582:web:b4c56cae1d815b08d16827",
  measurementId: "G-W95THDLK6R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;