import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { updateFlashcard } from './funcionesFirestore';
import { auth } from '@/firebase';
import { useNavigation } from '@react-navigation/native';


const FlashcardEditModal = ({ flashcard, isVisible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  
  // Cargar datos de la flashcard cuando se abre el modal
  useEffect(() => {
    if (flashcard && isVisible) {
      setName(flashcard.name || '');
      setQuestion(flashcard.content?.question || '');
      setAnswer(flashcard.content?.answer || '');
      setTags(flashcard.tags || []);
    }
  }, [flashcard, isVisible]);
  



    const handleRenameFlashcard = async (flashcardId, newName, newQuestion, newAnswer) => {
      try {
        await updateFlashcard(currentUser?.uid, flashcardId, newName, newQuestion, newAnswer);
        navigation.replace('flashcardApp');

      } catch(error) {
        Alert.alert('Error', 'No se pudo renombrar el flashcard.');
        console.log("El error es: ", error);
      }
    };
  

  

  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Encabezado */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {flashcard?.id ? 'Editar' : 'Nueva'} Flashcard
            </Text>
            <TouchableOpacity onPress={() => handleRenameFlashcard(flashcard?.id,name,question,answer)} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Nombre de la flashcard */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la flashcard"
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Pregunta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pregunta</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={question}
                onChangeText={setQuestion}
                placeholder="Escribe la pregunta aquí"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            </View>
            
            {/* Respuesta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Respuesta</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Escribe la respuesta aquí"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            </View>
            
            {/* Etiquetas */}
            <View style={styles.inputGroup}>

              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    marginRight: 6,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#4682B4',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FlashcardEditModal;