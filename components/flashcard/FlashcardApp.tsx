import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, TouchableOpacity, Touchable, Text, Platform } from 'react-native';
import FolderFlashcardSystem from './FolderFlashcardSystem';
import FlashcardViewer from './FlashcardViewer';
import FlashcardEditModal from './FlashcardEditModal'; // Vamos a crear este componente después
import {
  getUserItems,
  createFolder,
  createFlashcard,
  updateFolder,
  updateFlashcard,
  deleteFolder,
  deleteFlashcard,
  moveItem
} from './getUserItems';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@react-navigation/elements';
import { useAuth } from '../AuthContext';
import { auth } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import WebNavigation from '../WebNavigation';


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

const FlashcardApp = ({ userId }) => {
  // Estado para la flashcard seleccionada y visibilidad del visor
  const navigation = useNavigation();
  const [selectedFlashcard, setSelectedFlashcard] = useState(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Estado para la navegación entre flashcards
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderFlashcards, setFolderFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { uid } = useAuth()


  
  
useEffect(() => {
  if (selectedFlashcard) {
    const folderId = selectedFlashcard.folderId ?? null; // fallback a null si es undefined
    loadFolderFlashcards(folderId);
    console.log("📂 folderId seleccionado:", folderId);
  }
}, [selectedFlashcard]);
  
  // Cargar todas las flashcards de una carpeta específica
  const loadFolderFlashcards = async (folderId) => {
    const currentUser = auth.currentUser
    const uidUser = currentUser?.uid;
    try {
      const items = await getUserItems(uidUser, folderId ?? null);
      // Filtrar solo las flashcards
      const flashcards = items.filter(item => item.type === 'flashcard');
      setFolderFlashcards(flashcards);
      
      // Establecer el índice actual basado en la flashcard seleccionada
      if (selectedFlashcard) {
        const index = flashcards.findIndex(card => card.id === selectedFlashcard.id);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
      
      // Guardar referencia a la carpeta actual
      setCurrentFolder(folderId ?? null); // si usas esto en estado
    } catch (error) {
      console.error('Error al cargar las flashcards de la carpeta:', error);
      Alert.alert('Error', 'No se pudieron cargar las flashcards.');
    }
  };
  
  // Manejar la selección de una flashcard
  const handleFlashcardPress = (flashcard) => {
    setSelectedFlashcard(flashcard);
    setIsViewerVisible(true);
  };
  
  // Navegar a la siguiente flashcard
  const handleNextFlashcard = () => {
    if (currentIndex < folderFlashcards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedFlashcard(folderFlashcards[nextIndex]);
    }
  };
  
  // Navegar a la flashcard anterior
  const handlePreviousFlashcard = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedFlashcard(folderFlashcards[prevIndex]);
    }
  };
  
  // Abrir el modal de edición para una flashcard
  const handleEditFlashcard = (flashcard) => {
    setIsViewerVisible(false); // Cerrar el visor
    setIsEditModalVisible(true); // Abrir el modal de edición
  };
  
  // Marcar una flashcard como revisada
  const handleMarkReviewed = async (flashcard) => {
    try {
      // Actualizar la flashcard en Firestore
      await updateFlashcard(flashcard.id, {
        lastReviewed: new Date(),
        reviewCount: (flashcard.reviewCount || 0) + 1
      });
      
      // Actualizar la flashcard localmente
      const updatedFlashcard = {
        ...flashcard,
        lastReviewed: new Date(),
        reviewCount: (flashcard.reviewCount || 0) + 1
      };
      setSelectedFlashcard(updatedFlashcard);
      
      // Actualizar la lista de flashcards
      const updatedFlashcards = folderFlashcards.map(card => 
        card.id === flashcard.id ? updatedFlashcard : card
      );
      setFolderFlashcards(updatedFlashcards);
    } catch (error) {
      console.error('Error al marcar la flashcard como revisada:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de revisión.');
    }
  };
  
  // Guardar los cambios de una flashcard editada
  const handleSaveFlashcard = async (updatedFlashcard) => {
    try {
      // Actualizar en Firestore
      await updateFlashcard(updatedFlashcard.id, {
        name: updatedFlashcard.name,
        content: updatedFlashcard.content
      });
      
      // Actualizar localmente
      setSelectedFlashcard(updatedFlashcard);
      
      // Actualizar en la lista
      if (folderFlashcards.length > 0) {
        const updatedFlashcards = folderFlashcards.map(card => 
          card.id === updatedFlashcard.id ? updatedFlashcard : card
        );
        setFolderFlashcards(updatedFlashcards);
      }
      
      setIsEditModalVisible(false);
      setIsViewerVisible(true); // Volver al visor
    } catch (error) {
      console.error('Error al guardar la flashcard:', error);
      Alert.alert('Error', 'No se pudo guardar la flashcard.');
    }
  };

  useEffect(() => {
    console.log("user ID: ", uid)
  },[])
  
  
  
  return (
    <View style={styles.container}>


              {
                Platform.OS === 'web' ?
                  <WebNavigation/>
                : ''
              }
      
      {/* Sistema de carpetas y flashcards */}
      <FolderFlashcardSystem
        userId={userId}
        onFlashcardPress={handleFlashcardPress}
      />
      
      {/* Visor de flashcard */}
      <FlashcardViewer
        flashcard={selectedFlashcard}
        isVisible={isViewerVisible}
        onClose={() => setIsViewerVisible(false)}
        onEdit={handleEditFlashcard}
        onNext={handleNextFlashcard}
        onPrevious={handlePreviousFlashcard}
        hasNext={currentIndex < folderFlashcards.length - 1}
        hasPrevious={currentIndex > 0}
        onMarkReviewed={handleMarkReviewed}
      />
      
      {/* Modal de edición de flashcard */}
      {selectedFlashcard && (
        <FlashcardEditModal
          flashcard={selectedFlashcard}
          isVisible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setIsViewerVisible(true); // Volver al visor
          }}
          onSave={handleSaveFlashcard}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
    input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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

export default FlashcardApp;