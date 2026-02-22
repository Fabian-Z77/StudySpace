import React, { useCallback } from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
// NOTIFEE DESACTIVADO:
// import notifee, { AndroidImportance } from '@notifee/react-native';

function TestNotificationButton() {
  // Asegurarnos de tener canal (Android)
  React.useEffect(() => {
    /* NOTIFEE DESACTIVADO
    notifee.createChannel({
      id: 'test',
      name: 'Canal de Prueba',
      importance: AndroidImportance.HIGH,
    });
    */
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      /* NOTIFEE DESACTIVADO
      // 1) Pedir permiso (iOS / Android 13+)
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus < 1) {
        return Alert.alert('Permiso denegado', 'No se pudo enviar la notificación');
      }

      // 2) Disparar notificación de prueba
      await notifee.displayNotification({
        title: '🔔 Notificación de Prueba',
        body: '¡Funciona! 🎉',
        android: {
          channelId: 'test',
          smallIcon: 'ic_launcher', // revisa que exista en tu proyecto
          pressAction: { id: 'default' },
        },
      });
      */
      console.log('🔔 Simulando notificación de prueba enviada (Notifee desactivado)');
      Alert.alert('Simulación', 'La notificación de prueba fue simulada por consola.');
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error);
      Alert.alert('Error', 'Algo salió mal al enviar la notificación');
    }
  }, []);

  return (
    <TouchableOpacity
      onPress={sendTestNotification}
      style={{
        padding: 12,
        backgroundColor: '#4C6FFF',
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '600' }}>Probar Notificación</Text>
    </TouchableOpacity>
  );
}

export default TestNotificationButton;