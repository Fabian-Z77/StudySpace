// firestoreService.ts
import { 
  collection,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';  // tu instancia inicializada

/**
 * Recupera todas las tareas de un usuario, ordenadas por el campo `position`.
 * @param userId ID del usuario.
 * @returns Promise de un array de objetos tarea.
 */
export async function getTasks(userId: string) {
  try {
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const q = query(tasksCol, orderBy('position', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    throw error;
  }
}
