import React, { useEffect, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Platform, 
  Animated, 
  TouchableOpacity 
} from 'react-native';

// Constantes para facilitar el mantenimiento y consistencia
const COLORS = {
  primary: '#e53935',     // Rojo más moderno
  text: '#212121',        // Negro intenso para texto principal
  textSecondary: '#757575', // Gris para texto secundario
  background: '#ffffff',  // Fondo blanco
  shadow: '#000000',      // Color para sombras
};

const SIZES = {
  cardPadding: 16,
  borderRadius: 12,
  fontSize: {
    title: 20,
    subtitle: 18,
    counter: 22,
  }
};

const Card = ({ 
  dia, 
  tarea, 
  dias_faltantes,
  minutos_faltantes, // Nueva prop para minutos
  unidad_tiempo = 'días', // Unidad de tiempo (días o minutos)
  prioridad = 'alta', // Valores posibles: 'alta', 'media', 'baja'
  onPress 
}) => {
  // Creamos un valor animado para efectos visuales
  const animatedValue = new Animated.Value(0);
  
  // Mapeamos los niveles de prioridad a colores
  const prioridadColors = {
    alta: COLORS.primary,
    media: '#FB8C00', // Naranja
    baja: '#43A047'   // Verde
  };
  
  // Color del indicador basado en la prioridad
  const indicatorColor = prioridadColors[prioridad] || COLORS.primary;
  
  // Efecto de entrada al montar el componente
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Transformaciones basadas en el valor animado
  const animatedStyle = {
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  // Manejo de la acción al presionar
  const handlePress = () => {
    if (onPress) {
      onPress({ dia, tarea, dias_faltantes, unidad_tiempo, prioridad });
    }
  };


    // Determinar qué valor mostrar basado en la unidad de tiempo
  const valorMostrado = unidad_tiempo === 'minutos' ? minutos_faltantes : dias_faltantes;





  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Tarea: ${tarea}, Día: ${dia}, Faltan ${valorMostrado} ${unidad_tiempo}`}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={[
          styles.indicator, 
          { backgroundColor: indicatorColor }
        ]} />
        
        <View style={styles.contentContainer}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dia}</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.taskContainer}>
            <Text 
              adjustsFontSizeToFit 
              numberOfLines={2} 
              style={styles.taskTitle}
            >
              {tarea}
            </Text>
            
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>{valorMostrado}</Text>
              <Text style={styles.daysLabel}>
                {unidad_tiempo}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: Platform.OS === 'web' ? 700 : 400,
    alignSelf: 'center',
    height: 120,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.background,
    marginVertical: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
      },
    }),
  },
  indicator: {
    width: 8,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    paddingHorizontal: SIZES.cardPadding,
    justifyContent: 'center',
    width: 120,
  },
  dateText: {
    fontSize: SIZES.fontSize.title,
    fontWeight: '500',
    color: COLORS.text,
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
    marginRight: SIZES.cardPadding,
  },
  taskContainer: {
    flex: 1,
    paddingRight: SIZES.cardPadding,
    justifyContent: 'space-between',
    height: '80%',
  },
  taskTitle: {
    fontSize: SIZES.fontSize.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterText: {
    fontSize: SIZES.fontSize.counter,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  daysLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

// Optimización con memo para evitar renderizados innecesarios
export default memo(Card);