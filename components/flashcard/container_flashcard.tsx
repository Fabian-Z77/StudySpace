import React, { useEffect, useState } from 'react'
import {View, Text, StyleSheet, ImageBackground, Platform, Animated, Easing, TouchableOpacity} from 'react-native'
import Answer from './answerCard';
import Question from './questionCard';
import Contenido from './contenidos';

export default function Flashcard(){
    const image = { uri: 'https://wallpapers.com/images/hd/lightning-like-blue-smoke-6ki2phbsajjfbqdy.jpg' };

    const [selected,setSelected] = useState(true);
    






    








    return(
        <ImageBackground source={image} resizeMode="cover" style={styles.image}>

        
            <View style={styles.container}>





            <TouchableOpacity>
                <View style={{backgroundColor:'transparent',borderWidth:2,borderColor:'yellow',borderRadius:10,padding:10}}>
                    <Text style={{color:'white'}}>Contenido</Text>
                </View>
            </TouchableOpacity>

            <Text style={{color:'white',fontSize:20,marginBottom:10, marginTop:60}}>1/5</Text>









            {/* Componente */}
                <Question/>






            {/* Botones para avanzar */}
                <View style={{width:'100%',marginTop:50,flexDirection:'row',padding:20,justifyContent:'space-between'}}>

                    <TouchableOpacity style={{backgroundColor:'transparent', width:'40%', height:50,justifyContent:'center',
                            borderWidth:2,borderColor:'red',borderRadius:20
                        }}>
                        <View>
                            <Text style={{color:'white', textAlign:'center'}}>No me acuerdo</Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity style={{backgroundColor:'transparent', width:'40%', height:50,justifyContent:'center',borderWidth:2
                        ,borderColor:'green',borderRadius:20
                    }}>
                        <View>
                            <Text style={{color:'white', textAlign:'center'}}>Me acuerdo</Text>
                        </View>
                    </TouchableOpacity>

                </View>








            </View>

        </ImageBackground>
    

    )
}


const styles = StyleSheet.create({
    container:{
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    }, 
    image: {
        flex: 1,
    },

    card: {
        width: 300,
        height: 400,
        borderWidth: 4, // Reducido para un look más moderno
        borderColor: '#012858',
        borderRadius: 24, // Aumentado para suavizar
        backgroundColor: '#F8F9FA', // Color de fondo más suave
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        // Sombras para ambas plataformas
        shadowColor: '#012858',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8, // Para Android
        // Efectos de transformación para interacciones
        transform: [{ rotateZ: '-0.5deg' }], // Ligera rotación para efecto dinámico
        // Mejoras visuales adicionales
        overflow: 'hidden', // Para bordes perfectos con elementos hijos
        position: 'relative',
        
    },
        
        textContainer: {
            flex: 1,
            justifyContent: 'space-around',
            paddingVertical: 20,
        },
        
        questionText: {
            fontFamily: Platform.select({ ios: 'SF-Pro-Rounded-Bold', android: 'Roboto-Bold' }),
            fontSize: 24,
            color: '#012858',
            lineHeight: 34,
            textAlign: 'center',
            letterSpacing: 0.5,
            marginBottom: 16,
        },
        
        answerContainer: {
            backgroundColor: '#f8f9fa',
            borderRadius: 12,
            padding: 14,
            marginVertical: 6,
        },
        
        answerText: {
            fontFamily: Platform.select({ ios: 'SF-Pro-Rounded-Regular', android: 'Roboto-Regular' }),
            fontSize: 18,
            color: '#2d3436',
            lineHeight: 28,
            textAlign: 'left',
            letterSpacing: 0.3,
        },
        
        selectedAnswer: {
            backgroundColor: '#012858',
            borderWidth: 2,
            borderColor: '#ffffff',
        },
        
        selectedAnswerText: {
            color: '#ffffff',
            fontWeight: '600',
        }
    



    

})