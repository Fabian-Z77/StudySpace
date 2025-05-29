import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

// ID del canal de notificaciones
const CHANNEL_ID = 'spaced-repetition-channel';

// Configurar el canal de notificaciones (necesario para Android)
export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Repetición Espaciada',
    description: 'Notificaciones para recordar repasos programados',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
};

// Función para solicitar permisos de notificación
export const requestNotificationPermissions = async () => {
  try {
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus >= 1) {
      console.log('Permisos de notificación concedidos');
      return true;
    } else {
      console.log('Permisos de notificación denegados');
      return false;
    }
  } catch (error) {
    console.error('Error al solicitar permisos:', error);
    return false;
  }
};

// Función para programar una notificación individual de repaso (MEJORADA CON LOGS)
export const programarNotificacionRepaso = async (tarea, fechaRepaso, numeroRepaso, planNombre) => {


  
  
  
  try {
      // Asegúrate de tener creado el canal (Android) y permisos solicitados  
    if (Platform.OS === 'android') {
      await createNotificationChannel();
    }
    await requestNotificationPermissions();
    const ahora = new Date();
    
    // LOG: Mostrar fecha recibida y hora actual
    console.log(`\n=== PROGRAMANDO NOTIFICACIÓN ${numeroRepaso} ===`);
    console.log(`📅 Fecha de repaso recibida: ${fechaRepaso}`);
    console.log(`🕐 Hora actual del usuario: ${ahora.toLocaleString()}`);
    
    // Crear el ID único para la notificación
    const notificationId = `repaso-${tarea.id || tarea.titulo}-${numeroRepaso}`;
    
    // Configurar la fecha de la notificación
    const fechaNotificacion = new Date(fechaRepaso);
    
    // Calcular la diferencia en minutos entre ahora y la fecha del repaso
    const diferenciaMilisegundos = fechaNotificacion.getTime() - ahora.getTime();
    const diferenciaMinutos = diferenciaMilisegundos / (1000 * 60);
    const diferenciaHoras = diferenciaMilisegundos / (1000 * 60 * 60);
    
    console.log(`⏱️  Diferencia de tiempo: ${Math.round(diferenciaMinutos)} minutos (${Math.round(diferenciaHoras)} horas)`);
    
    let fechaNotificacionFinal;
    
    // Si el repaso es en menos de 24 horas, programar para la hora exacta calculada
    // Si es en 24 horas o más, programar para las 9:00 AM del día correspondiente
    if (diferenciaHoras < 24) {
      // Para repasos de minutos/horas, usar la fecha exacta calculada
      fechaNotificacionFinal = new Date(fechaNotificacion);
      console.log(`📋 Caso: Menos de 24 horas - Notificación programada para hora exacta`);
    } else {
      // Para repasos de días (24 horas o más), configurar para las 9:00 AM del día del repaso
      fechaNotificacionFinal = new Date(fechaNotificacion);
      fechaNotificacionFinal.setHours(9, 0, 0, 0);
      console.log(`📋 Caso: 24 horas o más - Notificación programada para las 9:00 AM del día correspondiente`);
    }
    
    // LOG: Mostrar hora programada final
    console.log(`🎯 Hora programada para la notificación: ${fechaNotificacionFinal.toLocaleString()}`);

    // Verificar que la fecha sea futura (con un margen más permisivo para intervalos cortos)
    const margenSegundos = diferenciaMinutos < 60 ? 30 : 60; // 30 segundos para intervalos de minutos, 1 minuto para otros
    const tiempoMargen = new Date(ahora.getTime() + (margenSegundos * 1000));

    if (fechaNotificacionFinal <= tiempoMargen) {
    console.log(`❌ La fecha de repaso (${fechaNotificacionFinal.toLocaleString()}) ya pasó o es muy cercana, no se programará notificación`);
    return null;
  }

    // Mostrar la hora legible en consola
    console.log('🔔 La notificación se mostrará a las:', fechaNotificacionFinal.toLocaleTimeString()); 
    
    

    const date = new Date(Date.now() + 1 * 60 * 1000);

    // Crear el trigger para la notificación
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };
    
    // Configurar el contenido de la notificación
    const notification = {
      id: notificationId,
      title: `¡Hora de repasar! 📚`,
      body: `Repaso ${numeroRepaso}: ${tarea.titulo || tarea.tarea}`,
      data: {
        tareaId: tarea.id || tarea.titulo,
        numeroRepaso: numeroRepaso.toString(),
        plan: planNombre,
        tipo: 'repaso',
        fechaOriginal: fechaRepaso
      },
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Completar Repaso',
            pressAction: {
              id: 'completar',
            },
          },
          {
            title: 'Posponer 1 hora',
            pressAction: {
              id: 'posponer',
            },
          },
        ],
      },
      ios: {
        categoryId: 'spaced-repetition',
        sound: 'default',
      },
    };
    
    // Programar la notificación
    await notifee.createTriggerNotification(notification, trigger);
    
    // Log final de confirmación
    console.log(`✅ Notificación programada exitosamente`);
    console.log(`   - ID: ${notificationId}`);
    console.log(`   - Tarea: ${tarea.titulo || tarea.tarea}`);
    console.log(`   - Repaso: ${numeroRepaso}`);
    console.log(`   - Plan: ${planNombre}`);
    console.log(`=== FIN PROGRAMACIÓN NOTIFICACIÓN ${numeroRepaso} ===\n`);
    
    return notificationId;
  } catch (error) {
    console.error('❌ Error al programar notificación de repaso:', error);
    return null;
  }
};

