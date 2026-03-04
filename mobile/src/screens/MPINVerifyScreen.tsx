import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthScreenProps } from '../navigation/types';

type Props = AuthScreenProps<'MPINVerify'>;

/**
 * MPIN Verification Screen
 * Allows users with existing MPIN to quickly authenticate
 * Tracks failed attempts and redirects to full login after 3 failures
 * Requirements: 2
 */
const MPINVerifyScreen: React.FC<Props> = ({ navigation }) => {
  const { verifyMPIN, isLoading, worker } = useAuthStore();
  const [mpin, setMpin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const MAX_ATTEMPTS = 3;

  /**
   * Check if worker data exists on mount
   */
  useEffect(() => {
    if (!worker) {
      Alert.alert(
        'Session Expired',
        'Please login again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    }
  }, [worker, navigation]);

  /**
   * Handle MPIN verification submission
   */
  const handleVerifyMpin = async () => {
    setError('');

    if (!/^\d{4}$/.test(mpin)) {
      setError('MPIN must be exactly 4 digits');
      return;
    }

    if (!worker?.worker_id) {
      setError('Worker ID not found. Please login again.');
      return;
    }

    try {
      await verifyMPIN(mpin);
      
      // Navigate to initialization on success
      navigation.navigate('Initialization');
    } catch (err: any) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= MAX_ATTEMPTS) {
        // Max attempts reached, redirect to full login
        Alert.alert(
          'Too Many Failed Attempts',
          'You have entered an incorrect MPIN 3 times. Please login with your password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newFailedAttempts;
        setError(
          `${err.message || 'Invalid MPIN'}. ${remainingAttempts} attempt${
            remainingAttempts > 1 ? 's' : ''
          } remaining.`
        );
        setMpin(''); // Clear MPIN input
      }
    }
  };

  /**
   * Handle MPIN input change
   */
  const handleMpinChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= 4) {
      setMpin(digits);
      setError('');
    }

    // Auto-submit when 4 digits are entered
    if (digits.length === 4) {
      // Small delay to show the 4th digit before submitting
      setTimeout(() => {
        handleVerifyMpin();
      }, 100);
    }
  };

  /**
   * Navigate to full login
   */
  const handleUsePassword = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Enter MPIN</Text>
        <Text style={styles.subtitle}>
          Enter your 4-digit MPIN to access your account
        </Text>

        {/* MPIN Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={mpin}
            onChangeText={handleMpinChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor="#999"
            editable={!isLoading && failedAttempts < MAX_ATTEMPTS}
            autoFocus
          />
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        {/* Use Password Link */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleUsePassword}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Use Password Instead</Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Forgot your MPIN? Use your password to login and setup a new MPIN.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    color: '#333',
    letterSpacing: 16,
    textAlign: 'center',
    width: '80%',
    maxWidth: 240,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  linkButton: {
    marginTop: 32,
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MPINVerifyScreen;
