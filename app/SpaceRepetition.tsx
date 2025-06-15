import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Card from '@/components/card';
import { DiaEnLetra } from '@/components/funciones/calculo_dia_en_letra';
import { DiferenciaEnDias } from '@/components/funciones/calculo_fecha';
import { deleteOldTasks } from '@/components/funcionesTask/deleteOldTasks-';
import { DiferenciaEnMinutos } from '@/components/funcionesTask/DiferenciaEnMinutos';
import { getTasks } from '@/components/funcionesTask/GetTask';
import { auth } from '@/firebase';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import 'intl';
import 'intl/locale-data/jsonp/en'; // o 'es' para español
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  background: '#F5F7FA',
  primary: '#4C6FFF',
  primaryDark: '#3652CC',
  text: '#1A2138',
  textSecondary: '#677489',
  accent: '#FF6060',
  border: '#E2E8F0',
  white: '#FFFFFF',
  filterActive: '#4C6FFF',
  filterInactive: '#E2E8F0',
};





// Navegación Web Component mejorada
export const WebNavigation = ({ navigation }) => {
  if (Platform.OS === 'web') return null;
  return (
    <View style={styles.webNavContainer}>
      {/* Space Repetition */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('Space')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='home' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Space Repetition
          </Text>
        </View>
      </TouchableOpacity>

      {/* Flashcard App */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('flashcardApp')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='book' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Flashcard App
          </Text>
        </View>
      </TouchableOpacity>

      {/* Programming Error */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('ProgrammingError')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='code' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Programming Error
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};




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
const formatearFecha = (fecha) => {
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

function SpaceRepetition() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diaActual, setDiaActual] = useState('');
  const [tareas, setTareas] = useState<any[]>([]);
  const [filtroActivo, setFiltroActivo] = useState('hoy'); // 'hoy', 'semana', 'todas'

  const userId = auth.currentUser?.uid;

  // Fecha que antes estaba hardcode; mejor tomar hoy:
  const hoy = obtenerFechaLocal();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión');
      console.error(error);
    }
  };

  const cargarTareas = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      // 1) Obtener tareas
      const data = await getTasks(userId);

      // 2) Calcular días faltantes y día de la semana
      const procesadas = data.map(item => {
        // Formatear la fecha antes de usarla
        const fechaFormateada = formatearFecha(item.fecha_Actual);
        
        console.log("Fecha original:", item.fecha_Actual);
        console.log("Fecha formateada:", fechaFormateada);
        
        const minutos = DiferenciaEnMinutos(fechaFormateada);
        console.log("minutos:", minutos);
        
        return {
          ...item,
          fecha_Actual: fechaFormateada, // Actualizar con fecha formateada
          dias_faltantes: DiferenciaEnDias(fechaFormateada),
          dia: DiaEnLetra(fechaFormateada),
        };
      });

      setTareas(procesadas);

      // 3) Día actual
      setDiaActual(DiaEnLetra(hoy));
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, hoy]);

  useEffect(() => {
    cargarTareas();
  }, [cargarTareas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarTareas();
  }, [cargarTareas]);

  useEffect(() => {
    if (auth.currentUser?.uid) {
      deleteOldTasks(auth.currentUser.uid);
    }
  }, []);

  // Filtrar tareas según el filtro activo
  const tareasFiltradas = useMemo(() => {
    let tareasOrdenadas = [...tareas].sort((a, b) => a.dias_faltantes - b.dias_faltantes);
    
    switch (filtroActivo) {
      case 'hoy':
        return tareasOrdenadas.filter(t => t.dias_faltantes === 0);
      case 'semana':
        return tareasOrdenadas.filter(t => t.dias_faltantes >= 0 && t.dias_faltantes <= 7);
      case 'todas':
        return tareasOrdenadas.filter(t => t.dias_faltantes >= 0);
      default:
        return tareasOrdenadas.filter(t => t.dias_faltantes === 0);
    }
  }, [tareas, filtroActivo]);

  // Contadores para estadísticas
  const contadores = useMemo(() => {
    const hoy = tareas.filter(t => t.dias_faltantes === 0).length;
    const semana = tareas.filter(t => t.dias_faltantes >= 0 && t.dias_faltantes <= 7).length;
    const todas = tareas.filter(t => t.dias_faltantes >= 0).length;
    
    return { hoy, semana, todas };
  }, [tareas]);

  useEffect(() => {
    console.log("tareas:", tareas);
  }, [tareas]);

  const renderCard = useCallback(({ item, index }) => (
    <Card 
      key={`${item.id}-${filtroActivo}-${index}`}
      dia={item.dia} 
      tarea={item.tarea} 
      dias_faltantes={item.dias_faltantes} 
      minutos_faltantes={item.minutos_faltantes}
      unidad_tiempo={item.unidad_tiempo}
      prioridad={item.dias_faltantes < 3 ? 'alta' : item.dias_faltantes < 5 ? 'media' : 'baja'}
      onPress={() => navigation.navigate('DetallesTarea', { tarea: item })} 
    />
  ), [navigation, filtroActivo]);

  const ListEmptyComponent = useCallback(() => {
    const getEmptyMessage = () => {
      switch (filtroActivo) {
        case 'hoy':
          return 'No hay tareas programadas para hoy';
        case 'semana':
          return 'No hay tareas programadas para esta semana';
        case 'todas':
          return 'No hay tareas programadas';
        default:
          return 'No hay tareas programadas';
      }
    };

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('nuevaTarea')}
        >
          <Text style={styles.emptyButtonText}>Agregar tarea</Text>
        </TouchableOpacity>
      </View>
    );
  }, [navigation, filtroActivo]);

  const FilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filtroActivo === 'hoy' && styles.filterButtonActive
        ]}
        onPress={() => setFiltroActivo('hoy')}
      >
        <Text style={[
          styles.filterButtonText,
          filtroActivo === 'hoy' && styles.filterButtonTextActive
        ]}>
          Hoy ({contadores.hoy})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filtroActivo === 'semana' && styles.filterButtonActive
        ]}
        onPress={() => setFiltroActivo('semana')}
      >
        <Text style={[
          styles.filterButtonText,
          filtroActivo === 'semana' && styles.filterButtonTextActive
        ]}>
          Semana ({contadores.semana})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filtroActivo === 'todas' && styles.filterButtonActive
        ]}
        onPress={() => setFiltroActivo('todas')}
      >
        <Text style={[
          styles.filterButtonText,
          filtroActivo === 'todas' && styles.filterButtonTextActive
        ]}>
          Todas ({contadores.todas})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Header = () => (
    <>
      <View style={styles.headerContainer}>

        <Text style={styles.title}>StudySpace</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <FontAwesome name="sign-out" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tareasFiltradas.length}</Text>
          <Text style={styles.statLabel}>
            {filtroActivo === 'hoy' ? 'Tareas hoy' : 
             filtroActivo === 'semana' ? 'Tareas esta semana' : 
             'Total de tareas'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{diaActual}</Text>
          <Text style={styles.statLabel}>Día actual</Text>
        </View>
      </View>
      <FilterButtons />
    </>
  );

  const FloatingButton = () => (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => navigation.navigate('nuevaTarea')}
    >
      <Ionicons name="add" size={30} color={COLORS.white} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tareas...</Text>
        </View>
      ) : (
          <ScrollView 
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            <Header />
            {tareasFiltradas.length === 0 ? (
              <ListEmptyComponent />
            ) : (
              tareasFiltradas.map((item, index) => renderCard({ item, index }))
            )}
          </ScrollView>

          
      )}
        <FloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: {
    flexDirection: Platform.OS === 'web' ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 0 : 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  statsContainer: { 
    flexDirection: 'row', 
    padding: 20, 
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 14, color: COLORS.textSecondary },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: COLORS.filterInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.filterActive,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: { paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 8 },
  emptyButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 16 },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },



  // Estilos de WebNavigation actualizados
  webNavContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    marginTop: 20,
    marginHorizontal: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webNavButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  webNavButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  webNavIconContainer: {
    width: 36,  
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },


});

export default SpaceRepetition;