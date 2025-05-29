/**
 * Retorna el día de la semana en español para una fecha dada en formato 'YYYY-MM-DD'.
 *
 * @param fechaStr - Fecha en formato 'YYYY-MM-DD' (por ejemplo: '2025-04-29').
 * @returns El nombre del día de la semana en minúsculas (por ejemplo: 'martes').
 */
export function DiaEnLetra(fechaStr: string): string {
  // 1) Descomponer la cadena en año, mes y día
  const [year, month, day] = fechaStr.split('-').map(Number);

  // 2) Construir la fecha con el constructor local (evita desfases UTC)
  const fecha = new Date(year, month - 1, day);

  // 3) Array con los nombres de los días en español
  const diasSemana = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];

  // 4) getDay() devuelve 0 = domingo, 1 = lunes, ..., 6 = sábado
  return diasSemana[fecha.getDay()];
}
