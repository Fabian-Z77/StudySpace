import React, { useEffect, useState, useCallback, useMemo } from 'react';

import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import Card from '@/components/card';
import { DiferenciaEnDias } from '../components/funciones/calculo_fecha';
import { DiaEnLetra } from '../components/funciones/calculo_dia_en_letra';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTasks } from '@/components/funcionesTask/GetTask';
import { auth, signOut } from '../firebase';
import { deleteOldTasks } from '@/components/funcionesTask/deleteOldTasks-';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { DiferenciaEnMinutos } from '@/components/funcionesTask/DiferenciaEnMinutos';
import 'intl';
import 'intl/locale-data/jsonp/en'; // o 'es' para español
import { ScrollView } from 'react-native-gesture-handler';
import { Link, useLocation } from 'react-router-dom';




const COLORS = {
  background: '#F5F7FA',
  primary: '#4C6FFF',
  primaryDark: '#3652CC',
  text: '#1A2138',
  textSecondary: '#677489',
  accent: '#FF6060',
  border: '#E2E8F0',
  white: '#FFFFFF',
  filterActive: '#4C6FFF',
  filterInactive: '#E2E8F0',
};

const WebNavigation = () => {


const navigation = useNavigation();



  return(
  
    <View style={styles.webNavContainer}>
      {/* Space Repetition */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('Space')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='home' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Space Repetition
          </Text>
        </View>
      </TouchableOpacity>
  
      {/* Flashcard App */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('flashcardApp')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='book' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Flashcard App
          </Text>
        </View>
      </TouchableOpacity>
  
      {/* Programming Error */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('ProgrammingError')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='code' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Programming Error
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  
  
  );




}



const styles = StyleSheet.create({
      // Estilos de WebNavigation actualizados
      webNavContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 8,
        marginTop: 20,
        marginHorizontal: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
      },
      webNavButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }),
      },
      webNavButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      webNavIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
      },
      webNavButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 16,
      },
    
})

export default WebNavigation;