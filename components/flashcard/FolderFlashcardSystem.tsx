import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Alert, 
  FlatList,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import { createFlashcard, createFolder, deleteFlashcard, deleteFolder, getFlashcards, getFolders, reorderFlashcards, updateFlashcard, updateFolder } from './funcionesFirestore';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { shuffleArray } from './util';
import SpaceRepetition from '@/app/SpaceRepetition';







const parsePlantUMLToFlashcards = (plantUMLText) => {
  const flashcards = [];
  const lines = plantUMLText.split('\n').map(line => line.trim());
  
  let currentQuestion = '';
  let currentAnswer = '';
  let insideNote = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // NUEVO: Detectar formato card "pregunta" as cardX
    if (line.startsWith('card "') && line.includes('" as ')) {
      const questionMatch = line.match(/card\s+"([^"]+)"\s+as\s+(\w+)/);
      if (questionMatch) {
        currentQuestion = questionMatch[1];
        const cardId = questionMatch[2];
        
        // Buscar la respuesta en las siguientes líneas
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.includes(`${cardId} -> "`)) {
            const answerMatch = nextLine.match(/-> "([^"]+)"/);
            if (answerMatch) {
              currentAnswer = answerMatch[1];
              flashcards.push({
                name: currentQuestion.substring(0, 50) + (currentQuestion.length > 50 ? '...' : ''),
                question: currentQuestion,
                answer: currentAnswer
              });
              break;
            }
          }
        }
        currentQuestion = '';
        currentAnswer = '';
        continue;
      }
    }
    
    // Detectar inicio de nota (pregunta)
    if (line.startsWith('note') && line.includes(':')) {
      insideNote = true;
      currentQuestion = line.split(':')[1].trim();
      continue;
    }
    
    // Detectar fin de nota
    if (line === 'end note' && insideNote) {
      insideNote = false;
      if (currentQuestion && currentAnswer) {
        flashcards.push({
          name: currentQuestion.substring(0, 50) + (currentQuestion.length > 50 ? '...' : ''),
          question: currentQuestion,
          answer: currentAnswer
        });
        currentQuestion = '';
        currentAnswer = '';
      }
      continue;
    }
    
    // Si estamos dentro de una nota, acumular respuesta
    if (insideNote && line && !line.startsWith('note')) {
      currentAnswer += (currentAnswer ? '\n' : '') + line;
    }
    
    // Detectar clases/entidades como flashcards
    if (line.startsWith('class ') || line.startsWith('entity ')) {
      const entityName = line.split(' ')[1];
      if (entityName) {
        // Buscar métodos o atributos en las siguientes líneas
        let content = '';
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('}') && lines[j] !== '') {
          if (lines[j].startsWith('+') || lines[j].startsWith('-') || lines[j].startsWith('#')) {
            content += lines[j] + '\n';
          }
          j++;
        }
        
        if (content) {
          flashcards.push({
            name: `${entityName} - Definición`,
            question: `¿Qué es ${entityName}?`,
            answer: content.trim()
          });
        }
      }
    }
    
    // Detectar relaciones como flashcards
    if (line.includes('-->') || line.includes('..>') || line.includes('||--')) {
      const parts = line.split(/-->|\.\.>|\|\|--/);
      if (parts.length === 2) {
        const from = parts[0].trim();
        const to = parts[1].trim();
        flashcards.push({
          name: `Relación: ${from} → ${to}`,
          question: `¿Cómo se relaciona ${from} con ${to}?`,
          answer: `${from} está conectado/relacionado con ${to}`
        });
      }
    }
  }
  
  return flashcards;
};










// Consistent color palette from SpaceRepetition
const COLORS = {
  background: '#F5F7FA',
  primary: '#4C6FFF',
  primaryDark: '#3652CC',
  text: '#1A2138',
  textSecondary: '#677489',
  accent: '#FF6060',
  border: '#E2E8F0',
  white: '#FFFFFF',
  folder: '#FFD700',
  flashcard: '#4682B4',
};

