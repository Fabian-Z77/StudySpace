// firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  setPersistence,
  browserLocalPersistence,
  getReactNativePersistence
} from 'firebase/auth';                     // <-- desde firebase/auth
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  getFirestore,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Tu configuración de Firebase (reemplaza con tus propios valores)
const firebaseConfig = {

  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID

};


// ——————————————
// 1) Inicializa tu app (config omitida por seguridad)
const app = initializeApp(firebaseConfig);



// 2) Firestore
const db = getFirestore(app);


// 3) Auth según plataforma
let auth;
if (Platform.OS === 'web') {
  // Web: instancia normal + localStorage
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence)
    .catch(err => console.warn('No se pudo setear persistencia web:', err));
} else {
  // iOS/Android: AsyncStorage + persistencia nativa
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  
}
// 4) Exports
export {
  app,
  db,
  auth,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
};