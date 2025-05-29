import React from 'react';
import { View, Button } from 'react-native';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

function pruebaTrigger() {
  async function onCreateTriggerNotification() {
    // 1 minuto en el futuro
    const date = new Date(Date.now() + 1 * 60 * 1000);

    // Mostrar la hora legible en consola
    console.log('🔔 La notificación se mostrará a las:', date.toLocaleTimeString());

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      
      
    };

    await notifee.createTriggerNotification(
      {
        title: 'Meeting with Jane',
        body: `Recordatorio: reunión en 1 minuto (a las ${date.toLocaleTimeString()})`,
        android: {
          channelId: 'your-channel-id',
        },
      },
      trigger,
    );
  }

  return (
    <View>
      <Button title="Crear notificación en 1 minuto" onPress={onCreateTriggerNotification} />
    </View>
  );
}

export default pruebaTrigger;
