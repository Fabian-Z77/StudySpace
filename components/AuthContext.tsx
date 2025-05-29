// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUser } from './flashcard/funcionesFirestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUsuario, setCurrentUsuario] = useState([])

  useEffect(() => {
    // Escucha los cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (userState) => {
      if (userState) {
        // Usuario autenticado
        setUser(userState);
        setCurrentUsuario(auth.currentUser);
        try {
          await AsyncStorage.setItem('user', JSON.stringify(userState));

        } catch (e) {
          console.error('Error al guardar usuario en AsyncStorage:', e);
        }
      } else {
        // Usuario no autenticado
        setUser(null);
        try {
          await AsyncStorage.removeItem('user');
        } catch (e) {
          console.error('Error al eliminar usuario de AsyncStorage:', e);
        }
      }
      setLoading(false);
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    console.log("datos del usuario: ", currentUsuario.uid)
    saveUser(currentUsuario.uid,currentUsuario.email,currentUsuario.email)
    console.log("Usuario agregado...")
  },[user,currentUsuario])

  return (
    <AuthContext.Provider
      value={{
        user,
        uid: user?.uid || null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};