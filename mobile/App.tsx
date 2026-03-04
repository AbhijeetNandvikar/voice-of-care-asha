import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import './src/i18n';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Voice of Care (ASHA)</Text>
      <Text style={styles.subtitle}>Mobile App Initialized</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
