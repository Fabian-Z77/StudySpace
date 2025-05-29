// Estructura de Firestore para Sistema de Carpetas y Flashcards

import { collection, getDocs, getFirestore, orderBy, query, where } from "firebase/firestore";

/*
Colecciones principales:
- users: Información básica de usuarios
- folders: Carpetas que pueden contener flashcards u otras carpetas
- flashcards: Las tarjetas de estudio individuales

Estructura:

users/
  {userId}/
    email: string
    displayName: string
    createdAt: timestamp

folders/
  {folderId}/
    name: string
    userId: string (referencia al propietario)
    parentId: string | null (null si es carpeta raíz, ID de otra carpeta si es subcarpeta)
    createdAt: timestamp
    updatedAt: timestamp
    position: number (para ordenar carpetas)

flashcards/
  {flashcardId}/
    name: string
    userId: string (referencia al propietario)
    folderId: string (referencia a la carpeta que lo contiene)
    content: {
      question: string
      answer: string
      // Campos adicionales según necesidad
    }
    createdAt: timestamp
    updatedAt: timestamp
    position: number (para ordenar flashcards)
    tags: array<string>
    lastReviewed: timestamp | null
    reviewCount: number
*/

// Firebase/Firestore imports
/**
 * Obtiene carpetas y flashcards de un usuario según el folder padre indicado.
 * @param userId ID del usuario.
 * @param parentFolderId ID de la carpeta padre, o null para la raíz.
 */
export async function getUserItems(
  userId: string,
  parentFolderId: string | null = null
) {
  const db = getFirestore();
  try {
    // 1) Carpeta raíz o subcarpeta
    const folderConstraints = [
      where('userId', '==', userId),
      // parentFolderId === null → queremos parentId == null
      // parentFolderId !== null → parentId == parentFolderId
      where('parentId', '==', parentFolderId)
    ];
    const foldersQ = query(
      collection(db, 'folders'),
      ...folderConstraints,
      orderBy('position')
    );
    const foldersSnap = await getDocs(foldersQ);
    const folders = foldersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'folder' as const
    }));

    // 2) Sólo si es una carpeta (no en la raíz) cargo flashcards
    let flashcards: Array<any> = [];
    if (parentFolderId !== null) {
      const flashQ = query(
        collection(db, 'users', userId, 'flashcards'),
        where('folderId', '==', parentFolderId),
        orderBy('position')
      );
      const flashSnap = await getDocs(flashQ);
      flashcards = flashSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'flashcard' as const
      }));
    }

    return [...folders, ...flashcards];
  } catch (error) {
    console.error('Error al obtener los elementos del usuario:', error);
    throw error;
  }
}

// Función para crear una nueva carpeta
export const createFolder = async (userId, name, parentId = null) => {
  const db = firebase.firestore();
  
  try {
    // Obtener la posición para la nueva carpeta
    const lastFolderQuery = await db.collection('folders')
      .where('userId', '==', userId)
      .where('parentId', '==', parentId)
      .orderBy('position', 'desc')
      .limit(1)
      .get();
    
    let position = 0;
    if (!lastFolderQuery.empty) {
      position = lastFolderQuery.docs[0].data().position + 1;
    }
    
    // Crear la nueva carpeta
    const folderData = {
      name,
      userId,
      parentId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      position
    };
    
    const docRef = await db.collection('folders').add(folderData);
    return {
      id: docRef.id,
      ...folderData,
      type: 'folder'
    };
  } catch (error) {
    console.error('Error al crear la carpeta:', error);
    throw error;
  }
};

// Función para crear una nueva flashcard
export const createFlashcard = async (userId, folderId, name, content) => {
  const db = firebase.firestore();
  
  try {
    // Obtener la posición para la nueva flashcard
    const lastFlashcardQuery = await db.collection('flashcards')
      .where('userId', '==', userId)
      .where('folderId', '==', folderId)
      .orderBy('position', 'desc')
      .limit(1)
      .get();
    
    let position = 0;
    if (!lastFlashcardQuery.empty) {
      position = lastFlashcardQuery.docs[0].data().position + 1;
    }
    
    // Crear la nueva flashcard
    const flashcardData = {
      name,
      userId,
      folderId,
      content,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      position,
      tags: [],
      lastReviewed: null,
      reviewCount: 0
    };
    
    const docRef = await db.collection('flashcards').add(flashcardData);
    return {
      id: docRef.id,
      ...flashcardData,
      type: 'flashcard'
    };
  } catch (error) {
    console.error('Error al crear la flashcard:', error);
    throw error;
  }
};

