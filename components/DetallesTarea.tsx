import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteTask } from './funcionesTask/deleteTask';
import { updateTask } from './funcionesTask/updateTask';
import { auth } from '../firebase';

const COLORS = {
  background: '#F5F7FA',
  primary: '#4C6FFF',
  primaryDark: '#3652CC',
  text: '#1A2138',
  textSecondary: '#677489',
  accent: '#FF6060',
  border: '#E2E8F0',
  white: '#FFFFFF',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

function DetallesTarea() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tarea } = route.params;
  const [loading, setLoading] = useState(false);
  const [completada, setCompletada] = useState(tarea.completada || false);

  const userId = auth.currentUser?.uid;

  // Calcular color de prioridad basado en días_faltantes
  const prioridadColor = tarea.dias_faltantes < 3 
    ? COLORS.red 
    : tarea.dias_faltantes < 5 
      ? COLORS.yellow 
      : COLORS.green;

  const prioridadTexto = tarea.dias_faltantes < 3 
    ? 'Alta' 
    : tarea.dias_faltantes < 5 
      ? 'Media' 
      : 'Baja';

  // Función para eliminar tarea
  const eliminarTarea = useCallback(async () => {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás seguro de que deseas eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              if (!userId) {
                throw new Error('Usuario no autenticado');
              }
              await deleteTask(tarea.id, userId);
              Alert.alert("Éxito", "Tarea eliminada correctamente");
              navigation.goBack();
            } catch (error) {
              console.error('Error al eliminar tarea:', error);
              Alert.alert("Error", "No se pudo eliminar la tarea");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [tarea.id, userId, navigation]);

  // Función para marcar como completada/pendiente
  const toggleCompletada = useCallback(async () => {
    setLoading(true);
    try {
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }
      
      const nuevoEstado = !completada;
      
      await deleteTask(userId,tarea.id, );

      
      setCompletada(nuevoEstado);
      
      Alert.alert(
        "Éxito", 
        nuevoEstado ? "Tarea marcada como completada" : "Tarea marcada como pendiente"
      );
    } catch (error) {
      console.error('Error al actualizar estado de tarea:', error);
      Alert.alert("Error", "No se pudo actualizar el estado de la tarea");
    } finally {
      setLoading(false);
    }
  }, [tarea, completada, userId]);

  // Función para editar tarea
  const editarTarea = useCallback(() => {
    navigation.navigate('EditarTarea', { tarea });
  }, [navigation, tarea]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Procesando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalles de tarea</Text>
        <TouchableOpacity onPress={eliminarTarea}>
          <Ionicons name="trash-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta principal */}
        <View style={styles.card}>
          <View style={styles.tareaHeader}>
            <Text style={styles.tareaTitulo}>{tarea.tarea}</Text>
            <View style={[styles.prioridadBadge, { backgroundColor: prioridadColor }]}>
              <Text style={styles.prioridadText}>{prioridadTexto}</Text>
            </View>
          </View>
          
          {/* Estado de la tarea */}
          <View style={[styles.estadoBadge, { backgroundColor: completada ? COLORS.green : COLORS.yellow }]}>
            <Text style={styles.estadoText}>
              {completada ? 'Completada' : 'Pendiente'}
            </Text>
          </View>
          
          {/* Información de fecha */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="calendar-day" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Día:</Text>
              <Text style={styles.infoValue}>{tarea.dia}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <FontAwesome5 name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>{tarea.fecha_Actual}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <FontAwesome5 name="hourglass-half" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Días faltantes:</Text>
              <Text style={[styles.infoValue, { color: prioridadColor, fontWeight: 'bold' }]}>
                {tarea.dias_faltantes}
              </Text>
            </View>
          </View>
          
          {/* Detalles adicionales */}
          {tarea.detalles && (
            <View style={styles.detallesSection}>
              <Text style={styles.detalleTitulo}>Detalles:</Text>
              <Text style={styles.detalleContenido}>{tarea.detalles}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Botones de acción */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={editarTarea}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            completada ? styles.pendienteButton : styles.completarButton
          ]} 
          onPress={toggleCompletada}
        >
          <Ionicons 
            name={completada ? "close-circle-outline" : "checkmark-circle-outline"} 
            size={20} 
            color={COLORS.white} 
          />
          <Text style={styles.actionButtonText}>
            {completada ? 'Marcar pendiente' : 'Marcar completada'}
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tareaTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  prioridadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  prioridadText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  estadoText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    width: 110,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  detallesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  detalleTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  detalleContenido: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  completarButton: {
    backgroundColor: COLORS.green,
  },
  pendienteButton: {
    backgroundColor: COLORS.yellow,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default DetallesTarea;