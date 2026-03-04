/**
 * I18n Usage Examples
 * 
 * This file demonstrates various ways to use internationalization
 * in the Voice of Care mobile app.
 */

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, t } from '../utils/i18n';

/**
 * Example 1: Basic Translation with useTranslation Hook
 */
export function BasicTranslationExample() {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome')}</Text>
      <Text>{t('dashboard_subtitle')}</Text>
    </View>
  );
}

/**
 * Example 2: Language Switching
 */
export function LanguageSwitchExample() {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  
  const handleLanguageChange = async (lang: 'en' | 'hi') => {
    try {
      await changeLanguage(lang);
      setCurrentLang(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text>{t('language_preference')}: {currentLang}</Text>
      <Button 
        title={t('english')} 
        onPress={() => handleLanguageChange('en')} 
      />
      <Button 
        title={t('hindi')} 
        onPress={() => handleLanguageChange('hi')} 
      />
    </View>
  );
}

/**
 * Example 3: Translation with Interpolation
 */
export function InterpolationExample() {
  const { t } = useTranslation();
  const workerName = 'Priya Sharma';
  const attemptsLeft = 2;
  
  return (
    <View style={styles.container}>
      {/* Simple interpolation */}
      <Text>{t('greeting', { name: workerName })}</Text>
      
      {/* Numeric interpolation */}
      <Text>{t('attempts_remaining', { count: attemptsLeft })}</Text>
    </View>
  );
}

/**
 * Example 4: Conditional Translation Based on Status
 */
export function ConditionalTranslationExample() {
  const { t } = useTranslation();
  const visitStatus = 'completed'; // or 'pending', 'synced'
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'pending':
        return t('pending');
      case 'synced':
        return t('synced');
      default:
        return t('unknown_error');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text>{t('status')}: {getStatusText(visitStatus)}</Text>
    </View>
  );
}

/**
 * Example 5: Error Message Translation
 */
export function ErrorMessageExample() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      // Simulate an action that might fail
      throw new Error('network_error');
    } catch (err: any) {
      // Translate error message
      setError(t(err.message));
    }
  };
  
  return (
    <View style={styles.container}>
      <Button title={t('retry')} onPress={handleAction} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/**
 * Example 6: Form Validation with Translated Messages
 */
export function FormValidationExample() {
  const { t } = useTranslation();
  const [workerId, setWorkerId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const validateWorkerId = (id: string) => {
    if (!id) {
      return t('worker_id_required');
    }
    if (!/^\d{8}$/.test(id)) {
      return t('worker_id_format');
    }
    return null;
  };
  
  const handleSubmit = () => {
    const error = validateWorkerId(workerId);
    setValidationError(error);
    
    if (!error) {
      // Proceed with submission
      console.log(t('login_success'));
    }
  };
  
  return (
    <View style={styles.container}>
      <Text>{t('worker_id')}</Text>
      {/* TextInput would go here */}
      {validationError && (
        <Text style={styles.error}>{validationError}</Text>
      )}
      <Button title={t('login')} onPress={handleSubmit} />
    </View>
  );
}

/**
 * Example 7: List Items with Translation
 */
export function ListTranslationExample() {
  const { t } = useTranslation();
  
  const visitTypes = [
    { id: 'hbnc', name: t('hbnc'), fullName: t('hbnc_full') },
    { id: 'anc', name: t('anc'), fullName: t('anc_full') },
    { id: 'pnc', name: t('pnc'), fullName: t('pnc_full') },
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('select_visit_type')}</Text>
      {visitTypes.map(type => (
        <View key={type.id} style={styles.listItem}>
          <Text style={styles.listTitle}>{type.name}</Text>
          <Text>{type.fullName}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Example 8: Using Translation Outside Components
 */
export function utilityFunctionExample() {
  // Import the standalone t function
  const errorMessage = t('network_error');
  const successMessage = t('login_success');
  
  return {
    error: errorMessage,
    success: successMessage,
  };
}

/**
 * Example 9: Dynamic Translation Keys
 */
export function DynamicKeyExample() {
  const { t } = useTranslation();
  const beneficiaryType = 'mother_child'; // or 'individual', 'child'
  
  // Dynamically construct translation key
  const typeLabel = t(beneficiaryType);
  
  return (
    <View style={styles.container}>
      <Text>{t('type')}: {typeLabel}</Text>
    </View>
  );
}

/**
 * Example 10: Alert/Modal with Translations
 */
export function AlertExample() {
  const { t } = useTranslation();
  
  const showLogoutConfirmation = () => {
    // In a real app, you'd use Alert.alert or a custom modal
    const title = t('confirm_logout');
    const message = t('are_you_sure_logout');
    const cancelText = t('cancel');
    const confirmText = t('logout');
    
    console.log({ title, message, cancelText, confirmText });
  };
  
  return (
    <View style={styles.container}>
      <Button title={t('logout')} onPress={showLogoutConfirmation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginTop: 4,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
});
