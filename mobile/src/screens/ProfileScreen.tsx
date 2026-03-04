import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { logout as authLogout } from '../services/authService';

interface EarningsData {
  earnings_this_month: number;
  total_earnings: number;
  last_updated: string;
}

const LANGUAGE_KEY = 'app_language';
const EARNINGS_CACHE_KEY = 'cached_earnings';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { worker, logout: storeLogout } = useAuthStore();

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  // Load earnings data
  useEffect(() => {
    loadEarnings();
  }, []);

  // Load earnings from API or cache
  const loadEarnings = async () => {
    setLoadingEarnings(true);
    try {
      // Try to fetch from API
      const response = await api.get('/workers/earnings');
      const earningsData: EarningsData = {
        ...response.data,
        last_updated: new Date().toISOString(),
      };
      
      setEarnings(earningsData);
      setIsOnline(true);
      
      // Cache the earnings data
      await AsyncStorage.setItem(EARNINGS_CACHE_KEY, JSON.stringify(earningsData));
    } catch (error) {
      console.log('Failed to fetch earnings from API, loading from cache:', error);
      setIsOnline(false);
      
      // Load from cache
      try {
        const cachedData = await AsyncStorage.getItem(EARNINGS_CACHE_KEY);
        if (cachedData) {
          setEarnings(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.error('Failed to load cached earnings:', cacheError);
      }
    } finally {
      setLoadingEarnings(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setSelectedLanguage(language);
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(t('error'), t('failed_to_change_language'));
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('confirm_logout'),
      t('are_you_sure_logout'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authLogout();
              storeLogout();
              // Navigation will be handled by auth state change
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('error'), t('logout_failed'));
            }
          },
        },
      ]
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!worker) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profilePhotoContainer}>
          {worker.profile_photo_url ? (
            <Image
              source={{ uri: worker.profile_photo_url }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoInitials}>
                {worker.first_name.charAt(0)}
                {worker.last_name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.workerName}>
          {worker.first_name} {worker.last_name}
        </Text>
        <Text style={styles.workerType}>{t(worker.worker_type)}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile_information')}</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('worker_id')}</Text>
            <Text style={styles.infoValue}>{worker.worker_id}</Text>
          </View>

          {worker.phone_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('phone')}</Text>
              <Text style={styles.infoValue}>{worker.phone_number}</Text>
            </View>
          )}

          {worker.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('email')}</Text>
              <Text style={styles.infoValue}>{worker.email}</Text>
            </View>
          )}

          {worker.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('address')}</Text>
              <Text style={styles.infoValue}>{worker.address}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language_preference')}</Text>
        
        <View style={styles.languageCard}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'en' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageChange('en')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'en' && styles.languageTextSelected,
              ]}
            >
              English
            </Text>
            {selectedLanguage === 'en' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'hi' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageChange('hi')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'hi' && styles.languageTextSelected,
              ]}
            >
              हिंदी (Hindi)
            </Text>
            {selectedLanguage === 'hi' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Earnings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('earnings')}</Text>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>{t('offline')}</Text>
            </View>
          )}
        </View>

        {loadingEarnings ? (
          <View style={styles.earningsLoading}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text style={styles.earningsLoadingText}>{t('loading_earnings')}</Text>
          </View>
        ) : earnings ? (
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>{t('earnings_this_month')}</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(earnings.earnings_this_month)}
              </Text>
            </View>

            <View style={styles.earningsDivider} />

            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>{t('total_earnings')}</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(earnings.total_earnings)}
              </Text>
            </View>

            {!isOnline && earnings.last_updated && (
              <View style={styles.lastUpdatedContainer}>
                <Text style={styles.lastUpdatedText}>
                  {t('last_updated')}: {formatDate(earnings.last_updated)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.earningsPlaceholder}>
            <Text style={styles.earningsPlaceholderText}>
              {t('earnings_not_available')}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadEarnings}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profilePhotoInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  workerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workerType: {
    fontSize: 14,
    color: '#e6f2ff',
    textTransform: 'capitalize',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  offlineBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  languageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionSelected: {
    backgroundColor: '#e6f2ff',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  languageTextSelected: {
    color: '#0066cc',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  lastUpdatedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  earningsLoading: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  earningsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  earningsPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  earningsPlaceholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 32,
  },
});
