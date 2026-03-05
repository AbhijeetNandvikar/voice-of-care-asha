import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { AuthScreenProps } from '../navigation/types';

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateInputs = (): boolean => {
    // Clear previous errors
    setValidationError('');
    clearError();

    if (!workerId.trim()) {
      setValidationError('Worker ID is required');
      return false;
    }

    if (workerId.trim().length < 3) {
      setValidationError('Please enter a valid Worker ID');
      return false;
    }

    // Validate password
    if (!password) {
      setValidationError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      await login(workerId.trim(), password);

      // After successful login, check if MPIN is set up
      const worker = useAuthStore.getState().worker;
      
      if (worker?.mpin_hash) {
        // MPIN already set up, navigate to MPIN verification
        navigation.navigate('MPINVerify');
      } else {
        // First-time login, navigate to MPIN setup
        navigation.navigate('MPINSetup');
      }
    } catch (err: any) {
      // Error is already set in the store
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    }
  };

  const displayError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('welcome')}</Text>
            <Text style={styles.subtitle}>Voice of Care (ASHA)</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Worker ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('worker_id')}</Text>
              <TextInput
                style={styles.input}
                value={workerId}
                onChangeText={(text) => {
                  setWorkerId(text);
                  setValidationError('');
                  clearError();
                }}
                placeholder="e.g. AW000001"
                keyboardType="default"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setValidationError('');
                  clearError();
                }}
                placeholder="Enter password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Error Message */}
            {displayError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('login')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              For assistance, contact your medical officer
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
