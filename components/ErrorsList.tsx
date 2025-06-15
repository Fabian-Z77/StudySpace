import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase imports
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

import { app, db } from '@/firebase';

const auth = getAuth(app);

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
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

const PRIORIDADES = [
  { label: 'Baja', value: 'baja', color: COLORS.success },
  { label: 'Media', value: 'media', color: COLORS.warning },
  { label: 'Alta', value: 'alta', color: COLORS.error },
];

const ESTADOS = [
  { label: 'Sin resolver', value: 'sin_resolver', color: COLORS.error },
  { label: 'En progreso', value: 'en_progreso', color: COLORS.warning },
  { label: 'Resuelto', value: 'resuelto', color: COLORS.success },
];

function ErrorsList({ route, navigation }) {
  // Obtener el lenguaje desde los parámetros de navegación
  const { lenguaje } = route.params;
  
  const [errores, setErrores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [errorSeleccionado, setErrorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // ID del usuario actual
  const userId = auth.currentUser?.uid;
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    solucion: '',
    prioridad: 'media',
    estado: 'sin_resolver',
    codigoError: '',
    tags: ''
  });

  // Cargar errores desde Firestore
  useEffect(() => {
    if (!userId || !lenguaje?.id) return;

    const erroresRef = collection(db, 'users', userId, 'Errores', lenguaje.id, 'errores');
    const q = query(erroresRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const erroresData = [];
      snapshot.forEach((doc) => {
        erroresData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setErrores(erroresData);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar errores:', error);
      Alert.alert('Error', 'No se pudieron cargar los errores');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, lenguaje?.id]);

  const erroresFiltrados = useMemo(() => {
    let resultado = errores;
    
    if (busqueda.trim()) {
      resultado = resultado.filter(error => 
        error.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        error.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (error.tags && error.tags.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }
    
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(error => error.estado === filtroEstado);
    }
    
    if (filtroPrioridad !== 'todos') {
      resultado = resultado.filter(error => error.prioridad === filtroPrioridad);
    }
    
    return resultado.sort((a, b) => {
      // Ordenar por prioridad y luego por fecha
      const prioridadOrder = { alta: 3, media: 2, baja: 1 };
      if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
        return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
      }
      return new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0);
    });
  }, [errores, busqueda, filtroEstado, filtroPrioridad]);

  const abrirModal = useCallback((modo, error = null) => {
    setModalMode(modo);
    setErrorSeleccionado(error);
    
    if (modo === 'edit' && error) {
      setFormData({
        titulo: error.titulo,
        descripcion: error.descripcion,
        solucion: error.solucion,
        prioridad: error.prioridad,
        estado: error.estado,
        codigoError: error.codigoError || '',
        tags: error.tags || ''
      });
    } else {
      setFormData({
        titulo: '',
        descripcion: '',
        solucion: '',
        prioridad: 'media',
        estado: 'sin_resolver',
        codigoError: '',
        tags: ''
      });
    }
    
    setModalVisible(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setErrorSeleccionado(null);
    setFormData({
      titulo: '',
      descripcion: '',
      solucion: '',
      prioridad: 'media',
      estado: 'sin_resolver',
      codigoError: '',
      tags: ''
    });
    setSaving(false);
  }, []);

  const guardarError = useCallback(async () => {
    if (!formData.titulo.trim()) {
      Alert.alert('Error', 'El título del error es requerido');
      return;
    }

    if (!formData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del error es requerida');
      return;
    }

    if (!userId || !lenguaje?.id) {
      Alert.alert('Error', 'Usuario o lenguaje no válido');
      return;
    }

    setSaving(true);

    try {
      const erroresRef = collection(db, 'users', userId, 'Errores', lenguaje.id, 'errores');

      const errorData = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        solucion: formData.solucion.trim(),
        prioridad: formData.prioridad,
        estado: formData.estado,
        codigoError: formData.codigoError.trim(),
        tags: formData.tags.trim(),
        updatedAt: serverTimestamp()
      };

      if (modalMode === 'edit' && errorSeleccionado) {
        // Actualizar error existente
        const docRef = doc(db, 'users', userId, 'Errores', lenguaje.id, 'errores', errorSeleccionado.id);
        await updateDoc(docRef, errorData);
        
        Alert.alert('Éxito', 'Error actualizado correctamente');
      } else {
        // Crear nuevo error
        await addDoc(erroresRef, {
          ...errorData,
          createdAt: serverTimestamp()
        });
        
        Alert.alert('Éxito', 'Error agregado correctamente');
      }

      cerrarModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el error');
      setSaving(false);
    }
  }, [formData, modalMode, errorSeleccionado, userId, lenguaje?.id, cerrarModal]);

  const eliminarError = useCallback((error) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${error.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userId || !lenguaje?.id) {
                Alert.alert('Error', 'Usuario o lenguaje no válido');
                return;
              }

              const docRef = doc(db, 'users', userId, 'Errores', lenguaje.id, 'errores', error.id);
              await deleteDoc(docRef);
              
              Alert.alert('Éxito', 'Error eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar el error');
            }
          }
        }
      ]
    );
  }, [userId, lenguaje?.id]);

  const toggleExpandCard = useCallback((errorId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  }, []);

  const cambiarEstadoRapido = useCallback(async (error, nuevoEstado) => {
    try {
      if (!userId || !lenguaje?.id) return;

      const docRef = doc(db, 'users', userId, 'Errores', lenguaje.id, 'errores', error.id);
      await updateDoc(docRef, {
        estado: nuevoEstado,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  }, [userId, lenguaje?.id]);

  const renderErrorCard = useCallback(({ item }) => {
    const isExpanded = expandedCards.has(item.id);
    const estadoInfo = ESTADOS.find(e => e.value === item.estado);
    const prioridadInfo = PRIORIDADES.find(p => p.value === item.prioridad);

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, { borderLeftColor: prioridadInfo?.color || COLORS.primary }]}>
          {/* Header del card */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 2}>
                {item.titulo}
              </Text>
              <View style={styles.cardTags}>
                <View style={[styles.tag, { backgroundColor: estadoInfo?.color + '20' }]}>
                  <Text style={[styles.tagText, { color: estadoInfo?.color }]}>
                    {estadoInfo?.label}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: prioridadInfo?.color + '20' }]}>
                  <Text style={[styles.tagText, { color: prioridadInfo?.color }]}>
                    {prioridadInfo?.label}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleExpandCard(item.id)}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Descripción siempre visible */}
          <Text style={styles.cardDescription} numberOfLines={isExpanded ? undefined : 3}>
            {item.descripcion}
          </Text>

          {/* Contenido expandido */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {item.codigoError ? (
                <View style={styles.codeContainer}>
                  <Text style={styles.sectionTitle}>Código del error:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.codeText}>{item.codigoError}</Text>
                  </ScrollView>
                </View>
              ) : null}

              {item.solucion ? (
                <View style={styles.solutionContainer}>
                  <Text style={styles.sectionTitle}>Solución:</Text>
                  <Text style={styles.solutionText}>{item.solucion}</Text>
                </View>
              ) : null}

              {item.tags ? (
                <View style={styles.tagsContainer}>
                  <Text style={styles.sectionTitle}>Etiquetas:</Text>
                  <Text style={styles.tagsText}>{item.tags}</Text>
                </View>
              ) : null}

              {/* Cambio rápido de estado */}
              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Cambiar estado:</Text>
                <View style={styles.statusButtons}>
                  {ESTADOS.map(estado => (
                    <TouchableOpacity
                      key={estado.value}
                      style={[
                        styles.statusButton,
                        { backgroundColor: estado.color + '20' },
                        item.estado === estado.value && { backgroundColor: estado.color }
                      ]}
                      onPress={() => cambiarEstadoRapido(item, estado.value)}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        { color: estado.color },
                        item.estado === estado.value && { color: COLORS.white }
                      ]}>
                        {estado.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Footer del card */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardDate}>
              {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Fecha no disponible'}
            </Text>
            <View style={styles.cardFooterActions}>
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: COLORS.primary + '20' }]}
                onPress={() => abrirModal('edit', item)}
              >
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: COLORS.error + '20' }]}
                onPress={() => eliminarError(item)}
              >
                <Ionicons name="trash" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [expandedCards, toggleExpandCard, abrirModal, eliminarError, cambiarEstadoRapido]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bug" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>
        {busqueda.trim() || filtroEstado !== 'todos' || filtroPrioridad !== 'todos' 
          ? 'No se encontraron errores con los filtros aplicados' 
          : 'No hay errores registrados'}
      </Text>
      <Text style={styles.emptySubtext}>
        {busqueda.trim() || filtroEstado !== 'todos' || filtroPrioridad !== 'todos'
          ? 'Intenta cambiar los filtros de búsqueda'
          : 'Agrega tu primer error para comenzar a documentar soluciones'}
      </Text>
      {(!busqueda.trim() && filtroEstado === 'todos' && filtroPrioridad === 'todos') && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => abrirModal('add')}
        >
          <Text style={styles.emptyButtonText}>Agregar error</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [busqueda, filtroEstado, filtroPrioridad, abrirModal]);

  const Header = useMemo(() => (
    <>
      {/* Header principal */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Errores de {lenguaje?.nombre}</Text>
            <Text style={styles.subtitle}>Gestiona errores y soluciones</Text>
          </View>
        </View>
      </View>
      
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar errores..."
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor={COLORS.textSecondary}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filtroEstado === 'todos' && styles.filterChipActive]}
          onPress={() => setFiltroEstado('todos')}
        >
          <Text style={[styles.filterChipText, filtroEstado === 'todos' && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        {ESTADOS.map(estado => (
          <TouchableOpacity
            key={estado.value}
            style={[
              styles.filterChip,
              { borderColor: estado.color },
              filtroEstado === estado.value && { backgroundColor: estado.color }
            ]}
            onPress={() => setFiltroEstado(estado.value)}
          >
            <Text style={[
              styles.filterChipText,
              { color: estado.color },
              filtroEstado === estado.value && { color: COLORS.white }
            ]}>
              {estado.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.filterSeparator} />

        {PRIORIDADES.map(prioridad => (
          <TouchableOpacity
            key={prioridad.value}
            style={[
              styles.filterChip,
              { borderColor: prioridad.color },
              filtroPrioridad === prioridad.value && { backgroundColor: prioridad.color }
            ]}
            onPress={() => setFiltroPrioridad(prioridad.value)}
          >
            <Text style={[
              styles.filterChipText,
              { color: prioridad.color },
              filtroPrioridad === prioridad.value && { color: COLORS.white }
            ]}>
              {prioridad.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{errores.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{erroresFiltrados.length}</Text>
          <Text style={styles.statLabel}>Mostrando</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>
            {errores.filter(e => e.estado === 'resuelto').length}
          </Text>
          <Text style={styles.statLabel}>Resueltos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: COLORS.error }]}>
            {errores.filter(e => e.prioridad === 'alta').length}
          </Text>
          <Text style={styles.statLabel}>Alta prioridad</Text>
        </View>
      </View>
    </>
  ),[busqueda]);

  const FloatingButton = () => (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => abrirModal('add')}
    >
      <Ionicons name="add" size={30} color={COLORS.white} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando errores...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <FlatList
        data={erroresFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderErrorCard}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={Header}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      <FloatingButton />

      {/* Modal para agregar/editar error */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'edit' ? 'Editar error' : 'Nuevo error'}
              </Text>
              <TouchableOpacity onPress={cerrarModal} disabled={saving}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Título */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Título del error *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formData.titulo}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, titulo: text }))}
                  placeholder="Ej: Error de sintaxis en bucle for"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!saving}
                />
              </View>

              {/* Descripción */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Descripción *</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, descripcion: text }))}
                  placeholder="Describe el error detalladamente..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>

              {/* Código del error */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Código del error (opcional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.codeInput]}
                  value={formData.codigoError}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, codigoError: text }))}
                  placeholder="Pega aquí el código que causa el error..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>

              {/* Solución */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Solución</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formData.solucion}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, solucion: text }))}
                  placeholder="Explica cómo resolver el error..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>

              {/* Prioridad y Estado */}
              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.modalLabel}>Prioridad</Text>
                  <View style={styles.selectContainer}>
                    {PRIORIDADES.map(prioridad => (
                      <TouchableOpacity
                        key={prioridad.value}
                        style={[
                          styles.selectOption,
                          { borderColor: prioridad.color },
                          formData.prioridad === prioridad.value && { backgroundColor: prioridad.color }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, prioridad: prioridad.value }))}
                        disabled={saving}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          { color: prioridad.color },
                          formData.prioridad === prioridad.value && { color: COLORS.white }
                        ]}>
                          {prioridad.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.modalLabel}>Estado</Text>
                  <View style={styles.selectContainer}>
                    {ESTADOS.map(estado => (
                      <TouchableOpacity
                        key={estado.value}
                        style={[
                          styles.selectOption,
                          { borderColor: estado.color },
                          formData.estado === estado.value && { backgroundColor: estado.color }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, estado: estado.value }))}
                        disabled={saving}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          { color: estado.color },
                          formData.estado === estado.value && { color: COLORS.white }
                        ]}>
                          {estado.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Etiquetas (opcional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formData.tags}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
                  placeholder="Ej: array, loop, sintaxis (separadas por comas)"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!saving}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, saving && styles.disabledButton]} 
                onPress={cerrarModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.disabledButton]} 
                onPress={guardarError}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {modalMode === 'edit' ? 'Actualizar' : 'Guardar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  filterSeparator: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 15,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  codeContainer: {
    marginBottom: 15,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  solutionContainer: {
    marginBottom: 15,
  },
  solutionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 15,
  },
  tagsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardFooterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    padding: 8,
    borderRadius: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontFamily: 'monospace',
    backgroundColor: COLORS.background,
    minHeight: 80,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  halfWidth: {
    flex: 1,
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});


export default ErrorsList