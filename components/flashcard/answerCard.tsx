import React, { useState } from 'react'
import {View,Text, StyleSheet, Platform, TouchableOpacity} from 'react-native'


export default function Answer(){



    return(

        <TouchableOpacity>
            <View style={styles.card}>
                <View style={styles.textContainer}>
                    <Text style={styles.questionText}>La capital de francia es la Serena</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
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
})