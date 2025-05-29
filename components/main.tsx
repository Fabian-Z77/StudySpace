// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import SignupScreen from '../app/crearCuenta';
import LoginScreen from '../app/LoginScreen';
import HomeScreen from '../components/home';
import { AuthProvider, useAuth } from './AuthContext';
import LoadingScreen from './LoadingScreen';
import SpaceRepetition from '@/app/SpaceRepetition';
import NuevaTarea from '@/app/nuevaTarea';
import ExampleComponent from './prueba';

const Stack = createNativeStackNavigator();

// Componente para manejar las rutas según el estado de autenticación
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {user ? (
        // Rutas para usuarios autenticados

        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Space" component={SpaceRepetition} options={{ headerShown: false }} />
          <Stack.Screen name="prueba" component={ExampleComponent} options={{ headerShown: false }} />
          <Stack.Screen name="nuevaTarea" component={NuevaTarea} options={{ headerShown: false }} />

        </>
        

      ) : (
        // Rutas para usuarios no autenticados
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />

        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer independent={true}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}