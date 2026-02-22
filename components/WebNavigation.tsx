import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import 'intl';
import 'intl/locale-data/jsonp/en'; // o 'es' para español
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';




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

      {/* Flashcard Caja */}
      <TouchableOpacity
        style={styles.webNavButton}
        onPress={() => navigation.navigate('flashcardCaja')}
      >
        <View style={styles.webNavButtonContent}>
          <View style={styles.webNavIconContainer}>
            <Ionicons name='layers' size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.webNavButtonText}>
            Flashcard Caja
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  
  
  );




}



const styles = StyleSheet.create({
  webNavContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 10,
    marginTop: 24,
    marginBottom: 16,
    alignSelf: 'center',
    maxWidth: 700,
    width: '96%',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      marginLeft: 'auto',
      marginRight: 'auto',
    }),
  },
  webNavButton: {
    flex: 1,
    minWidth: 100,
    maxWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#f5f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  webNavButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  webNavIconContainer: {
    width: 32,  
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    boxShadow: '0 1px 6px 0 #4C6FFF22',
  },
  webNavButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});

export default WebNavigation;