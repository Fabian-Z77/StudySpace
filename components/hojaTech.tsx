import { Platform, StyleSheet, View, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function HojaDeTrabajo() {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    cargarTexto();
  }, []);

  useEffect(() => {
    const guardar = setTimeout(() => {
      guardarTexto();
    }, 1000); // Guarda 1 segundo después de dejar de escribir

    return () => clearTimeout(guardar);
  }, [texto]);

  const cargarTexto = async () => {
    try {
      const textoGuardado = await AsyncStorage.getItem('texto_guardado');
      if (textoGuardado) {
        setTexto(textoGuardado);
      }
    } catch (error) {
      console.error('Error al cargar el texto:', error);
    }
  };

  const guardarTexto = async () => {
    try {
      await AsyncStorage.setItem('texto_guardado', texto);
      console.log('Texto guardado');
    } catch (error) {
      console.error('Error al guardar el texto:', error);
    }
  };

  const handleKeyDown = (event: any) => {
    // Verifica si la tecla presionada es TAB
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevenir el comportamiento predeterminado (cambiar de foco)
      const tabSpace = '    '; // Aquí definimos el espacio de la tabulación como 4 espacios.
      setTexto((prevTexto) => prevTexto + tabSpace); // Agregar el espaciado al contenido
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.hoja}>
          <TextInput
            placeholder="Empieza a escribir aquí..."
            placeholderTextColor="#aaa"
            multiline
            textAlignVertical="top"
            style={styles.texto}
            value={texto}
            onChangeText={setTexto}
            onKeyDown={handleKeyDown} // Agregar el manejador de la tecla TAB
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  hoja: {
    width: Platform.OS === 'web' ? '50%' : '80%', // 60% en Web, 90% en Android/iOS
    height: Platform.OS === 'web' ? '100%' : '90%', // 60% en Web, 90% en Android/iOS
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    minHeight: 600,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  texto: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    flex: 1,
  },
});