// Función principal para programar todas las notificaciones (MEJORADA CON LOGS)
// Función mejorada para programar todas las notificaciones en base a fechasRepeticion
export const programarNotificacionesRepeticionEspaciada = async (tarea, fechasRepeticion, planNombre) => {
  console.log('Tarea:', tarea);
  console.log('Plan nombre:', planNombre);
  console.log('Fechas de repetición:', fechasRepeticion);

  for (const { fecha, intervalo } of fechasRepeticion) {
    // Determinar timestamp según el intervalo
    let timestamp;

    if (intervalo === 0.007) {
      // 0.007 → 10 minutos después del momento actual
      timestamp = Date.now() + 10 * 60 * 1000;
    } else {
      // Para intervalos en días, usar la fecha proporcionada
      timestamp = new Date(fecha).getTime();
    }

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
    };

    // Construir el cuerpo del mensaje
    const bodyText = intervalo === 0.007
      ? `Recordatorio: reunión en 10 minutos (a las ${new Date(timestamp).toLocaleTimeString()})`
      : `Recordatorio: ${tarea} programada para el ${new Date(timestamp).toLocaleString()}`;

    try {
      await notifee.createTriggerNotification(
        {
          title: `🗓️ ${planNombre}`,
          body: bodyText,
          android: {
            channelId: 'your-channel-id',
          },
        },
        trigger,
      );

      console.log(`✅ Notificación programada para: ${new Date(timestamp).toLocaleString()}`);
    } catch (error) {
      console.error('❌ Error programando notificación:', error);
    }
  }
};





// Función para cancelar todas las notificaciones de una tarea
export const cancelarNotificacionesTarea = async (tareaId, numeroRepeticiones) => {
  try {
    const idsACancelar = [];
    
    // IDs de notificaciones de repaso
    for (let i = 1; i <= numeroRepeticiones; i++) {
      idsACancelar.push(`repaso-${tareaId}-${i}`);
    }
    
    // ID del recordatorio
    idsACancelar.push(`recordatorio-${tareaId}`);
    
    // Cancelar todas las notificaciones
    await Promise.all(idsACancelar.map(id => notifee.cancelNotification(id)));
    
    console.log(`Canceladas ${idsACancelar.length} notificaciones para la tarea ${tareaId}`);
  } catch (error) {
    console.error('Error al cancelar notificaciones:', error);
  }
};

// Función para manejar cuando el usuario completa un repaso
export const marcarRepasoCompletado = async (notificationId, tareaId) => {
  try {
    // Cancelar la notificación actual
    await notifee.cancelNotification(notificationId);
    
    // Aquí puedes añadir lógica para actualizar la base de datos
    // Por ejemplo, marcar el repaso como completado
    
    // Mostrar notificación de confirmación
    await notifee.displayNotification({
      title: '✅ Repaso completado',
      body: '¡Excelente trabajo! Sigue así.',
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
        autoCancel: true,
      },
      ios: {
        sound: 'default',
      },
    });
    
    console.log(`Repaso marcado como completado: ${tareaId}`);
  } catch (error) {
    console.error('Error al marcar repaso como completado:', error);
  }
};

// Función para posponer un repaso por 1 hora
export const posponerRepaso = async (notificationId, tarea, numeroRepaso) => {
  try {
    // Cancelar la notificación actual
    await notifee.cancelNotification(notificationId);
    
    // Crear nueva notificación 1 hora después
    const nuevaFecha = new Date();
    nuevaFecha.setHours(nuevaFecha.getHours() + 1);
    
    const nuevoId = `${notificationId}-pospuesto`;
    
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nuevaFecha.getTime(),
    };
    
    const notification = {
      id: nuevoId,
      title: `📚 Repaso pospuesto`,
      body: `Repaso ${numeroRepaso}: ${tarea.titulo || tarea.tarea}`,
      data: {
        tareaId: tarea.id || tarea.titulo,
        numeroRepaso: numeroRepaso.toString(),
        tipo: 'repaso-pospuesto'
      },
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
      },
      ios: {
        sound: 'default',
      },
    };
    
    await notifee.createTriggerNotification(notification, trigger);
    
    console.log(`Repaso pospuesto 1 hora: ${tarea.titulo || tarea.tarea}`);
  } catch (error) {
    console.error('Error al posponer repaso:', error);
  }
};

