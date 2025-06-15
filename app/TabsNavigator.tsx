// app/TabsNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


// Componente para la navegación web
const WebNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'MenuRepetition', icon: 'menu', label: 'Menú Principal' },
    { name: 'flashcardApp', icon: 'book', label: 'Flashcards' },
    { name: 'ProgrammingError', icon: 'code', label: 'Programación' },
  ];

  return (
    <View style={styles.webContainer}>
      <View style={styles.webContent}>
        <Slot />
      </View>
      <View style={styles.webBottomNav}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.webNavItem,
              pathname === `/${item.name}` && styles.webNavItemActive
            ]}
            onPress={() => router.push(`/${item.name}`)}
          >
            <Ionicons 
              name={item.icon as any} 
              size={24} 
              color={pathname === `/${item.name}` ? '#4C6FFF' : '#677489'} 
            />
            <Text style={[
              styles.webNavText,
              pathname === `/${item.name}` && styles.webNavTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function TabsNavigator() {
  if (Platform.OS === 'web') {
    return <WebNavigation />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'MenuRepetition') {
            iconName = 'menu';
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
      <Tabs.Screen 
        name="MenuRepetition"
        options={{
          title: 'Menú Principal'
        }}
      />
      <Tabs.Screen 
        name="flashcardApp"
        options={{
          title: 'Flashcards'
        }}
      />
      <Tabs.Screen 
        name="ProgrammingError"
        options={{
          title: 'Programación'
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  webContent: {
    flex: 1,
    overflow: 'auto',
  },
  webBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  webNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  webNavItemActive: {
    backgroundColor: 'rgba(76, 111, 255, 0.1)',
  },
  webNavText: {
    marginTop: 4,
    fontSize: 12,
    color: '#677489',
  },
  webNavTextActive: {
    color: '#4C6FFF',
    fontWeight: '500',
  },
});
