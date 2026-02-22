// NOTIFEE DESACTIVADO:
// import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

// ID del canal de notificaciones
const CHANNEL_ID = 'spaced-repetition-channel';

// Configurar el canal de notificaciones (necesario para Android)
export const createNotificationChannel = async () => {
  /* NOTIFEE DESACTIVADO
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Repetición Espaciada',
    description: 'Notificaciones para recordar repasos programados',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
  */
  console.log('Simulando creación de canal de notificaciones');
};

// Función para solicitar permisos de notificación
export const requestNotificationPermissions = async () => {
  try {
    /* NOTIFEE DESACTIVADO
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus >= 1) {
      console.log('Permisos de notificación concedidos');
      return true;
    } else {
      console.log('Permisos de notificación denegados');
      return false;
    }
    */
    console.log('Simulando permisos de notificación concedidos');
    return true; // Devolvemos true para que el flujo de la app no se detenga
  } catch (error) {
    console.error('Error al solicitar permisos:', error);
    return false;
  }
};

// Función para programar una notificación individual de repaso (MEJORADA CON LOGS)
export const programarNotificacionRepaso = async (tarea, fechaRepaso, numeroRepaso, planNombre) => {
  try {
    if (Platform.OS === 'android') {
      await createNotificationChannel();
    }
    await requestNotificationPermissions();
    const ahora = new Date();
    
    console.log(`\n=== PROGRAMANDO NOTIFICACIÓN ${numeroRepaso} ===`);
    console.log(`📅 Fecha de repaso recibida: ${fechaRepaso}`);
    console.log(`🕐 Hora actual del usuario: ${ahora.toLocaleString()}`);
    
    const notificationId = `repaso-${tarea.id || tarea.titulo}-${numeroRepaso}`;
    const fechaNotificacion = new Date(fechaRepaso);
    
    const diferenciaMilisegundos = fechaNotificacion.getTime() - ahora.getTime();
    const diferenciaMinutos = diferenciaMilisegundos / (1000 * 60);
    const diferenciaHoras = diferenciaMilisegundos / (1000 * 60 * 60);
    
    console.log(`⏱️  Diferencia de tiempo: ${Math.round(diferenciaMinutos)} minutos (${Math.round(diferenciaHoras)} horas)`);
    
    let fechaNotificacionFinal;
    
    if (diferenciaHoras < 24) {
      fechaNotificacionFinal = new Date(fechaNotificacion);
      console.log(`📋 Caso: Menos de 24 horas - Notificación programada para hora exacta`);
    } else {
      fechaNotificacionFinal = new Date(fechaNotificacion);
      fechaNotificacionFinal.setHours(9, 0, 0, 0);
      console.log(`📋 Caso: 24 horas o más - Notificación programada para las 9:00 AM del día correspondiente`);
    }
    
    console.log(`🎯 Hora programada para la notificación: ${fechaNotificacionFinal.toLocaleString()}`);

    const margenSegundos = diferenciaMinutos < 60 ? 30 : 60; 
    const tiempoMargen = new Date(ahora.getTime() + (margenSegundos * 1000));

    if (fechaNotificacionFinal <= tiempoMargen) {
      console.log(`❌ La fecha de repaso (${fechaNotificacionFinal.toLocaleString()}) ya pasó o es muy cercana, no se programará notificación`);
      return null;
    }

    console.log('🔔 La notificación se mostrará a las:', fechaNotificacionFinal.toLocaleTimeString()); 
    
    /* NOTIFEE DESACTIVADO
    const date = new Date(Date.now() + 1 * 60 * 1000);
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };
    
    const notification = { ... }; // Código original omitido por limpieza visual
    
    await notifee.createTriggerNotification(notification, trigger);
    */
    
    console.log(`✅ Notificación SIMULADA exitosamente`);
    console.log(`   - ID: ${notificationId}`);
    console.log(`   - Tarea: ${tarea.titulo || tarea.tarea}`);
    console.log(`   - Repaso: ${numeroRepaso}`);
    console.log(`=== FIN PROGRAMACIÓN NOTIFICACIÓN ${numeroRepaso} ===\n`);
    
    return notificationId;
  } catch (error) {
    console.error('❌ Error al programar notificación de repaso:', error);
    return null;
  }
};