// Función para actualizar una carpeta
export const updateFolder = async (folderId, updateData) => {
  const db = firebase.firestore();
  
  try {
    // No permitir actualizar userId para evitar cambios de propiedad
    const { userId, ...allowedUpdates } = updateData;
    
    // Añadir timestamp de actualización
    const dataToUpdate = {
      ...allowedUpdates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('folders').doc(folderId).update(dataToUpdate);
    
    return {
      id: folderId,
      ...dataToUpdate
    };
  } catch (error) {
    console.error('Error al actualizar la carpeta:', error);
    throw error;
  }
};

// Función para actualizar una flashcard
export const updateFlashcard = async (flashcardId, updateData) => {
  const db = firebase.firestore();
  
  try {
    // No permitir actualizar userId para evitar cambios de propiedad
    const { userId, ...allowedUpdates } = updateData;
    
    // Añadir timestamp de actualización
    const dataToUpdate = {
      ...allowedUpdates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('flashcards').doc(flashcardId).update(dataToUpdate);
    
    return {
      id: flashcardId,
      ...dataToUpdate
    };
  } catch (error) {
    console.error('Error al actualizar la flashcard:', error);
    throw error;
  }
};

// Función para eliminar una carpeta (y opcionalmente su contenido)
export const deleteFolder = async (folderId, deleteContents = true) => {
  const db = firebase.firestore();
  
  try {
    // Si deleteContents es true, eliminar también todas las carpetas y flashcards contenidas
    if (deleteContents) {
      // Primero, obtener todas las subcarpetas
      const subFoldersSnapshot = await db.collection('folders')
        .where('parentId', '==', folderId)
        .get();
      
      // Eliminar recursivamente cada subcarpeta
      const subFolderDeletions = subFoldersSnapshot.docs.map(doc => 
        deleteFolder(doc.id, true)
      );
      
      // Obtener y eliminar todas las flashcards en esta carpeta
      const flashcardsSnapshot = await db.collection('flashcards')
        .where('folderId', '==', folderId)
        .get();
      
      const flashcardDeletions = flashcardsSnapshot.docs.map(doc => 
        db.collection('flashcards').doc(doc.id).delete()
      );
      
      // Esperar a que se completen todas las eliminaciones
      await Promise.all([...subFolderDeletions, ...flashcardDeletions]);
    } else {
      // Si no eliminamos el contenido, reubicar todos los elementos a la carpeta padre
      // Primero, obtener la información de la carpeta para saber cuál es su padre
      const folderDoc = await db.collection('folders').doc(folderId).get();
      if (!folderDoc.exists) {
        throw new Error('La carpeta no existe');
      }
      
      const folderData = folderDoc.data();
      const parentId = folderData.parentId;
      
      // Actualizar todas las subcarpetas para que apunten al padre de la carpeta que se elimina
      const subFoldersSnapshot = await db.collection('folders')
        .where('parentId', '==', folderId)
        .get();
      
      const subFolderUpdates = subFoldersSnapshot.docs.map(doc => 
        db.collection('folders').doc(doc.id).update({ 
          parentId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
      );
      
      // Actualizar todas las flashcards para que apunten al padre de la carpeta que se elimina
      const flashcardsSnapshot = await db.collection('flashcards')
        .where('folderId', '==', folderId)
        .get();
      
      const flashcardUpdates = flashcardsSnapshot.docs.map(doc => 
        db.collection('flashcards').doc(doc.id).update({ 
          folderId: parentId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
      );
      
      // Esperar a que se completen todas las actualizaciones
      await Promise.all([...subFolderUpdates, ...flashcardUpdates]);
    }
    
    // Finalmente, eliminar la carpeta
    await db.collection('folders').doc(folderId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la carpeta:', error);
    throw error;
  }
};

// Función para eliminar una flashcard
export const deleteFlashcard = async (flashcardId) => {
  const db = firebase.firestore();
  
  try {
    await db.collection('flashcards').doc(flashcardId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la flashcard:', error);
    throw error;
  }
};

// Función para mover un elemento (carpeta o flashcard) a otra carpeta
export const moveItem = async (itemId, itemType, targetFolderId) => {
  const db = firebase.firestore();
  
  try {
    // Verificar que la carpeta destino existe (excepto si es null, que significa raíz)
    if (targetFolderId !== null) {
      const targetFolder = await db.collection('folders').doc(targetFolderId).get();
      if (!targetFolder.exists) {
        throw new Error('La carpeta destino no existe');
      }
    }
    
    // Determinar la colección según el tipo de elemento
    const collection = itemType === 'folder' ? 'folders' : 'flashcards';
    const fieldToUpdate = itemType === 'folder' ? 'parentId' : 'folderId';
    
    // Actualizar la referencia
    await db.collection(collection).doc(itemId).update({
      [fieldToUpdate]: targetFolderId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Error al mover el ${itemType}:`, error);
    throw error;
  }
};

// Función para buscar elementos por nombre
export const searchItems = async (userId, searchTerm) => {
  const db = firebase.firestore();
  const searchTermLower = searchTerm.toLowerCase();
  
  try {
    // Buscar carpetas que coincidan
    const foldersSnapshot = await db.collection('folders')
      .where('userId', '==', userId)
      .get();
    
    const matchingFolders = foldersSnapshot.docs
      .filter(doc => doc.data().name.toLowerCase().includes(searchTermLower))
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'folder'
      }));
    
    // Buscar flashcards que coincidan
    const flashcardsSnapshot = await db.collection('flashcards')
      .where('userId', '==', userId)
      .get();
    
    const matchingFlashcards = flashcardsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return (
          data.name.toLowerCase().includes(searchTermLower) ||
          (data.content.question && data.content.question.toLowerCase().includes(searchTermLower)) ||
          (data.content.answer && data.content.answer.toLowerCase().includes(searchTermLower))
        );
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'flashcard'
      }));
    
    return [...matchingFolders, ...matchingFlashcards];
  } catch (error) {
    console.error('Error al buscar elementos:', error);
    throw error;
  }
};