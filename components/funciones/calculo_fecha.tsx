/**
 * Calcula la diferencia en días completos entre hoy y la fecha indicada.
 *
 * @param fechaUsuario - Fecha proporcionada por el usuario (string ISO o Date).
 * @returns Número de días de diferencia (positivo si la fecha de usuario es anterior a hoy).
 */
export function DiferenciaEnDias(fechaUsuario: string | Date): number {
    // 1) Convertir a Date si viene como string
    const fecha = typeof fechaUsuario === 'string'
      ? new Date(fechaUsuario)
      : fechaUsuario;
  
    // 2) Obtener ambas fechas en UTC a medianoche,
    //    para comparar sólo la parte de la fecha (sin horas/minutos)
    const hoy = new Date();
    const utcHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const utcUsuario = Date.UTC(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );
  
    // 3) Constante de milisegundos por día
    const MILIS_POR_DIA = 1000 * 60 * 60 * 24;
  
    // 4) Calcular diferencia y convertir a entero
    const diffDias = Math.floor(((utcUsuario - utcHoy) / MILIS_POR_DIA) + 1);
    return diffDias;
  }
  