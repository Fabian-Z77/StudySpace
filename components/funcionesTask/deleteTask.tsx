// firestoreService.ts
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';  // tu instancia inicializada de Firestore

/**
 * Elimina una tarea de la subcolección `users/{userId}/tasks`.
 * @param userId ID del usuario dueño de la tarea.
 * @param taskId ID de la tarea a eliminar.
 * @returns Promise<void>
 */
export async function deleteTask(userId: string, taskId: string): Promise<void> {
  try {
    // Referencia al documento: users/{userId}/tasks/{taskId}
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
    console.log(`✅ Tarea ${taskId} eliminada correctamente.`);
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    throw error;
  }
}
