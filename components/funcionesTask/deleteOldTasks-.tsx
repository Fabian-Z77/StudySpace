import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Elimina tareas con más de 90 días desde su fecha_Actual.
 * @param userId ID del usuario.
 */
export async function deleteOldTasks(userId: string): Promise<void> {
  if (!userId) {
    console.warn('⚠️ No se proporcionó un ID de usuario');
    return;
  }

  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const snapshot = await getDocs(tasksRef);

    const hoy = new Date();

    const tareasAntiguas = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const fechaStr = data.fecha_Actual;
      if (!fechaStr) return false;

      const fecha = parseISO(fechaStr); // Convierte string a Date
      const diasPasados = differenceInDays(hoy, fecha);

      return diasPasados >= 90; // Más de 3 meses
    });

    // Eliminar cada tarea antigua
    const deletePromises = tareasAntiguas.map((docSnap) =>
      deleteDoc(doc(db, 'users', userId, 'tasks', docSnap.id))
    );

    await Promise.all(deletePromises);

    console.log(`🗑️ Se eliminaron ${tareasAntiguas.length} tareas con más de 90 días.`);
  } catch (error) {
    console.error('❌ Error al eliminar tareas antiguas:', error);
    throw error;
  }
}
