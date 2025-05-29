import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';

import { AuthProvider, useAuth } from '../components/AuthContext';
import HomeScreen from '../components/home';
import LoadingScreen from '../components/LoadingScreen';
import SignupScreen from './crearCuenta';
import LoginScreen from './LoginScreen';
import SpaceRepetition, { WebNavigation } from './SpaceRepetition';
import NuevaTarea from '@/app/nuevaTarea';
import Flashcard from '@/components/flashcard/container_flashcard';
import Contenido from '@/components/flashcard/contenidos';
import FlashcardApp from '@/components/flashcard/FlashcardApp';
import FlashcardEditModal from '@/components/flashcard/FlashcardEditModal';
import FlashcardViewer from '@/components/flashcard/FlashcardViewer';
import FolderFlashcardSystem from '@/components/flashcard/FolderFlashcardSystem';
import TestNotificationButton from '@/components/flashcard/TestNotificationButton';
import ExampleComponent from '@/components/prueba';
import TodasLasTareas from '@/components/TodasLasTareas';
import DetallesTarea from '@/components/DetallesTarea';
import EditarTarea from '@/components/EditarTarea';
import {
  manejarEventosNotificacion,
  verificarNotificacionesProgramadas
} from '@/components/funcionesTask/scheduleRepetitionNotifications';
import screen from '@/components/pruebas/pruebaTrigger';
import pruebaTrigger from '@/components/pruebas/pruebaTrigger';
import ProgrammingErrorSolver from '@/components/ProgrammingErrorSolver';
import ErrorsList from '@/components/ErrorsList';
import TabsNavigator from './TabsNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';


const Stack = createNativeStackNavigator();

// Componente que registra los manejadores de notificación al iniciar la app
const NotificationHandler = () => {
  useEffect(() => {
    // Inicializar listeners de notificación
    manejarEventosNotificacion();

    // Verificar notificaciones programadas y mostrar alerta si hay errores
    verificarNotificacionesProgramadas()
      .then(notifications => {

      })
      .catch(error => {
        console.error('Error al verificar notificaciones:', error);
        Alert.alert(
          'Notificaciones',
          'No se pudo verificar notificaciones programadas.'
        );
      });
  }, []);

  return null;
};

// Componente para manejar las rutas según el estado de autenticación
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {user ? (
        // Rutas autenticadas
        <>
        {
          Platform.OS === 'web' ?
          <Stack.Screen name="Space" component={SpaceRepetition} options={{ headerShown: false }} />
          :
          <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        }
        <Stack.Screen name="ProgrammingError" component={ProgrammingErrorSolver} options={{ headerShown: false }} />
        <Stack.Screen name="WebNavigation" component={WebNavigation} options={{ headerShown: false }} />
        <Stack.Screen name="ErrorsList" component={ErrorsList} options={{ headerShown: false }} />
        <Stack.Screen name="flashcardApp" component={FlashcardApp} options={{ headerShown: false }} />
        <Stack.Screen name="flashcardSystem" component={FolderFlashcardSystem} options={{ headerShown: false }} />
        <Stack.Screen name="TestNotificationButton" component={TestNotificationButton} options={{ headerShown: false }} />
        <Stack.Screen name="flashcardEdit" component={FlashcardEditModal} options={{ headerShown: false }} />
        <Stack.Screen name="flashcardView" component={FlashcardViewer} options={{ headerShown: false }} />
        <Stack.Screen name="contenido" component={Contenido} options={{ headerShown: false }} />
        <Stack.Screen name="flashcard" component={Flashcard} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="nuevaTarea" component={NuevaTarea} options={{ headerShown: false }} />
        <Stack.Screen name="prueba" component={ExampleComponent} options={{ headerShown: false }} />
        <Stack.Screen name="TodasLasTareas" component={TodasLasTareas} options={{ headerShown: false }} />
        <Stack.Screen name="DetallesTarea" component={DetallesTarea} options={{ headerShown: false }} />
        <Stack.Screen name="EditarTarea" component={EditarTarea} options={{ headerShown: false }} />
        </>
      ) : (
        // Rutas no autenticadas
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {


    const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        ...Ionicons.font, // o FontAwesome.font, MaterialIcons.font, etc.
      });
      setFontsLoaded(true);
    })();
  }, []);

  if (!fontsLoaded) {
    return null; // o un SplashScreen
  }

  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationIndependentTree>
        <NavigationContainer independent={true}>
          <AuthProvider>
            {/* Registramos notificaciones al inicio del contexto */}
            <NotificationHandler />
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </NavigationContainer>
      </NavigationIndependentTree>
    </GestureHandlerRootView>
  );
}
