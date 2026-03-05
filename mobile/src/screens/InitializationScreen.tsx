import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { initializeApp } from '../services/initService';
import { InitData } from '../types';
import { AuthScreenProps } from '../navigation/types';

type Props = AuthScreenProps<'Initialization'>;

/**
 * InitializationScreen
 * Displays loading state while fetching and seeding initial data
 * Shown after first login and MPIN setup
 */
const InitializationScreen: React.FC<Props> = ({ navigation }) => {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Connecting to server...');
  const [initData, setInitData] = useState<InitData | null>(null);

  useEffect(() => {
    performInitialization();
  }, []);

  const performInitialization = async () => {
    try {
      setError(null);
      setProgress('Connecting to server...');

      // Fetch and seed data
      setProgress('Downloading your data...');
      const data = await initializeApp();
      
      setInitData(data);
      setProgress('Setting up your workspace...');

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress('Initialization complete!');
      
      // Navigate to main app (will be handled by RootNavigator based on auth state)
      // The auth state is already set, so navigation will automatically switch to Main
      setTimeout(() => {
        // No need to navigate - the RootNavigator will handle this based on isAuthenticated
      }, 500);
      
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Initialization failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    performInitialization();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Initialization Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              If the problem persists, please check your internet connection or contact your supervisor.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Setting Up Your Account</Text>
        
        <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
        
        <Text style={styles.progressText}>{progress}</Text>

        {initData && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Loading {initData.beneficiaries.length} beneficiaries...
            </Text>
            <Text style={styles.statsText}>
              Loading {initData.templates.length} visit templates...
            </Text>
          </View>
        )}

        <Text style={styles.infoText}>
          This may take a few moments. Please don't close the app.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: 30,
  },
  progressText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    marginTop: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    minWidth: 200,
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default InitializationScreen;
