// src/components/funciones/calculo_minutos.ts
import { differenceInMinutes, parseISO } from 'date-fns';

/**
 * Retorna el número de minutos transcurridos desde `fechaStr` hasta ahora.
 * @param fechaStr Fecha en formato 'YYYY-MM-DD' o ISO completo.
 */
export function DiferenciaEnMinutos(fechaStr: string): number {
  const fecha = parseISO(fechaStr);
  return differenceInMinutes(new Date(), fecha);
}
