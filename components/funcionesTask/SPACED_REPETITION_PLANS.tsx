// Planes de repetición espaciada
const SPACED_REPETITION_PLANS = {
  standard: {
    name: 'Estándar (7 repasos)',
    description: 'Plan recomendado para la mayoría de los casos',
    intervals: [1, 6, 14, 30, 66, 150, 360]
  },
  sm2: {
    name: 'Anki/SuperMemo (SM-2)',
    description: 'Basado en el algoritmo SM-2 con factor de facilidad',
    intervals: [1, 6] // Los siguientes intervalos se calcularán dinámicamente
  },
  wozniak: {
    name: 'Wozniak (1985)',
    description: 'Plan original de SuperMemo para vocabulario',
    intervals: [0.007, 1, 7, 30, 180] // 0.007 ≈ 10min en días
  },
  leitner5: {
    name: 'Leitner (5 cajas)',
    description: 'Sistema de 5 niveles con intervalos crecientes',
    intervals: [1, 2, 4, 8, 16]
  },
  leitner3: {
    name: 'Leitner Simplificado (3 cajas)',
    description: 'Sistema simplificado de 3 niveles',
    intervals: [1, 3, 7]
  },
  custom137: {
    name: 'Esquema 1-3-7-14...',
    description: 'Plan popular con intervalos iniciales cortos',
    intervals: [1, 3, 7, 14, 30, 60, 120]
  },
  none: {
    name: 'Sin repetición',
    description: 'Solo una fecha sin repeticiones programadas',
    intervals: []
  },
    DEBUG: {
    name: 'DEBUG',
    intervals: [1/1440, 2/1440], // 1 y 2 minutos
  },
};

export default SPACED_REPETITION_PLANS;