// Configurar categorías de notificación para iOS
export const configurarCategoriasIOS = async () => {
  if (Platform.OS === 'ios') {
    await notifee.setNotificationCategories([
      {
        id: 'spaced-repetition',
        actions: [
          {
            id: 'completar',
            title: 'Completar Repaso',
            input: false,
          },
          {
            id: 'posponer',
            title: 'Posponer 1 hora',
            input: false,
          },
        ],
      },
    ]);
  }
};

// Función para manejar eventos en segundo plano
export const manejarEventosNotificacion = () => {
  // Evento cuando se presiona una notificación
  notifee.onForegroundEvent(({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    switch (type) {
      case 1: // NotificationPressed
        console.log('Notificación presionada:', notification.data);
        // Navegar a la pantalla de repaso
        break;
        
      case 2: // ActionPressed
        switch (pressAction.id) {
          case 'completar':
            marcarRepasoCompletado(notification.id, notification.data.tareaId);
            break;
          case 'posponer':
            posponerRepaso(
              notification.id,
              { id: notification.data.tareaId, titulo: notification.body.split(': ')[1] },
              parseInt(notification.data.numeroRepaso)
            );
            break;
        }
        break;
    }
  });
  
  // Evento en segundo plano
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    if (type === 2 && pressAction.id === 'completar') {
      await marcarRepasoCompletado(notification.id, notification.data.tareaId);
    }
  });
};

// Función para verificar el estado de las notificaciones programadas
export const verificarNotificacionesProgramadas = async () => {
  try {
    const notificacionesProgramadas = await notifee.getTriggerNotifications();
    
    console.log('Notificaciones programadas:', notificacionesProgramadas.length);
    
    notificacionesProgramadas.forEach(notification => {
      const fecha = new Date(notification.trigger.timestamp);
      console.log(`- ${notification.notification.title}: ${fecha}`);
    });
    
    return notificacionesProgramadas;
  } catch (error) {
    console.error('Error al verificar notificaciones:', error);
    return [];
  }
};

// Función adicional para debug - mostrar todas las notificaciones programadas con detalles
export const mostrarNotificacionesProgramadasDetalle = async () => {
  try {
    const notificacionesProgramadas = await notifee.getTriggerNotifications();
    
    console.log(`\n=== NOTIFICACIONES PROGRAMADAS (${notificacionesProgramadas.length}) ===`);
    
    if (notificacionesProgramadas.length === 0) {
      console.log('No hay notificaciones programadas');
      return;
    }
    
    const ahora = new Date();
    
    notificacionesProgramadas.forEach((notif, index) => {
      const fecha = new Date(notif.trigger.timestamp);
      const diferenciaMilisegundos = fecha.getTime() - ahora.getTime();
      const diferenciaMinutos = Math.round(diferenciaMilisegundos / (1000 * 60));
      
      let tiempoTexto;
      if (diferenciaMinutos < 60) {
        tiempoTexto = `en ${diferenciaMinutos} minutos`;
      } else if (diferenciaMinutos < 1440) {
        const horas = Math.round(diferenciaMinutos / 60);
        tiempoTexto = `en ${horas} horas`;
      } else {
        const dias = Math.round(diferenciaMinutos / 1440);
        tiempoTexto = `en ${dias} días`;
      }
      
      console.log(`${index + 1}. ${notif.notification.title}`);
      console.log(`   Mensaje: ${notif.notification.body}`);
      console.log(`   Fecha: ${fecha.toLocaleString()}`);
      console.log(`   Tiempo: ${tiempoTexto}`);
      console.log(`   ID: ${notif.notification.id}`);
      console.log('---');
    });
    
    console.log('=== FIN NOTIFICACIONES ===\n');
    
    return notificacionesProgramadas;
  } catch (error) {
    console.error('Error al mostrar notificaciones:', error);
    return [];
  }
};

// Función para enviar una notificación de prueba inmediata
export const enviarNotificacionInmediata = async (tarea) => {
  try {
    // Asegúrate de tener creado el canal (Android) y permisos solicitados  
    if (Platform.OS === 'android') {
      await createNotificationChannel();
    }
    await requestNotificationPermissions();

    // Dispara la notificación inmediatamente
    await notifee.displayNotification({
      id: `test-${tarea.id || tarea.titulo}`,                 // ID único para esta prueba
      title: '🔔 Notificación de prueba',
      body: `¡Esto es un test para: ${tarea.titulo || tarea.tarea}!`,
      data: {
        tareaId: tarea.id || tarea.titulo,
        tipo: 'prueba-inmediata'
      },
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',     // <- usa el launcher por defecto
        pressAction: { id: 'default', launchActivity: 'default' }
      },
      ios: {
        sound: 'default'
      },
    });

    console.log('✅ Notificación de prueba enviada:', tarea.titulo || tarea.tarea);
  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
  }
};