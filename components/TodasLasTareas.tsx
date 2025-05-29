import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Card from '@/components/card';
import { DiferenciaEnDias } from '../components/funciones/calculo_fecha';
import { DiaEnLetra } from '../components/funciones/calculo_dia_en_letra';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTasks } from '@/components/funcionesTask/GetTask';
import { auth } from '../firebase';
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
};

function TodasLasTareas() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [filtroActual, setFiltroActual] = useState('todas');

  const userId = auth.currentUser?.uid;

  const cargarTareas = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getTasks(userId);

      const procesadas = data.map(item => {
        const dias = DiferenciaEnDias(item.fecha_Actual);
        return {
          ...item,
          dias_faltantes: dias,
          dia: DiaEnLetra(item.fecha_Actual),
        };
      });

      setTareas(procesadas);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarTareas();
  }, [cargarTareas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarTareas();
  }, [cargarTareas]);

  // Filtrar tareas según el filtro seleccionado
  const tareasFiltradas = useMemo(() => {
    if (filtroActual === 'pendientes') {
      return tareas.filter(tarea => tarea.dias_faltantes > 0)
        .sort((a, b) => a.dias_faltantes - b.dias_faltantes);
    } else if (filtroActual === 'pasadas') {
      return tareas.filter(tarea => tarea.dias_faltantes <= 0)
        .sort((a, b) => b.dias_faltantes - a.dias_faltantes);
    } else {
      return [...tareas].sort((a, b) => a.dias_faltantes - b.dias_faltantes);
    }
  }, [tareas, filtroActual]);

  // Renderizar card con key única y propiedades explícitas
  const renderCard = useCallback(({ item, index }) => {
    // Debugging: Agregar logs para verificar datos
    console.log('Renderizando card:', {
      id: item.id,
      tarea: item.tarea,
      dias_faltantes: item.dias_faltantes,
      filtro: filtroActual
    });

    return (
      <View key={`${item.id}-${filtroActual}-${index}`} style={styles.cardContainer}>
        <Card
          dia={item.dia || 'N/A'} 
          tarea={item.tarea || 'Sin título'} 
          dias_faltantes={item.dias_faltantes || 0} 
          minutos_faltantes={item.minutos_faltantes || 0}
          unidad_tiempo={item.unidad_tiempo || 'días'}
          prioridad={item.dias_faltantes < 3 ? 'alta' : item.dias_faltantes < 5 ? 'media' : 'baja'}
          onPress={() => navigation.navigate('DetallesTarea', { tarea: item })}
        />
      </View>
    );
  }, [navigation, filtroActual]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>
        {filtroActual === 'pendientes' 
          ? 'No hay tareas pendientes' 
          : filtroActual === 'pasadas' 
          ? 'No hay tareas pasadas' 
          : 'No hay tareas disponibles'}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('nuevaTarea')}
      >
        <Text style={styles.emptyButtonText}>Agregar tarea</Text>
      </TouchableOpacity>
    </View>
  ), [navigation, filtroActual]);

  const Header = () => (
    <View>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Todas las tareas</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tareas.length}</Text>
          <Text style={styles.statLabel}>Total de tareas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {tareas.filter(tarea => tarea.dias_faltantes > 0).length}
          </Text>
          <Text style={styles.statLabel}>Tareas pendientes</Text>
        </View>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filtroActual === 'todas' && styles.filterButtonActive
          ]}
          onPress={() => {
            console.log('Cambiando filtro a: todas');
            setFiltroActual('todas');
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              filtroActual === 'todas' && styles.filterButtonTextActive
            ]}
          >
            Todas ({tareas.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filtroActual === 'pendientes' && styles.filterButtonActive
          ]}
          onPress={() => {
            console.log('Cambiando filtro a: pendientes');
            setFiltroActual('pendientes');
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              filtroActual === 'pendientes' && styles.filterButtonTextActive
            ]}
          >
            Pendientes ({tareas.filter(t => t.dias_faltantes > 0).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filtroActual === 'pasadas' && styles.filterButtonActive
          ]}
          onPress={() => {
            console.log('Cambiando filtro a: pasadas');
            setFiltroActual('pasadas');
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              filtroActual === 'pasadas' && styles.filterButtonTextActive
            ]}
          >
            Pasadas ({tareas.filter(t => t.dias_faltantes <= 0).length})
          </Text>
        </TouchableOpacity>
      </View>
      {/* Debugging: Mostrar información del filtro actual */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Filtro: {filtroActual} | Tareas filtradas: {tareasFiltradas.length}
        </Text>
      </View>
    </View>
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
        <View>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.text 
  },
  statsContainer: { 
    flexDirection: 'row', 
    padding: 20, 
    backgroundColor: COLORS.white 
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.primary 
  },
  statLabel: { 
    fontSize: 14, 
    color: COLORS.textSecondary 
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  // Nuevo estilo para el container de debugging
  debugContainer: {
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  debugText: {
    fontSize: 12,
    color: '#8B0000',
    textAlign: 'center',
  },
  // Nuevo estilo para el container de cada card
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'transparent',
  },
  listContainer: { 
    paddingBottom: 80,
    backgroundColor: COLORS.background,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: COLORS.textSecondary 
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginBottom: 24 
  },
  emptyButton: { 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    backgroundColor: COLORS.primary, 
    borderRadius: 8 
  },
  emptyButtonText: { 
    color: COLORS.white, 
    fontWeight: '600', 
    fontSize: 16 
  },
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
});

export default TodasLasTareas;