// Componente principal
const FolderFlashcardSystem = ({ userId, onFlashcardPress }) => {
  const currentUser = auth.currentUser;
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [itemType, setItemType] = useState('folder'); // 'folder' o 'flashcard'
  const [currentItem, setCurrentItem] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [pregunta, setPregunta] = useState('');
  const [modalVisibleQuestion, setModalVisibleQuestion] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [modalVisibleRespuesta, setModalVisibleRespuesta] = useState(false);
  const [parentID, setParentID] = useState(null);
  const [modalEditQuestion, setModalEditQuestion] = useState(false);
  const [modalEditAnswer, setModalEditAnswer] = useState(false);
  const [newitemQuestion, setNewitemQuestion] = useState('');
  const [newitemAnswer, setNewitemAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 2. NUEVO ESTADO - Agregar junto a los otros useState
const [bulkModalVisible, setBulkModalVisible] = useState(false);
const [plantUMLText, setPlantUMLText] = useState('');

  // Cargar datos desde Firestore cuando cambia el usuario o la ruta
  useEffect(() => {
    fetchItems();
  }, [userId, currentPath]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Determina el parentId (null = raíz)
      const currentFolderId = currentPath.length === 0
        ? null
        : currentPath[currentPath.length - 1].id;

      setParentID(currentFolderId);

      // Carga carpetas y flashcards en paralelo
      const [folders, flashcards] = await Promise.all([
        getFolders(currentUser.uid, currentFolderId),
        getFlashcards(currentUser.uid, currentFolderId)
      ]);

      // Combina y ordena por posición (asumiendo que ambos tienen campo 'position')
      const combined = [...folders, ...flashcards]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      // Actualiza el estado para renderizar carpetas + flashcards
      setItems(combined);
    } catch (error) {
      console.error('Error al cargar los elementos:', error);
      Alert.alert('Error', 'No se pudieron cargar los elementos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Abrir modal para crear un nuevo elemento
  const openCreateModal = (type) => {
    setItemType(type);
    setNewItemName('');
    setModalVisible(true);
  };
  
  // Abrir modal para editar un elemento existente
  const openEditModal = (item) => {
    setCurrentItem(item);
    setNewItemName(item.name);
    setEditModalVisible(true);
  };

  // Crear un nuevo elemento (carpeta o flashcard)
  const createItem = async () => {
    if (newItemName.trim() === '') {
      Alert.alert("Error", "El nombre no puede estar vacío.");
      return;
    }

    try {
      // Determina el parentId (null en raíz)
      const parentId = currentPath.length > 0
        ? currentPath[currentPath.length - 1].id
        : null;

      // Calcula posición para orden
      const position = items.length + 1;

      let newId;
      let newItem;

      if (itemType === 'folder') {
        newId = await createFolder({
          userId: currentUser.uid,
          name: newItemName,
          parentId,
          position
        });
        // Construye el objeto que vamos a añadir al estado
        newItem = {
          id: newId,
          name: newItemName,
          type: 'folder',
          parentId,
          position,
          createdAt: new Date(),  
          updatedAt: new Date()
        };
      } else {
        newId = await createFlashcard(
          currentUser.uid,    // userId
          newItemName,        // name
          pregunta,           // question
          respuesta,          // answer
          parentId,           // parentId
          position            // position
        );
        newItem = {
          id: newId,
          name: newItemName,
          type: 'flashcard',
          question: pregunta,
          answer: respuesta,
          parentId,
          position,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Añadimos el nuevo elemento al estado para refrescar la UI
      setItems(prev => [...prev, newItem]);

      // Cerramos todos los modales
      setModalVisible(false);
      setModalVisibleQuestion(false);
      setModalVisibleRespuesta(false);

      setNewItemName('');
      setPregunta('');
      setRespuesta('');

    } catch (error) {
      console.error("Error al crear el elemento:", error);
      Alert.alert("Error", "No se pudo crear el elemento.");
    }
  };






  const showAlert = (title, message) => {
  if (Platform?.OS === 'web' || typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const confirmDialog = (title, message) => {
  if (Platform?.OS === 'web' || typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  } else {
    return new Promise(resolve => {
      Alert.alert(
        title,
        message,
        [
          { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
          { text: "Crear", onPress: () => resolve(true) }
        ]
      );
    });
  }
};






const createBulkFlashcards = async () => {
  if (plantUMLText.trim() === '') {
    showAlert("Error", "Por favor ingresa contenido PlantUML.");
    return;
  }

  try {
    const parsedFlashcards = parsePlantUMLToFlashcards(plantUMLText);

    if (parsedFlashcards.length === 0) {
      showAlert("Error", "No se pudieron generar flashcards del contenido proporcionado.");
      return;
    }

    const confirm = await confirmDialog(
      "Confirmar creación",
      `Se generarán ${parsedFlashcards.length} flashcards. ¿Continuar?`
    );

    if (!confirm) return;

    const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
    let position = items.length + 1;

    const newFlashcards = [];

    for (const flashcard of parsedFlashcards) {
      try {
        const newId = await createFlashcard(
          currentUser.uid,
          flashcard.name,
          flashcard.question,
          flashcard.answer,
          parentId,
          position
        );

        newFlashcards.push({
          id: newId,
          name: flashcard.name,
          type: 'flashcard',
          question: flashcard.question,
          answer: flashcard.answer,
          parentId,
          position,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        position++;
      } catch (error) {
        console.error(`Error creating flashcard: ${flashcard.name}`, error);
      }
    }

    // Actualizar UI
    setItems(prev => [...prev, ...newFlashcards]);
    setBulkModalVisible(false);
    setPlantUMLText('');

    showAlert("Éxito", `Se crearon ${newFlashcards.length} flashcards correctamente.`);

  } catch (error) {
    console.error("Error al procesar PlantUML:", error);
    showAlert("Error", "Hubo un problema al procesar el contenido PlantUML.");
  }
};
  


  // Eliminar un elemento, compatible con nativo y web
const deleteItem = async (item, userId) => {
  const title = 'Confirmar eliminación';
  const message = `¿Estás seguro de que deseas eliminar "${item.name}"?` +
    (item.type === 'folder' ? ' Esto eliminará también todo su contenido.' : '');

  const onDelete = async () => {
    try {
      if (item.type === 'flashcard') {
        await deleteFlashcard(userId, item.id);
      } else {
        await deleteFolder(userId, item.id);
      }
      // Refrescar la lista
      fetchItems();
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
      if (Platform.OS === 'web') {
        window.alert('Error: No se pudo eliminar el elemento.');
      } else {
        Alert.alert('Error', 'No se pudo eliminar el elemento.');
      }
    }
  };

  if (Platform.OS === 'web') {
    // En la web usamos window.confirm
    if (window.confirm(`${title}\n\n${message}`)) {
      await onDelete();
    }
  } else {
    // En iOS/Android usamos Alert.alert
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete }
      ]
    );
  }
};




  // Manejar el clic en un elemento
  const handleItemPress = (item) => {
    if (item.type === 'folder') {
      // Si es una carpeta, navegar dentro de ella
      setCurrentPath([...currentPath, item]);
    } else {
      // Si es una flashcard, llamar a la función proporcionada
      if (onFlashcardPress) {
        onFlashcardPress(item);
        console.log("Item: ", item)
      }
    }
  };
  
  // Navegar hacia atrás en la jerarquía de carpetas
  const navigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // El cambio de pantalla se manejará automáticamente a través de AuthContext
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión');
      console.error('Error al cerrar sesión:', error);
    }
  };

  const cambioModal = () => {
    if (modalVisible) {
      setModalVisible(false);
      setModalVisibleQuestion(true);
    }

    if (modalVisibleQuestion) {
      setModalVisibleQuestion(false);
      setModalVisibleRespuesta(true);
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    try {
      await updateFolder(currentUser?.uid, folderId, newName);
      // Vuelve a cargar los items para reflejar el cambio
      await fetchItems();
      setEditModalVisible(false);
      setNewItemName('');
    } catch(error) {
      Alert.alert('Error', 'No se pudo renombrar la carpeta.');
      console.log("El error es: ", error);
    }
  };

  const handleRenameFlashcard = async (flashcardId, newName, newQuestion, newAnswer) => {
    try {
      await updateFlashcard(currentUser?.uid, flashcardId, newName, newQuestion, newAnswer);
      // Vuelve a cargar los items para reflejar el cambio
      await fetchItems();
      setModalEditAnswer(false);
      setModalEditQuestion(false);
      setEditModalVisible(false);
      setNewItemName('');
      setNewitemQuestion('');
      setNewitemAnswer('');
    } catch(error) {
      Alert.alert('Error', 'No se pudo renombrar el flashcard.');
      console.log("El error es: ", error);
    }
  };

  const funcionCambioModalEdit = () => {
    if (editModalVisible) {
      setEditModalVisible(false);
      setModalEditQuestion(true);
    }
    if (modalEditQuestion) {
      setModalEditAnswer(true);
      setModalEditQuestion(false);
    }
  };

  const shuffleFlashcards = async () => {
    // 1) Filtra solo los flashcards del estado (ignora carpetas)
    const flashcards = items.filter(it => it.type === 'flashcard');
    // 2) Baraja el array
    const shuffled = shuffleArray(flashcards);
    // 3) Mapea para nuevas posiciones
    const updates = shuffled.map((fc, idx) => ({
      id: fc.id,
      position: idx + 1
    }));
    // 4) Actualiza UI localmente: mueve los flashcards al frente en su nuevo orden
    setItems(prevItems => {
      // reconstrucción: intercala carpetas sin mover y flashcards barajados
      const fixedFolders = prevItems.filter(it => it.type === 'folder');
      return [...fixedFolders, ...shuffled];
    });
    // 5) Persiste en Firestore
    try {
      await reorderFlashcards(currentUser.uid, updates);
    } catch (err) {
      console.error('Error guardando orden:', err);
      Alert.alert('Error', 'No se pudo guardar el nuevo orden.');
      fetchItems(); // recarga desde servidor
    }
  };
  
  // Header component con estadísticas y título
  const Header = () => (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FlashStudy</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <FontAwesome name="sign-out" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{items.filter(item => item.type === 'folder').length}</Text>
          <Text style={styles.statLabel}>Carpetas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{items.filter(item => item.type === 'flashcard').length}</Text>
          <Text style={styles.statLabel}>Flashcards</Text>
        </View>
      </View>



      <View style={styles.pathContainer}>













        <View style={styles.pathNav}>
          {currentPath.length > 0 && (
            <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color={COLORS.primary} />
              <Text style={styles.backText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.pathText}>
            {currentPath.length > 0 
              ? currentPath.map(folder => folder.name).join(' > ') 
              : 'Mis Flashcards'}
          </Text>
        </View>
        <TouchableOpacity onPress={shuffleFlashcards} style={styles.shuffleButton}>
          <Feather name="shuffle" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>



    </>
  );

  // Renderizar cada elemento (carpeta o flashcard)
  const renderItem = ({ item }) => (



    Platform.OS === 'web' ? 

    <View style={{width:'100%',display:'flex',alignItems:'center'}}>
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <View style={[styles.iconContainer, 
            { backgroundColor: item.type === 'folder' ? '#FFF8DC' : '#E6F0FF' }]}>
            {item.type === 'folder' ? (
              <Feather name="folder" size={24} color={COLORS.primary} />
            ) : (
              <Feather name="file-text" size={24} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.type === 'flashcard' && (
              <Text style={styles.itemSubtitle} numberOfLines={1}>
                {item.question?.substring(0, 30)}
                {item.question?.length > 30 ? '...' : ''}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Feather name="edit-2" size={18} color={COLORS.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteItem(item, currentUser?.uid)} style={styles.actionButton}>
            <Feather name="trash-2" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>

    :

      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <View style={[styles.iconContainer, 
            { backgroundColor: item.type === 'folder' ? '#FFF8DC' : '#E6F0FF' }]}>
            {item.type === 'folder' ? (
              <Feather name="folder" size={24} color={COLORS.primary} />
            ) : (
              <Feather name="file-text" size={24} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.type === 'flashcard' && (
              <Text style={styles.itemSubtitle} numberOfLines={1}>
                {item.question?.substring(0, 30)}
                {item.question?.length > 30 ? '...' : ''}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Feather name="edit-2" size={18} color={COLORS.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteItem(item, currentUser?.uid)} style={styles.actionButton}>
            <Feather name="trash-2" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>







    




  );

  // Componente para mostrar cuando no hay elementos
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {itemType === 'folder' ? (
        <Feather name="folder" size={64} color={COLORS.textSecondary} />
      ) : (
        <Feather name="file-text" size={64} color={COLORS.textSecondary} />
      )}
      <Text style={styles.emptyText}>
        {currentPath.length === 0 
          ? 'No hay elementos en la raíz' 
          : 'Esta carpeta está vacía'}
      </Text>
      <View style={styles.emptyButtonsContainer}>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: COLORS.folder }]}
          onPress={() => openCreateModal('folder')}
        >
          <Feather name="folder-plus" size={20} color={COLORS.white} />
          <Text style={styles.emptyButtonText}>Nueva carpeta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: COLORS.primary }]}
          onPress={() => openCreateModal('flashcard')}
        >
          <Feather name="file-plus" size={20} color={COLORS.white} />
          <Text style={styles.emptyButtonText}>Nueva flashcard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando elementos...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={Header}
            ListEmptyComponent={ListEmptyComponent}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Botones de acción flotantes */}
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={[styles.fabButton3, { backgroundColor: '#FF6B6B' }]} 
            onPress={() => setBulkModalVisible(true)}
          >
            <Feather name="layers" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fabButton1, { backgroundColor: COLORS.primary }]} 
            onPress={() => openCreateModal('flashcard')}
          >
            <Feather name="file-plus" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fabButton2, { backgroundColor: COLORS.folder }]} 
            onPress={() => openCreateModal('folder')}
          >
            <Feather name="folder-plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
          
          {/* Modal para crear nuevo elemento */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {itemType === 'folder' ? 'Nueva Carpeta' : 'Nueva Flashcard'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => {
                      if(itemType === 'folder'){
                        createItem();
                      }else{
                        cambioModal();
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {itemType === 'folder' ? 'Crear' : 'Siguiente'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal para crear la pregunta del Flashcard */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisibleQuestion}
            onRequestClose={() => setModalVisibleQuestion(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Pregunta
                </Text>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Escribe la pregunta..."
                  value={pregunta}
                  onChangeText={setPregunta}
                  multiline={true}
                  numberOfLines={4}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalVisibleQuestion(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => cambioModal()}
                  >
                    <Text style={styles.buttonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal para crear la respuesta del Flashcard */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisibleRespuesta}
            onRequestClose={() => setModalVisibleRespuesta(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Respuesta
                </Text>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Escribe la respuesta..."
                  value={respuesta}
                  onChangeText={setRespuesta}
                  multiline={true}
                  numberOfLines={4}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalVisibleRespuesta(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => createItem()}
                  >
                    <Text style={styles.buttonText}>Crear Flashcard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          
          {/* Modal para editar elemento */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar {currentItem?.type === 'folder' ? 'Carpeta' : 'Flashcard'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => {
                      if(currentItem?.type === 'folder'){
                        handleRenameFolder(currentItem.id, newItemName);
                      } else {
                        funcionCambioModalEdit();
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {currentItem?.type === 'folder' ? 'Guardar' : 'Siguiente'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal para editar la pregunta del elemento */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalEditQuestion}
            onRequestClose={() => setModalEditQuestion(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar pregunta</Text>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Pregunta"
                  value={newitemQuestion}
                  onChangeText={setNewitemQuestion}
                  multiline={true}
                  numberOfLines={4}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalEditQuestion(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => funcionCambioModalEdit()}
                  >
                    <Text style={styles.buttonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal para editar la respuesta del flashcard */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalEditAnswer}
            onRequestClose={() => setModalEditAnswer(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar Respuesta</Text>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Respuesta"
                  value={newitemAnswer}
                  onChangeText={setNewitemAnswer}
                  multiline={true}
                  numberOfLines={4}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalEditAnswer(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => handleRenameFlashcard(currentItem.id, newItemName, newitemQuestion, newitemAnswer)}
                  >
                    <Text style={styles.buttonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>






          <Modal
            animationType="slide"
            transparent={true}
            visible={bulkModalVisible}
            onRequestClose={() => setBulkModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                <Text style={styles.modalTitle}>Generar Flashcards desde PlantUML</Text>
                <Text style={styles.modalSubtitle}>
                  Pega tu código PlantUML aquí. Se generarán flashcards automáticamente.
                </Text>
                <TextInput
                  style={[styles.input, styles.bulkTextInput]}
                  placeholder={`Ejemplo:
          @startuml
          class Usuario {
            +String nombre
            +String email
            +login()
            +logout()
          }

          note right: ¿Qué métodos tiene Usuario?
          login() y logout() son los métodos principales
          end note

          Usuario --> Perfil
          @enduml`}
                  value={plantUMLText}
                  onChangeText={setPlantUMLText}
                  multiline={true}
                  numberOfLines={15}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setBulkModalVisible(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={createBulkFlashcards}
                  >
                    <Text style={styles.buttonText}>Generar Flashcards</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

// Estilos
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
  pathContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.background,
  },
  pathNav: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  pathText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  shuffleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: Platform.OS === 'web' ? 650 : '100%'
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },

  itemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginVertical: 20,
    textAlign: 'center',
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    gap: 15,
  },
  fabButton: {
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

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonTextCancel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },

  fabButton1:{
  position: 'absolute',
  right: 20,
  bottom: 100,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: COLORS.primary,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},
fabButton2:{
  position: 'absolute',
  right: 20,
  bottom: 30,
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











    modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  bulkTextInput: {
    height: 250,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  fabButton3: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});






export default FolderFlashcardSystem;