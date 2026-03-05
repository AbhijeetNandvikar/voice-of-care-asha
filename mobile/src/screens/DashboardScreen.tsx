import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import databaseService from '../services/databaseService';
import syncService from '../services/syncService';
import { Beneficiary } from '../types';
import { NetworkIndicator } from '../components/NetworkIndicator';
import { useNetworkStatus } from '../utils/networkUtils';

interface BeneficiaryWithStatus extends Beneficiary {
  hasVisitToday: boolean;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { worker } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryWithStatus[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasOfflineToken, setHasOfflineToken] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      if (!worker) return;

      // Check if user has offline token
      const isOffline = await syncService.hasOfflineToken();
      setHasOfflineToken(isOffline);

      // Get pending sync count
      const count = await databaseService.getPendingVisitsCount();
      setPendingSyncCount(count);

      // Get assigned beneficiaries
      const allBeneficiaries = await databaseService.getBeneficiaries(worker.id);
      console.log('[DashboardScreen] Loaded beneficiaries:', allBeneficiaries.length);

      // Get today's visits to determine status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();

      const todaysVisits = await databaseService.getVisits({
        start_date: todayStart,
        end_date: todayEnd,
      });

      // Map beneficiaries with visit status
      const beneficiariesWithStatus: BeneficiaryWithStatus[] = allBeneficiaries.map(
        (beneficiary) => ({
          ...beneficiary,
          hasVisitToday: todaysVisits.some(
            (visit) => visit.beneficiary_id === beneficiary.id
          ),
        })
      );

      setBeneficiaries(beneficiariesWithStatus);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(
        t('error'),
        t('failed_to_load_dashboard_data')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize data if no beneficiaries found
  const handleInitializeData = async () => {
    Alert.alert(
      'Download Data',
      'This will download your assigned beneficiaries and templates from the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setLoading(true);
              const { initializeApp } = await import('../services/initService');
              await initializeApp();
              Alert.alert('Success', 'Data downloaded successfully!');
              await loadDashboardData();
            } catch (error: any) {
              console.error('Initialization error:', error);
              Alert.alert('Error', error.message || 'Failed to download data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [worker])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Navigate to new visit flow
  const handleStartNewVisit = () => {
    // Navigate to the NewVisit tab, which will show the VisitType screen
    navigation.navigate('NewVisit' as never, { screen: 'VisitType' } as never);
  };

  // Handle sync all pending visits
  const handleSyncPending = async () => {
    if (syncing) return;

    console.log('[Dashboard] Starting sync, isOnline:', isOnline);

    // Check network connectivity before syncing
    if (!isOnline) {
      Alert.alert(
        t('no_internet_connection'),
        t('sync_requires_internet')
      );
      return;
    }

    try {
      setSyncing(true);
      console.log('[Dashboard] Calling syncService.syncAllPending()');

      const result = await syncService.syncAllPending();
      console.log('[Dashboard] Sync result:', result);

      if (result.success) {
        Alert.alert(
          t('sync_successful'),
          `Successfully synced ${result.syncedCount} visit(s)`
        );
        // Reload dashboard data to update pending count
        await loadDashboardData();
      } else {
        // Partial success
        Alert.alert(
          t('sync_partial_success'),
          `Synced: ${result.syncedCount}, Failed: ${result.failedCount}`
        );
        // Reload dashboard data
        await loadDashboardData();
      }
    } catch (error: any) {
      console.error('[Dashboard] Sync error:', error);
      Alert.alert(
        t('sync_failed'),
        error.message || 'Failed to sync visits. Please try again.'
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>
              {t('welcome')}, {worker?.first_name}!
            </Text>
            <Text style={styles.subtitleText}>
              {t('dashboard_subtitle')}
            </Text>
          </View>
          <NetworkIndicator />
        </View>
      </View>

      {/* Offline Token Warning */}
      {hasOfflineToken && isOnline && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Offline Login Detected</Text>
            <Text style={styles.warningText}>
              You logged in offline. To sync visits, please logout and login again with internet.
            </Text>
          </View>
        </View>
      )}

      {/* Pending Sync Badge */}
      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={styles.syncBanner}
          onPress={handleSyncPending}
          activeOpacity={0.7}
        >
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>{pendingSyncCount}</Text>
          </View>
          <View style={styles.syncBannerContent}>
            <Text style={styles.syncBannerTitle}>
              {t('pending_sync_visits')}
            </Text>
            <Text style={styles.syncBannerSubtitle}>
              {t('tap_to_sync')}
            </Text>
          </View>
          <Text style={styles.syncBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Start New Visit Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleStartNewVisit}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>
          {t('start_new_visit')}
        </Text>
      </TouchableOpacity>

      {/* Today's Schedule Section */}
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>{t('todays_schedule')}</Text>

        {beneficiaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {t('no_assigned_beneficiaries')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('contact_admin_for_assignments')}
            </Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleInitializeData}
              activeOpacity={0.7}
            >
              <Text style={styles.downloadButtonText}>
                Download Data from Server
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          beneficiaries.map((beneficiary) => (
            <View key={beneficiary.id} style={styles.beneficiaryCard}>
              <View style={styles.beneficiaryInfo}>
                <Text style={styles.beneficiaryName}>
                  {beneficiary.first_name} {beneficiary.last_name}
                </Text>
                <Text style={styles.beneficiaryMcts}>
                  {t('mcts_id')}: {beneficiary.mcts_id}
                </Text>
                <Text style={styles.beneficiaryType}>
                  {t(beneficiary.beneficiary_type)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusChip,
                  beneficiary.hasVisitToday
                    ? styles.statusCompleted
                    : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    beneficiary.hasVisitToday
                      ? styles.statusTextCompleted
                      : styles.statusTextPending,
                  ]}
                >
                  {beneficiary.hasVisitToday
                    ? t('completed')
                    : t('pending')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sync All Pending Button (if unsynced visits exist) */}
      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            (syncing || !isOnline) && styles.buttonDisabled,
          ]}
          onPress={handleSyncPending}
          activeOpacity={0.8}
          disabled={syncing || !isOnline}
        >
          {syncing ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#0066cc" />
              <Text style={[styles.secondaryButtonText, styles.buttonTextWithIcon]}>
                {t('syncing')}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.secondaryButtonText}>
                {t('sync_all_pending')} ({pendingSyncCount})
              </Text>
              {!isOnline && (
                <Text style={styles.offlineHint}>
                  {t('sync_requires_internet')}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}

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
  welcomeSection: {
    backgroundColor: '#0066cc',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#e6f2ff',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  syncBadge: {
    backgroundColor: '#ff9800',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  syncBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncBannerContent: {
    flex: 1,
  },
  syncBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  syncBannerSubtitle: {
    fontSize: 13,
    color: '#856404',
  },
  syncBannerArrow: {
    fontSize: 32,
    color: '#856404',
    fontWeight: '300',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066cc',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  beneficiaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  beneficiaryMcts: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  beneficiaryType: {
    fontSize: 12,
    color: '#999',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#155724',
  },
  statusTextPending: {
    color: '#856404',
  },
  bottomSpacer: {
    height: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextWithIcon: {
    marginLeft: 8,
  },
  offlineHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});
