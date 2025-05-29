import {
  getFirestore,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Firestore,
  writeBatch
} from 'firebase/firestore';

import { app, db } from '../../firebase';





// --- Users ---

/**
 * Crea o actualiza un usuario
 * @param {string} userId
 * @param {string} email
 * @param {string} displayName
 */
export async function saveUser(userId, email, displayName) {
  const db = getFirestore(app);
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      email,
      displayName,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
  return ref;
}

/**
 * Obtiene datos de un usuario
 * @param {string} userId
 */
export async function getUser(userId) {
  const db = getFirestore (app);
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// --- Folders ---

/**
 * Crea una carpeta
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.userId
 * @param {string|null} data.parentId
 * @param {number} data.position
 */
export async function createFolder({
  userId,
  name,
  parentId = null,
  position = 0
}: {
  userId: string;
  name: string;
  parentId?: string | null;
  position?: number;
}) {
  const db = getFirestore(app);
  const ref = await addDoc(collection(db, 'users', userId, 'folders'), {
    name,
    parentId,
    position,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

/**
 * Obtiene carpetas de un usuario y directorio dado
 * @param {string} userId
 * @param {string|null} parentId  — null para la raíz
 * @returns {Promise<Array<Object>>} lista de carpetas ordenadas por posición
 */
export async function getFolders(userId, parentId = null) {
  const db = getFirestore(app);

  // Navega a la subcolección "folders" dentro de "users/{userId}"
  const colRef = collection(db, 'users', userId, 'folders');

  // Filtra por parentId (null = raíz) y ordena
  const q = query(
    colRef,
    where('parentId', '==', parentId),
    orderBy('position', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    type: 'folder',
    ...doc.data()
  }));
}

/**
 * Actualiza el nombre de una carpeta
 * @param {string} userId    — ID del usuario (subcolección users/{userId}/folders)
 * @param {string} folderId  — ID de la carpeta a actualizar
 * @param {string} newName   — Nuevo nombre para la carpeta
 */
export async function updateFolder(userId, folderId, newName) {
  const db = getFirestore(app);
  const folderRef = doc(db, 'users', userId, 'folders', folderId);

  console.log("sadasdasds");

  try {
    await updateDoc(folderRef, {
      name: newName,
      updatedAt: serverTimestamp()
    });
    console.log(`Carpeta ${folderId} renombrada a "${newName}"`);
  } catch (error) {
    console.error('Error actualizando carpeta:', error);
    throw error;
  }
}

/**
 * Elimina una carpeta
 * @param {string} folderId
 */
export async function deleteFolder(uid,folderId) {
  const db = getFirestore(app);
  const ref = doc(db, 'users', uid, 'folders', folderId);
  await deleteDoc(ref);
}

// --- Flashcards ---

/**
 * Crea una flashcard
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.userId
 * @param {string} data.folderId
 * @param {Object} data.content
 * @param {Array<string>} [data.tags]
 * @param {number} [data.position]
 */






console.log('🔥 db importado en firestoreFunctions (top level):', db);


export async function createFlashcard(
  userId: string,
  name: string,
  question: string,
  answer: string,
  parentId: string | null = null,
  position: number = 0
) {
  const db = getFirestore(app);
  const ref = await addDoc(collection(db, 'users', userId, 'flashcards'), {
    name,
    question,
    answer,
    parentId,
    position,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}


/**
 * Obtiene flashcards de un usuario y carpeta
 * @param {string} userId
 * @param {string} folderId
 */

export async function getFlashcards(userId, folderId = null) {
  const db = getFirestore(app);
  const col = collection(db, 'users', userId, 'flashcards');

  // Si folderId es null, filtramos donde parentId == null
  const q = query(
    col,
    where('parentId', '==', folderId)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    type: 'flashcard',   // así luego renderizas íconos, etc.
    ...doc.data()
  }));
}


/**
 * Actualiza una flashcard
 * @param {string} flashcardId
 * @param {Object} updates
 */
export async function updateFlashcard(userId,flashcardId,newName,newQuestion,newAnswer) {
  const db = getFirestore(app);
  const folderRef = doc(db, 'users', userId, 'flashcards', flashcardId);

  console.log("sadasdasds");

  try {
    await updateDoc(folderRef, {
      name: newName,
      updatedAt: serverTimestamp(),
      question: newQuestion,
      answer: newAnswer,
    });
    console.log(`Flashcards ${flashcardId} renombrada a "${newName}"`);
  } catch (error) {
    console.error('Error actualizando flashcard:', error);
    throw error;
  }
}

/**
 * Elimina una flashcard
 * @param {string} flashcardId
 */
export async function deleteFlashcard(uid, flashcardId) {
  const db = getFirestore(app);
  // Asegúrate de usar la misma estructura de colecciones que en getFlashcards:
  const ref = doc(db, 'users', uid, 'flashcards', flashcardId);
  try {
    await deleteDoc(ref);
    console.log("Flashcard eliminada:", flashcardId,uid);
  } catch (error) {
    console.error("Error al eliminar flashcard:", error);
    throw error;
  }
}

export async function reorderFlashcards(userId, orderedItems) {
  const db = getFirestore(app);
  const batch = writeBatch(db);
  orderedItems.forEach(({ id, position }) => {
    const ref = doc(db, 'users', userId, 'flashcards', id);
    batch.update(ref, { position, updatedAt: new Date() });
  });
  await batch.commit();
}