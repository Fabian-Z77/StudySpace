import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../components/AuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="nuevaTarea" />
          <Stack.Screen name="SpaceRepetition" />
          <Stack.Screen name="crearCuenta" />
          <Stack.Screen name="LoginScreen" />
          <Stack.Screen name="MenuRepetition" />
          <Stack.Screen name="FlashcardCaja" />
          <Stack.Screen name="Space" />
          <Stack.Screen name="TabsNavigator" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
} 