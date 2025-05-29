import { addTask } from '@/components/funcionesTask/Addtask';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal
} from 'react-native';
import { DiaEnLetra } from '../components/funciones/calculo_dia_en_letra';
import { auth } from '../firebase';

// Importar las funciones de notificación (añadir al inicio del archivo)
import { 
  programarNotificacionesRepeticionEspaciada,
  requestNotificationPermissions,
  createNotificationChannel,
  configurarCategoriasIOS,
  mostrarNotificacionesProgramadasDetalle,
  enviarNotificacionInmediata
} from '../components/funcionesTask/scheduleRepetitionNotifications';


// Calcular días faltantes para el próximo repaso
const diasFaltantes = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferencia = fin.getTime() - inicio.getTime();
  const dias = diferencia / (1000 * 3600 * 24);

  // Tratamiento especial para intervalos muy cortos
  if (dias < 0.01) {
    // < ~14.4 minutos, usamos 10 minutos fijo
    return { valor: 10, unidad: 'minutos' };
  } else if (dias < 1) {
    const minutos = Math.round(diferencia / (1000 * 60));
    return { valor: minutos, unidad: 'minutos' };
  }

  return { valor: Math.round(dias * 10) / 10, unidad: 'días' };
};

// Constantes de UI y planes
const COLORS = {
  background: '#F5F7FA',
  primary: '#4C6FFF',
  primaryDark: '#3652CC',
  text: '#1A2138',
  textSecondary: '#677489',
  accent: '#FF6060',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

const SPACED_REPETITION_PLANS = {
  standard: { name: 'Estándar (7 repasos)', description: 'Plan recomendado para la mayoría de los casos', intervals: [1, 6, 14, 30, 66, 150, 360] },
  sm2: { name: 'Anki/SuperMemo (SM-2)', description: 'Basado en el algoritmo SM-2 con factor de facilidad', intervals: [1, 6] },
  wozniak: { name: 'Wozniak (1985)', description: 'Plan original de SuperMemo para vocabulario', intervals: [0.007, 1, 7, 30, 180] },
  leitner5: { name: 'Leitner (5 cajas)', description: 'Sistema de 5 niveles con intervalos crecientes', intervals: [1, 2, 4, 8, 16] },
  leitner3: { name: 'Leitner Simplificado (3 cajas)', description: 'Sistema simplificado de 3 niveles', intervals: [1, 3, 7] },
  custom137: { name: 'Esquema 1-3-7-14...', description: 'Plan popular con intervalos iniciales cortos', intervals: [1, 3, 7, 14, 30, 60, 120] },
  none: { name: 'Sin repetición', description: 'Solo una fecha sin repeticiones programadas', intervals: [] },
    DEBUG: {
    name: 'DEBUG',
    description: 'Plan de depuración: repaso en 1 y 2 minutos',
    intervals: [1 / 1440, 2 / 1440], // 1 minuto y 2 minutos
  },
};

export default function NuevaTarea({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [categorias] = useState(['Estudio', 'Trabajo', 'Personal', 'Otro']);
  const [repeticionPlan, setRepeticionPlan] = useState('none');
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [fechasRepeticion, setFechasRepeticion] = useState([]);
  const [showIntervals, setShowIntervals] = useState(false);






  const userId = auth.currentUser?.uid;
// Función para detectar la zona horaria del usuario
const detectarZonaHoraria = () => {
  try {
    // Método moderno: Intl.DateTimeFormat
    const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Zona horaria detectada:', zonaHoraria);
    return zonaHoraria;
  } catch (error) {
    console.error('Error detectando zona horaria:', error);
    // Fallback: usar offset manual
    const offset = new Date().getTimezoneOffset();
    const horas = Math.abs(Math.floor(offset / 60));
    const minutos = Math.abs(offset % 60);
    const signo = offset > 0 ? '-' : '+';
    
    console.log(`Fallback: UTC${signo}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
    return `UTC${signo}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
};

// Función para obtener fecha actual en la zona horaria del usuario
const obtenerFechaLocal = () => {
  const zonaHoraria = detectarZonaHoraria();
  const ahora = new Date();
  
  try {
    // Convertir a zona horaria del usuario
    const fechaLocal = new Date(ahora.toLocaleString("en-US", {timeZone: zonaHoraria}));
    
    // Formatear a YYYY-MM-DD
    const año = fechaLocal.getFullYear();
    const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaLocal.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  } catch (error) {
    console.error('Error formateando fecha local:', error);
    // Fallback: usar fecha local directa
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  }
};

// Función formatearFecha actualizada que usa la zona horaria del usuario
const formatDate = (fecha) => {
  const zonaHoraria = detectarZonaHoraria();
  
  // Si la fecha es null o undefined, usar fecha actual local
  if (!fecha) {
    return obtenerFechaLocal();
  }
  
  // Si ya es string en formato correcto, devolverla tal cual
  if (typeof fecha === 'string') {
    // Verificar si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    // Si es string pero en otro formato, intentar parsearlo
    try {
      const fechaParseada = new Date(fecha);
      const fechaLocal = new Date(fechaParseada.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es un objeto Date
  if (fecha instanceof Date) {
    try {
      const fechaLocal = new Date(fecha.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    }
  }
  
  // Si es timestamp numérico (milisegundos)
  if (typeof fecha === 'number') {
    try {
      const fechaObj = new Date(fecha);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es timestamp de Firestore (objeto con seconds)
  if (fecha && typeof fecha === 'object' && fecha.seconds) {
    try {
      const fechaObj = new Date(fecha.seconds * 1000);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es timestamp de Firestore (objeto con _seconds)
  if (fecha && typeof fecha === 'object' && fecha._seconds) {
    try {
      const fechaObj = new Date(fecha._seconds * 1000);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Fallback final
  return obtenerFechaLocal();
};




useEffect(() => {
  if (repeticionPlan === 'none') {
    setFechasRepeticion([]);
    return;
  }
  
  const plan = SPACED_REPETITION_PLANS[repeticionPlan];
  const base = new Date(fecha);
  
  const arr = plan.intervals.map(intervalo => {
    const d = new Date(base);
    
    // Si el intervalo es menor a 1 día, agregarlo como minutos
    if (intervalo < 1) {
      const minutos = Math.round(intervalo * 1440); // Convertir días fraccionarios a minutos
      d.setMinutes(d.getMinutes() + minutos);
    } else {
      // Si es 1 día o más, agregarlo como días
      d.setDate(d.getDate() + intervalo);
    }
    
    return { fecha: d, intervalo };
  });


  
  setFechasRepeticion(arr);
}, [repeticionPlan, fecha]);


useEffect(() => {
  console.log("Fechas de repeticion: ", fechasRepeticion)
},[fechasRepeticion]);



  const onDateChange = (e, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setFecha(selected);
  };






// useEffect para configurar notificaciones al montar el componente
useEffect(() => {
  const configurarNotificaciones = async () => {
    try {

      
      // Solicitar permisos de notificación al cargar el componente
      await requestNotificationPermissions();
      

      await createNotificationChannel();
      

      
      console.log('Sistema de notificaciones configurado');
    } catch (error) {
      console.error('Error al configurar notificaciones:', error);
    }
  };
  
  configurarNotificaciones();
}, []);



// Agregar esta función antes de guardarTarea
const calcularDiasFaltantes = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferencia = fin.getTime() - inicio.getTime();
  const minutos = diferencia / (1000 * 60);
  const dias = diferencia / (1000 * 3600 * 24);
  
  console.log("minutossss: ", minutos);
  if (minutos < 60) {
    return { valor: Math.round(minutos), unidad: 'minutos' };
  } else if (dias < 1) {
    const horas = Math.round(minutos / 60);
    return { valor: horas, unidad: 'horas' };
  } else {
    return { valor: Math.round(dias * 10) / 10, unidad: 'días' };
  }
};






// Función auxiliar para mostrar alertas compatibles con web y mobile
const showAlert = (title, message, buttons = []) => {
  if (Platform.OS === 'web') {
    // Para web, usar window.alert o una biblioteca de alertas personalizada
    if (buttons && buttons.length > 0) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    // Para React Native nativo
    Alert.alert(title, message, buttons);
  }
};

// Función auxiliar para navegación compatible
const navigateCompatible = (navigation, route) => {
  if (Platform.OS === 'web') {
    // Para web, puedes usar react-router o similar
    if (typeof window !== 'undefined' && window.history) {
      if (route === 'PantallaPrincipal') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.back();
      }
    }
  } else {
    // Para React Native nativo
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(route);
    }
  }
};

// Función guardarTarea modificada con compatibilidad web/mobile
const guardarTarea = async () => {
  if (!userId) {
    showAlert('Error', 'Usuario no autenticado');
    return;
  }
  if (!titulo.trim()) {
    showAlert('Error', 'El título es obligatorio');
    return;
  }
  if (!descripcion.trim()) {
    showAlert('Error', 'La descripción es obligatoria');
    return;
  }
  if (!categoria) {
    showAlert('Error', 'Selecciona una categoría');
    return;
  }

  try {
    // 1) Preparo el payload de la tarea principal

    // Extraemos fechas intermedias
    const fechaActual = new Date(fecha);
    const proximoRepasoDate =
      repeticionPlan !== 'none' && fechasRepeticion.length
        ? new Date(fechasRepeticion[0].fecha)
        : null;

    // Calculamos diferencia en minutos y días
    let minutosFaltantesLog = 0;
    let diasFaltantesValor = 0;
    let unidadTiempo = 'días';

    if (proximoRepasoDate) {
      const diffMs = proximoRepasoDate - fechaActual;
      minutosFaltantesLog = Math.ceil(diffMs / (1000 * 60));
      
      // Determinar la unidad apropiada
      if (minutosFaltantesLog < 60) {
        unidadTiempo = 'minutos';
        diasFaltantesValor = 0;
      } else if (minutosFaltantesLog < 1440) {
        unidadTiempo = 'horas';
        diasFaltantesValor = 0;
      } else {
        unidadTiempo = 'días';
        diasFaltantesValor = diasFaltantes(
          formatDate(fecha),
          formatDate(fechasRepeticion[0].fecha)
        ).valor;
      }
    }

    // Logueamos los minutos faltantes
    console.log('Minutos faltantes hasta el próximo repaso:', minutosFaltantesLog);
    console.log('Unidad de tiempo:', unidadTiempo);

    // Notificación de prueba - solo en mobile
    if (Platform.OS !== 'web') {
      const tareaDePrueba = { id: '123', titulo: 'Repasar funciones de JS' };
      await enviarNotificacionInmediata(tareaDePrueba);
    }

    // 4) Si hay plan de repetición, creo cada repetición y programo notificaciones
    if (repeticionPlan !== 'none') {
      const repeticionesIds = await Promise.all(
        fechasRepeticion.map(async (item, idx) => {
          // Payload de la repetición
          const siguiente = fechasRepeticion[idx + 1] || null;
          
          let deltaNext;
          
          // Caso especial para intervalo 0.007
          if (item.intervalo === 0.007) {
            deltaNext = { valor: 10, unidad: 'minutos' };
          } else {
            deltaNext = siguiente
              ? diasFaltantes(
                  formatDate(item.fecha),
                  formatDate(siguiente.fecha)
                )
              : { valor: 0, unidad: 'días' };
          }

          const repeticionPayload = {
            tarea: `Repaso ${idx + 1}: ${titulo.trim()}`,
            descripcion: `Repetición ${idx + 1} de: ${descripcion.trim()}\n\nTarea original: ${formatDate(fecha)}`,
            fecha_Actual: formatDate(item.fecha),
            dia: DiaEnLetra(formatDate(item.fecha)),
            categoria,
            esRepeticion: true,
            tareaOriginalId: null,
            numeroRepeticion: idx + 1,
            dias_faltantes: deltaNext.unidad === 'días' ? deltaNext.valor : 0,
            minutos_faltantes: deltaNext.unidad === 'minutos' ? deltaNext.valor : 0,
            unidad_tiempo: deltaNext.unidad,
            proximo_repaso: siguiente ? formatDate(siguiente.fecha) : null,
          };

          // Guardo la repetición en Firestore
          const repId = await addTask(userId, repeticionPayload);
          
          return {
            id: repId,
            ...repeticionPayload
          };
        })
      );

      // *** PROGRAMAR NOTIFICACIONES PARA LAS REPETICIONES ***
      // Solo en plataformas móviles
      if (Platform.OS !== 'web') {
        try {
          // Opción 1: Usar la función nueva programarNotificacionesRepeticionEspaciada
          if (typeof programarNotificacionesRepeticionEspaciada === 'function') {
            const planNombre = SPACED_REPETITION_PLANS[repeticionPlan]?.name || repeticionPlan;
            await programarNotificacionesRepeticionEspaciada(
              { id: '12', titulo: 'Repasar' },
              fechasRepeticion,
              planNombre
            );
          }

          // Opcional: Guardar los IDs de notificaciones en la tarea principal para poder cancelarlas después
          // Aquí podrías actualizar la tarea principal con los IDs de las notificaciones si lo necesitas
          
        } catch (notifError) {
          console.error('Error al programar notificaciones de repetición:', notifError);
          // No detener el flujo si fallan las notificaciones
          showAlert(
            'Advertencia', 
            'Las tareas se guardaron correctamente, pero hubo un problema al programar las notificaciones.'
          );
        }
      } else {
        // Para web, podrías implementar recordatorios usando Web Notifications API
        // o localStorage para mostrar recordatorios cuando el usuario visite la app
        console.log('Notificaciones no disponibles en web - implementar alternativa si es necesario');
      }
    }

    // 5) Feedback al usuario
    const message = repeticionPlan === 'none'
      ? 'Tu tarea ha sido programada correctamente'
      : `Tu tarea ha sido programada con ${fechasRepeticion.length} repeticiones${Platform.OS !== 'web' ? ' y notificaciones' : ''}`;

    showAlert(
      'Tarea guardada',
      message,
      [
        {
          text: 'OK',
          onPress: () => navigateCompatible(navigation, 'PantallaPrincipal')
        },
      ]
    );
  } catch (error) {
    console.error('Error al guardar la tarea:', error);
    showAlert('Error', 'No se pudo guardar la tarea. Intenta de nuevo.');
  }
};






const funcionPrueba = async () => {
    const tareaDePrueba = { id: '123', titulo: 'Repasar funciones de JS' };
    await enviarNotificacionInmediata(tareaDePrueba);
}



  const renderPlanItem = (key) => {
    const plan = SPACED_REPETITION_PLANS[key];
    return (
      <TouchableOpacity key={key} style={styles.planItem} onPress={() => { setRepeticionPlan(key); setShowPlanSelector(false); }}>
        <View style={styles.planItemHeader}>
          <Text style={styles.planItemTitle}>{plan.name}</Text>
          <View style={[styles.planItemBadge, repeticionPlan === key && styles.planItemBadgeSelected]}> 
            {repeticionPlan === key && <Ionicons name="checkmark" size={16} color={COLORS.white} />} 
          </View>
        </View>
        <Text style={styles.planItemDescription}>{plan.description}</Text>
        {plan.intervals.length > 0 && (
          <Text style={styles.planItemIntervals}>
            Repasos: {plan.intervals.map(i => i < 1 ? `${Math.round(i * 1440)} min` : `${i} días`).join(', ')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva tarea</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la tarea"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={50}
            />
          </View>
          
          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe los detalles de tu tarea"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
    
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fecha Inicial</Text>

        {Platform.OS === 'web' ? (
          <View style={styles.dateSelector}>
            <input
              type="date"
              value={formatDate(fecha, 'input')} // asegúrate de devolver 'YYYY-MM-DD'
              onChange={(e) => {
                const nuevaFecha = new Date(e.target.value);
                setFecha(nuevaFecha);
              }}
              style={{ padding: 10, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(fecha)}</Text>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <View style={styles.diaContainer}>
          <Text style={styles.diaLabel}>Día:</Text>
          <Text style={styles.diaText}>{DiaEnLetra(formatDate(fecha))}</Text>
        </View>
      </View>
    
          
          {/* Plan de Repetición */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plan de Repetición Espaciada</Text>
            <TouchableOpacity 
              style={styles.planSelector}
              onPress={() => setShowPlanSelector(true)}
            >
              <Text style={styles.planText}>
                {SPACED_REPETITION_PLANS[repeticionPlan].name}
              </Text>
              <Ionicons name="chevron-down" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
            {/* Mostrar fechas de repetición si hay un plan seleccionado */}
            {repeticionPlan !== 'none' && fechasRepeticion.length > 0 && (
              <View style={styles.intervalsContainer}>
                <TouchableOpacity 
                  style={styles.intervalsToggle}
                  onPress={() => setShowIntervals(!showIntervals)}
                >
                  <Text style={styles.intervalsToggleText}>
                    {showIntervals ? 'Ocultar fechas de repaso' : 'Ver fechas de repaso'}
                  </Text>
                  <Ionicons 
                    name={showIntervals ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={COLORS.primary} 
                  />
                </TouchableOpacity>
                
                {showIntervals && (
                  <View style={styles.intervalsList}>
                    {fechasRepeticion.map((item, index) => {
                      // Calcular días o minutos faltantes para mostrar
                      const diasFaltantes = calcularDiasFaltantes(fecha, item.fecha);
                      const tiempoFaltante = diasFaltantes.unidad === 'minutos' 
                        ? `${diasFaltantes.valor} minutos después` 
                        : diasFaltantes.valor === 1 
                          ? '1 día después' 
                          : `${diasFaltantes.valor} días después`;
                          
                      return (
                        <View key={index} style={styles.intervalItem}>
                          <Text style={styles.intervalNumber}>{index + 1}</Text>
                          <View style={styles.intervalInfo}>
                            <Text style={styles.intervalDate}>
                              {formatDate(item.fecha)} • {DiaEnLetra(formatDate(item.fecha))}
                            </Text>
                            <Text style={styles.intervalDays}>{tiempoFaltante}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoriesContainer}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    categoria === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text 
                    style={[
                      styles.categoryText,
                      categoria === cat && styles.categoryTextActive
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={guardarTarea}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal para seleccionar plan de repetición */}
      <Modal
        visible={showPlanSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona un plan de repetición</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPlanSelector(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.plansList}>
              {Object.keys(SPACED_REPETITION_PLANS).map(renderPlanItem)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  dateSelector: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
  },
  diaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  diaLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  diaText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  planSelector: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planText: {
    fontSize: 16,
    color: COLORS.text,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para el modal de planes
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plansList: {
    paddingHorizontal: 20,
  },
  planItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  planItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  planItemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planItemBadgeSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planItemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  planItemIntervals: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // Estilos para las fechas de repaso
  intervalsContainer: {
    marginTop: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  intervalsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  intervalsToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  intervalsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  intervalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  intervalNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  intervalInfo: {
    flex: 1,
  },
  intervalDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  intervalDays: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default NuevaTarea;