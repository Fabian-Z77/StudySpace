// firestoreService.ts
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase'; // tu instancia inicializada de Firestore

/**
 * Añade una nueva tarea para un usuario.
 * @param userId ID del usuario.
 * @param taskData Objeto con los campos de la tarea:
 *   - tarea: título de la tarea
 *   - descripcion: detalle de la tarea
 *   - fecha_Actual: fecha en formato 'YYYY-MM-DD'
 *   - dia: día de la semana en letra
 *   - categoria: categoría de la tarea
 * @returns Promise<string> ID del documento creado.
 */
export async function addTask(
  userId: string,
  taskData: {
    tarea: string;
    descripcion: string;
    fecha_Actual: string;
    dia: string;
    categoria: string;
  }
): Promise<string> {
  try {
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const docRef = await addDoc(tasksCol, {
      ...taskData,
      userId,
      position: Date.now(),  // opcional: para ordenar luego
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al crear tarea:', error);
    throw error;
  }
}
