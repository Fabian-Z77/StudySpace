import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { TextInput } from "react-native-gesture-handler";

export default function Contenido() {
  const [editable, setEditable] = useState(false);
  const inputRef = useRef(null);
  const [estadoInput,setEstadoInput] = useState(false);
  const [estadoTexto,setEstadoText] = useState(true)
  const [nombre,setNombre] = useState([]);


  

  const activarInput = () => {
    setEstadoInput(true);
  }

  const desactivarInput = () => {
    setEstadoInput(false)
  }

  const activarText = () => {
    setEstadoText(true);
  }

  const desactivarText = () => {
    setEstadoText(false);
  }

  const editar = () => {
    desactivarText();
    activarInput();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }


  const mostrarNombre = () => {
    activarText();
    desactivarInput();
  }


  useEffect(() => {
    console.log("El nombre es: ", nombre)
  },[nombre])


  return (
      <View style={style.container}>
        <View
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexDirection: "row",
            borderBottomWidth: 1,
            height: 85,
            alignItems: "center",
            marginTop:30
          }}
        >
          





        <TouchableOpacity>
          <AntDesign name="folder1" size={30} color="blue" />
        </TouchableOpacity>


        <TouchableOpacity>
          <MaterialCommunityIcons name="card-multiple-outline" size={30} color="blue" />
        </TouchableOpacity>

        
        </View>

        <View
          style={{
            backgroundColor: "transparent",
            flex:1,
            borderRadius: 20,
            marginTop: 50,
            padding: 10,
          }}
        >
          <View
            style={{
              width: "100%",
              borderWidth: 2,
              height: 55,
              borderRadius: 20,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="card-multiple-outline"
              size={30}
              color="blue"
              style={{ marginLeft: 10 }}
            />

            {estadoTexto && <Text style={{width:200}}>{nombre}</Text>}
            {estadoInput && <TextInput style={{width:200}} value={nombre} onChangeText={setNombre} onSubmitEditing={mostrarNombre} 
            ref={inputRef}/>}


            <TouchableOpacity onPress={() => editar()}>
              <AntDesign name="edit" size={30} color="black" style={{ marginLeft: 10 }} />
            </TouchableOpacity>


            <TouchableOpacity>
                <AntDesign name="delete" size={30} color="red" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    zIndex: 1,
    elevation: 8,
    borderWidth: 2
  },
});
