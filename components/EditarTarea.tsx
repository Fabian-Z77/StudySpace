import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateTask } from './funcionesTask/updateTask';
import { auth } from '../firebase';
import DateTimePicker from '@react-native-community/datetimepicker';

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

function EditarTarea() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tarea } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Estados para los campos de la tarea
  const [titulo, setTitulo] = useState(tarea.tarea || '');
  const [detalles, setDetalles] = useState(tarea.detalles || '');
  const [fecha, setFecha] = useState(new Date(tarea.fecha_Actual));
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const userId = auth.currentUser?.uid;

  // Formatea la fecha para mostrar en el botón
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // formato YYYY-MM-DD
  };

  // Manejador para cuando cambia la fecha en el DatePicker
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || fecha;
    setShowDatePicker(Platform.OS === 'ios'); // En iOS se mantiene abierto, en Android se cierra
    setFecha(currentDate);
  };

  // Validar los datos del formulario
  const validarFormulario = () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título de la tarea es obligatorio');
      return false;
    }
    
    if (fecha < new Date(new Date().setHours(0, 0, 0, 0))) {
      Alert.alert(
        'Advertencia', 
        'La fecha seleccionada es anterior a hoy. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => guardarCambios() }
        ]
      );
      return false;
    }
    
    return true;
  };

  // Función para guardar los cambios
  const guardarCambios = async () => {
    setLoading(true);
    try {
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }
      
      // Preparar los datos actualizados
      const tareaActualizada = {
        ...tarea,
        tarea: titulo,
        detalles: detalles,
        fecha_Actual: formatDate(fecha)
      };
      
      await updateTask(userId, tarea.id,  tareaActualizada);
      
      Alert.alert(
        "Éxito", 
        "Tarea actualizada correctamente",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      Alert.alert("Error", "No se pudo actualizar la tarea");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el botón guardar
  const handleGuardar = () => {
    if (validarFormulario()) {
      guardarCambios();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Guardando cambios...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Tarea</Text>
          <TouchableOpacity onPress={handleGuardar}>
            <Ionicons name="save-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Formulario */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Título de la tarea</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ingresa el título de la tarea"
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.datePickerButtonText}>{formatDate(fecha)}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date(2030, 11, 31)}
              />
            )}
            
            <Text style={styles.label}>Detalles (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={detalles}
              onChangeText={setDetalles}
              placeholder="Ingresa detalles adicionales de la tarea"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
        
        {/* Botón de guardar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleGuardar}
          >
            <Ionicons name="save-outline" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
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

export default EditarTarea;