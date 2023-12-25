import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";

import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  QuerySnapshot,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyBCRj-pzeE_5XpdGdn4L-IBI04C4wUfHRE",
  authDomain: "chat-fe875.firebaseapp.com",
  projectId: "chat-fe875",
  storageBucket: "chat-fe875.appspot.com",
  messagingSenderId: "928535285999",
  appId: "1:928535285999:web:2f28da0d0a3cb167010b1a",
  measurementId: "G-P6ERGEE385",
});
export const db = getFirestore(app);
export const auth = getAuth(app);
