// firestoreService.ts
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';  // tu instancia inicializada de Firestore

/**
 * Actualiza campos de una tarea en la subcolección `users/{userId}/tasks`.
 * @param userId ID del usuario dueño de la tarea.
 * @param taskId ID de la tarea a actualizar.
 * @param updates Objeto con los campos a actualizar. Por ejemplo:
 *   {
 *     tarea?: string;
 *     descripcion?: string;
 *     fecha_Actual?: string;
 *     dia?: string;
 *     categoria?: string;
 *     position?: number;
 *   }
 * @returns Promise<void>
 */
export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<{
    tarea: string;
    descripcion: string;
    fecha_Actual: string;
    dia: string;
    categoria: string;
    position: number;
  }>
): Promise<void> {
  try {
    // Referencia al documento: users/{userId}/tasks/{taskId}
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, updates);
    console.log(`✅ Tarea ${taskId} actualizada correctamente.`);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    throw error;
  }
}
