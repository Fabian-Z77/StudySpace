// Función para detectar la zona horaria del usuario
const detectarZonaHoraria = () => {
  try {
    // Método moderno: Intl.DateTimeFormat
    const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Zona horaria detectada:', zonaHoraria);
    return zonaHoraria;
  } catch (error) {
    console.error('Error detectando zona horaria:', error);
    // Fallback: usar offset manual
    const offset = new Date().getTimezoneOffset();
    const horas = Math.abs(Math.floor(offset / 60));
    const minutos = Math.abs(offset % 60);
    const signo = offset > 0 ? '-' : '+';
    
    console.log(`Fallback: UTC${signo}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
    return `UTC${signo}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
};

// Función para obtener fecha actual en la zona horaria del usuario
const obtenerFechaLocal = () => {
  const zonaHoraria = detectarZonaHoraria();
  const ahora = new Date();
  
  try {
    // Convertir a zona horaria del usuario
    const fechaLocal = new Date(ahora.toLocaleString("en-US", {timeZone: zonaHoraria}));
    
    // Formatear a YYYY-MM-DD
    const año = fechaLocal.getFullYear();
    const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaLocal.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  } catch (error) {
    console.error('Error formateando fecha local:', error);
    // Fallback: usar fecha local directa
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  }
};

// Función formatearFecha actualizada que usa la zona horaria del usuario
const formatearFecha = (fecha) => {
  const zonaHoraria = detectarZonaHoraria();
  
  // Si la fecha es null o undefined, usar fecha actual local
  if (!fecha) {
    return obtenerFechaLocal();
  }
  
  // Si ya es string en formato correcto, devolverla tal cual
  if (typeof fecha === 'string') {
    // Verificar si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    // Si es string pero en otro formato, intentar parsearlo
    try {
      const fechaParseada = new Date(fecha);
      const fechaLocal = new Date(fechaParseada.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es un objeto Date
  if (fecha instanceof Date) {
    try {
      const fechaLocal = new Date(fecha.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    }
  }
  
  // Si es timestamp numérico (milisegundos)
  if (typeof fecha === 'number') {
    try {
      const fechaObj = new Date(fecha);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es timestamp de Firestore (objeto con seconds)
  if (fecha && typeof fecha === 'object' && fecha.seconds) {
    try {
      const fechaObj = new Date(fecha.seconds * 1000);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Si es timestamp de Firestore (objeto con _seconds)
  if (fecha && typeof fecha === 'object' && fecha._seconds) {
    try {
      const fechaObj = new Date(fecha._seconds * 1000);
      const fechaLocal = new Date(fechaObj.toLocaleString("en-US", {timeZone: zonaHoraria}));
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      return obtenerFechaLocal();
    }
  }
  
  // Fallback final
  return obtenerFechaLocal();
};

// Función para mostrar información de zona horaria (opcional para debug)
const mostrarInfoZonaHoraria = () => {
  const zonaHoraria = detectarZonaHoraria();
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset();
  const offsetHoras = Math.abs(Math.floor(offset / 60));
  const offsetMinutos = Math.abs(offset % 60);
  const signo = offset > 0 ? '-' : '+';
  
  console.log('=== INFORMACIÓN ZONA HORARIA ===');
  console.log('Zona horaria:', zonaHoraria);
  console.log('Offset UTC:', `${signo}${offsetHoras.toString().padStart(2, '0')}:${offsetMinutos.toString().padStart(2, '0')}`);
  console.log('Fecha/hora local:', ahora.toLocaleString());
  console.log('Fecha/hora UTC:', ahora.toUTCString());
  console.log('Fecha formateada:', obtenerFechaLocal());
  console.log('================================');
};

// Uso en tu código:
// const hoy = obtenerFechaLocal(); // Fecha actual en zona horaria del usuario

// Para debug (opcional):
// mostrarInfoZonaHoraria();