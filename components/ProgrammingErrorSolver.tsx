import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import { db} from '@/firebase';
import { app } from '@/firebase';
import WebNavigation from './WebNavigation';

const auth = getAuth(app);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

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

// Lenguajes predefinidos para inicialización
const LENGUAJES_PREDEFINIDOS = [
  { nombre: 'JavaScript', color: '#F7DF1E', icon: 'logo-javascript' },
  { nombre: 'Python', color: '#3776AB', icon: 'logo-python' },
  { nombre: 'React', color: '#61DAFB', icon: 'logo-react' },
  { nombre: 'Node.js', color: '#339933', icon: 'logo-nodejs' },
  { nombre: 'Java', color: '#ED8B00', icon: 'cafe' },
  { nombre: 'C#', color: '#239120', icon: 'code-slash' },
];

function ProgrammingErrorSolver({navigation}) {
  const [lenguajes, setLenguajes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [lenguajeSeleccionado, setLenguajeSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // ID del usuario actual - En producción deberías obtenerlo de la autenticación
  const [userId] = useState('wBpZkJK0saSbvPdTm65L2L1hTAn2'); // Reemplazar con el ID real del usuario
  
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#4C6FFF',
    icon: 'code-slash'
  });

  const ICONOS_DISPONIBLES = [
    'code-slash', 'logo-javascript', 'logo-python', 'logo-react', 'logo-nodejs',
    'cafe', 'terminal', 'bug', 'construct', 'settings', 'library', 'document-text', 'server', 'desktop'
  ];

  // Cargar lenguajes desde Firestore
  useEffect(() => {
    if (!userId) return;

    const lenguajesRef = collection(db, 'users', userId, 'Errores');
    const q = query(lenguajesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lenguajesData = [];
      snapshot.forEach((doc) => {
        lenguajesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setLenguajes(lenguajesData);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar lenguajes:', error);
      Alert.alert('Error', 'No se pudieron cargar los lenguajes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Inicializar lenguajes predefinidos si no existen
  const inicializarLenguajesPredefinidos = useCallback(async () => {
    if (!userId || lenguajes.length > 0) return;

    try {
      const lenguajesRef = collection(db, 'users', userId, 'Errores');
      
      for (const lenguaje of LENGUAJES_PREDEFINIDOS) {
        await addDoc(lenguajesRef, {
          ...lenguaje,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error al inicializar lenguajes:', error);
    }
  }, [userId, lenguajes.length]);

  useEffect(() => {
    if (!loading && lenguajes.length === 0) {
      inicializarLenguajesPredefinidos();
    }
  }, [loading, lenguajes.length, inicializarLenguajesPredefinidos]);

  const lenguajesFiltrados = useMemo(() => {
    let resultado = lenguajes;
    
    if (busqueda.trim()) {
      resultado = resultado.filter(lang => 
        lang.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    
    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [lenguajes, busqueda]);

  const abrirModal = useCallback((modo, lenguaje = null) => {
    setModalMode(modo);
    setLenguajeSeleccionado(lenguaje);
    
    if (modo === 'edit' && lenguaje) {
      setFormData({
        nombre: lenguaje.nombre,
        color: lenguaje.color,
        icon: lenguaje.icon
      });
    } else {
      setFormData({
        nombre: '',
        color: '#4C6FFF',
        icon: 'code-slash'
      });
    }
    
    setModalVisible(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setLenguajeSeleccionado(null);
    setFormData({ nombre: '', color: '#4C6FFF', icon: 'code-slash' });
    setSaving(false);
  }, []);

  const guardarLenguaje = useCallback(async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del lenguaje es requerido');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    setSaving(true);

    try {
      const lenguajesRef = collection(db, 'users', userId, 'Errores');

      if (modalMode === 'edit' && lenguajeSeleccionado) {
        // Actualizar lenguaje existente
        const docRef = doc(db, 'users', userId, 'Errores', lenguajeSeleccionado.id);
        await updateDoc(docRef, {
          nombre: formData.nombre.trim(),
          color: formData.color,
          icon: formData.icon,
          updatedAt: serverTimestamp()
        });
        
        Alert.alert('Éxito', 'Lenguaje actualizado correctamente');
      } else {
        // Verificar que no exista ya un lenguaje con el mismo nombre
        const existe = lenguajes.some(lang => 
          lang.nombre.toLowerCase() === formData.nombre.toLowerCase()
        );
        
        if (existe) {
          Alert.alert('Error', 'Ya existe un lenguaje con ese nombre');
          setSaving(false);
          return;
        }

        // Crear nuevo lenguaje
        await addDoc(lenguajesRef, {
          nombre: formData.nombre.trim(),
          color: formData.color,
          icon: formData.icon,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        Alert.alert('Éxito', 'Lenguaje agregado correctamente');
      }

      cerrarModal();
    } catch (error) {
      console.error('Error al guardar lenguaje:', error);
      Alert.alert('Error', 'No se pudo guardar el lenguaje');
      setSaving(false);
    }
  }, [formData, modalMode, lenguajeSeleccionado, userId, lenguajes, cerrarModal]);

  const eliminarLenguaje = useCallback((lenguaje) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar ${lenguaje.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userId) {
                Alert.alert('Error', 'Usuario no autenticado');
                return;
              }

              const docRef = doc(db, 'users', userId, 'Errores', lenguaje.id);
              await deleteDoc(docRef);
              
              Alert.alert('Éxito', 'Lenguaje eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar lenguaje:', error);
              Alert.alert('Error', 'No se pudo eliminar el lenguaje');
            }
          }
        }
      ]
    );
  }, [userId]);


    // En ProgrammingErrorSolver
    const navegarAErrores = useCallback((lenguaje) => {
    navigation.navigate('ErrorsList', {
        lenguaje: {
        id: lenguaje.id,
        nombre: lenguaje.nombre,
        color: lenguaje.color,
        icon: lenguaje.icon
        }
    });
    }, [navigation]);

    
  const renderLanguageCard = useCallback(({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: item.color }]}
        onPress={() => navegarAErrores(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => abrirModal('edit', item)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => eliminarLenguaje(item)}
            >
              <Ionicons name="trash" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardSubtitle}>Errores y soluciones</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.statusText}>Activo</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  ), [navegarAErrores, abrirModal, eliminarLenguaje]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="code-slash" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>
        {busqueda.trim() ? 'No se encontraron lenguajes' : 'No hay lenguajes de programación'}
      </Text>
      <Text style={styles.emptySubtext}>
        {busqueda.trim() ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer lenguaje para comenzar'}
      </Text>
      {!busqueda.trim() && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => abrirModal('add')}
        >
          <Text style={styles.emptyButtonText}>Agregar lenguaje</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [busqueda, abrirModal]);

  const Header = useMemo(() => (
    <>
      <View style={styles.headerContainer}>

        <View>
          <Text style={styles.title}>ErrorSolver</Text>
          <Text style={styles.subtitle}>Buscador de soluciones</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar lenguajes..."
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
              {
        Platform.OS === 'web' ?
          <WebNavigation/>
        : ''
      }

      <View style={[{marginTop:30},styles.statsContainer]}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{lenguajes.length}</Text>
          <Text style={styles.statLabel}>Lenguajes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{lenguajesFiltrados.length}</Text>
          <Text style={styles.statLabel}>Mostrando</Text>
        </View>
      </View>
    </>
  ),[busqueda,lenguajes.length,lenguajesFiltrados.length]);

  const FloatingButton = () => (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => abrirModal('add')}
    >
      <Ionicons name="add" size={30} color={COLORS.white} />
    </TouchableOpacity>
  );

  const ColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.modalLabel}>Color del tema:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
        {['#4C6FFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'].map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.color === color && styles.colorOptionSelected
            ]}
            onPress={() => setFormData(prev => ({ ...prev, color }))}
          >
            {formData.color === color && (
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const IconPicker = () => (
    <View style={styles.iconPickerContainer}>
      <Text style={styles.modalLabel}>Icono:</Text>
      <View style={styles.iconGrid}>
        {ICONOS_DISPONIBLES.map(icon => (
          <TouchableOpacity
            key={icon}
            style={[
              styles.iconOption,
              formData.icon === icon && styles.iconOptionSelected
            ]}
            onPress={() => setFormData(prev => ({ ...prev, icon }))}
          >
            <Ionicons name={icon} size={24} color={formData.icon === icon ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando lenguajes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <FlatList
        data={lenguajesFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderLanguageCard}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={Header}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />

      <FloatingButton />

      {/* Modal para agregar/editar lenguaje */}
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
                {modalMode === 'edit' ? 'Editar lenguaje' : 'Nuevo lenguaje'}
              </Text>
              <TouchableOpacity onPress={cerrarModal} disabled={saving}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Nombre del lenguaje:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formData.nombre}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nombre: text }))}
                  placeholder="Ej: JavaScript, Python..."
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!saving}
                />
              </View>

              <ColorPicker />
              <IconPicker />

              {/* Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.modalLabel}>Vista previa:</Text>
                <View style={[styles.previewCard, { borderLeftColor: formData.color }]}>
                  <View style={[styles.previewIcon, { backgroundColor: formData.color + '20' }]}>
                    <Ionicons name={formData.icon} size={24} color={formData.color} />
                  </View>
                  <Text style={styles.previewText}>{formData.nombre || 'Nombre del lenguaje'}</Text>
                </View>
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
                onPress={guardarLenguaje}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
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
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginVertical: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  colorPickerContainer: {
    marginVertical: 20,
  },
  colorScroll: {
    marginTop: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 3,
  },
  iconPickerContainer: {
    marginVertical: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  iconOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  previewContainer: {
    marginVertical: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 10,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ProgrammingErrorSolver;