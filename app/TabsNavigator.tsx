// app/TabsNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../components/home';
import SpaceRepetition from './SpaceRepetition';
import TodasLasTareas from '@/components/TodasLasTareas';
import FlashcardApp from '@/components/flashcard/FlashcardApp';
import ProgrammingErrorSolver from '@/components/ProgrammingErrorSolver';

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Space') {
            iconName = 'home';
          } else if (route.name === 'flashcardApp') {
            iconName = 'book';
          } else if (route.name === 'ProgrammingError') {
            iconName = 'code';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Space" component={SpaceRepetition} />
      <Tab.Screen name="flashcardApp" component={FlashcardApp} />
      <Tab.Screen name="ProgrammingError" component={ProgrammingErrorSolver} />
    </Tab.Navigator>
  );
}
