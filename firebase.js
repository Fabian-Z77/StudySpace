// firebase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
  signOut
} from 'firebase/auth'; // <-- desde firebase/auth
import { Platform } from 'react-native';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

// Tu configuración de Firebase (reemplaza con tus propios valores)
const firebaseConfig = {

  apiKey: "AIzaSyB2djAEuTutepcY1INV834aBgTfmhVz_Gw",

  authDomain: "studyspace-4c521.firebaseapp.com",

  projectId: "studyspace-4c521",

  storageBucket: "studyspace-4c521.firebasestorage.app",

  messagingSenderId: "789246904191",

  appId: "1:789246904191:web:4c81154773426cbfc3fc4a"

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
  addDoc, app, auth, collection, db, deleteDoc, doc, getDoc,
  getDocs, orderBy, query, serverTimestamp, setDoc, signOut, updateDoc, where
};

