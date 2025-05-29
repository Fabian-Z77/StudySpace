import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet } from 'react-native';
import { 
  db,
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy 
} from '../firebase';

const ExampleComponent = () => {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);

  // Referencia a la colección
  const itemsCollectionRef = collection(db, 'items');

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const q = query(itemsCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
    });

    // Limpiar al desmontar
    return () => unsubscribe();
  }, []);

  // Agregar un documento
  const addItem = async () => {
    if (text.trim() === '') return;
    
    try {
      await addDoc(itemsCollectionRef, {
        text: text,
        createdAt: new Date(),
      });
      setText('');
    } catch (error) {
      console.error('Error al agregar el documento: ', error);
    }
  };

  // Eliminar un documento
  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (error) {
      console.error('Error al eliminar el documento: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firestore Example</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribe algo..."
        />
        <Button title="Agregar" onPress={addItem} />
      </View>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.text}</Text>
            <Button title="Eliminar" onPress={() => deleteItem(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 40,
    backgroundColor:'white'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  itemText: {
    fontSize: 16,
  },
});

export default ExampleComponent;