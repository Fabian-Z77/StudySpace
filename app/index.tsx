import { manejarEventosNotificacion, verificarNotificacionesProgramadas } from '@/components/funcionesTask/scheduleRepetitionNotifications';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../components/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// Componente que registra los manejadores de notificación al iniciar la app
const NotificationHandler = () => {
  useEffect(() => {
    manejarEventosNotificacion();
    verificarNotificacionesProgramadas()
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

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/LoginScreen" />;
  }

  return <Redirect href="/MenuRepetition" />;
}