import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import TabsNavigator from './TabsNavigator';

export default function WebLayout() {
  return (
    <View style={styles.container}>
      <TabsNavigator />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 