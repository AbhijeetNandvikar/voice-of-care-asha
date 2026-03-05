import React, { useState } from 'react';
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

type Props = AuthScreenProps<'MPINSetup'>;

/**
 * MPIN Setup Screen
 * Allows first-time users to set up a 4-digit MPIN for quick authentication
 * Requirements: 2
 */
const MPINSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { setupMPIN, isLoading } = useAuthStore();
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [error, setError] = useState('');

  /**
   * Validate MPIN format
   */
  const validateMpin = (): boolean => {
    if (!/^\d{4}$/.test(mpin)) {
      setError('MPIN must be exactly 4 digits');
      return false;
    }
    if (mpin !== confirmMpin) {
      setError('MPINs do not match. Please try again.');
      return false;
    }
    return true;
  };

  /**
   * Handle MPIN setup submission
   */
  const handleSetupMpin = async () => {
    setError('');

    if (!validateMpin()) {
      return;
    }

    try {
      await setupMPIN(mpin);
      
      Alert.alert(
        'Success',
        'MPIN setup successful! You can now use your MPIN for quick login.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to initialization flow
              navigation.navigate('Initialization');
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to setup MPIN. Please try again.');
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
  };

  /**
   * Handle confirm MPIN input change
   */
  const handleConfirmMpinChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= 4) {
      setConfirmMpin(digits);
      setError('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Setup MPIN</Text>
        <Text style={styles.subtitle}>
          Create a 4-digit MPIN for quick and secure access to your account
        </Text>

        {/* MPIN Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter MPIN</Text>
          <TextInput
            style={styles.input}
            value={mpin}
            onChangeText={handleMpinChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="Enter 4-digit MPIN"
            placeholderTextColor="#999"
            editable={!isLoading}
          />
        </View>

        {/* Confirm MPIN Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm MPIN</Text>
          <TextInput
            style={styles.input}
            value={confirmMpin}
            onChangeText={handleConfirmMpinChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="Re-enter 4-digit MPIN"
            placeholderTextColor="#999"
            editable={!isLoading}
          />
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Setup Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSetupMpin}
          disabled={isLoading || !mpin || !confirmMpin}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Setup MPIN</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You will use this MPIN for quick login on subsequent app launches
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
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#333',
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MPINSetupScreen;