export const programarNotificacionesRepeticionEspaciada = async (tarea, fechasRepeticion, planNombre) => {
  console.log('Tarea:', tarea);
  console.log('Plan nombre:', planNombre);
  console.log('Fechas de repetición:', fechasRepeticion);

  for (const { fecha, intervalo } of fechasRepeticion) {
    let timestamp;

    if (intervalo === 0.007) {
      timestamp = Date.now() + 10 * 60 * 1000;
    } else {
      timestamp = new Date(fecha).getTime();
    }

    /* NOTIFEE DESACTIVADO
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
    };

    const bodyText = ...
    
    try {
      await notifee.createTriggerNotification(..., trigger);
      console.log(`✅ Notificación programada para: ${new Date(timestamp).toLocaleString()}`);
    } catch (error) {
      console.error('❌ Error programando notificación:', error);
    }
    */
    console.log(`✅ SIMULACIÓN: Notificación programada para: ${new Date(timestamp).toLocaleString()}`);
  }
};

export const cancelarNotificacionesTarea = async (tareaId, numeroRepeticiones) => {
  try {
    const idsACancelar = [];
    
    for (let i = 1; i <= numeroRepeticiones; i++) {
      idsACancelar.push(`repaso-${tareaId}-${i}`);
    }
    idsACancelar.push(`recordatorio-${tareaId}`);
    
    /* NOTIFEE DESACTIVADO
    await Promise.all(idsACancelar.map(id => notifee.cancelNotification(id)));
    */
    
    console.log(`SIMULACIÓN: Canceladas ${idsACancelar.length} notificaciones para la tarea ${tareaId}`);
  } catch (error) {
    console.error('Error al cancelar notificaciones:', error);
  }
};

export const marcarRepasoCompletado = async (notificationId, tareaId) => {
  try {
    /* NOTIFEE DESACTIVADO
    await notifee.cancelNotification(notificationId);
    await notifee.displayNotification({...});
    */
    console.log(`SIMULACIÓN: Repaso marcado como completado: ${tareaId}`);
  } catch (error) {
    console.error('Error al marcar repaso como completado:', error);
  }
};

export const posponerRepaso = async (notificationId, tarea, numeroRepaso) => {
  try {
    /* NOTIFEE DESACTIVADO
    await notifee.cancelNotification(notificationId);
    // ... lógica de triggers
    await notifee.createTriggerNotification(notification, trigger);
    */
    console.log(`SIMULACIÓN: Repaso pospuesto 1 hora: ${tarea.titulo || tarea.tarea}`);
  } catch (error) {
    console.error('Error al posponer repaso:', error);
  }
};

export const configurarCategoriasIOS = async () => {
  if (Platform.OS === 'ios') {
    /* NOTIFEE DESACTIVADO
    await notifee.setNotificationCategories([...]);
    */
    console.log("SIMULACIÓN: Categorías iOS configuradas");
  }
};

export const manejarEventosNotificacion = () => {
  /* NOTIFEE DESACTIVADO
  notifee.onForegroundEvent(({ type, detail }) => { ... });
  notifee.onBackgroundEvent(async ({ type, detail }) => { ... });
  */
  console.log("SIMULACIÓN: Eventos de notificación iniciados");
};

export const verificarNotificacionesProgramadas = async () => {
  try {
    /* NOTIFEE DESACTIVADO
    const notificacionesProgramadas = await notifee.getTriggerNotifications();
    return notificacionesProgramadas;
    */
    console.log('SIMULACIÓN: Verificando notificaciones (0 encontradas por desactivación)');
    return [];
  } catch (error) {
    return [];
  }
};

export const mostrarNotificacionesProgramadasDetalle = async () => {
  try {
    /* NOTIFEE DESACTIVADO
    const notificacionesProgramadas = await notifee.getTriggerNotifications();
    ... lógica de muestra
    return notificacionesProgramadas;
    */
    console.log(`\n=== SIMULACIÓN NOTIFICACIONES PROGRAMADAS (0) ===\n`);
    return [];
  } catch (error) {
    return [];
  }
};

export const enviarNotificacionInmediata = async (tarea) => {
  try {
    if (Platform.OS === 'android') {
      await createNotificationChannel();
    }
    await requestNotificationPermissions();

    /* NOTIFEE DESACTIVADO
    await notifee.displayNotification({...});
    */
    console.log('✅ SIMULACIÓN: Notificación de prueba enviada:', tarea.titulo || tarea.tarea);
  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
  }
};