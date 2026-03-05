import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import databaseService from '../services/databaseService';
import syncService from '../services/syncService';
import { Visit, Beneficiary } from '../types';
import { useNetworkStatus } from '../utils/networkUtils';

interface VisitWithBeneficiary extends Visit {
  beneficiary?: Beneficiary;
}

type FilterPeriod = 'all' | 'week' | 'month';

export default function PastVisitsScreen() {
  const { t } = useTranslation();
  const { worker } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  const [visits, setVisits] = useState<VisitWithBeneficiary[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<VisitWithBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');
  const [mctsFilter, setMctsFilter] = useState('');

  // Load visits data
  const loadVisits = async () => {
    try {
      if (!worker) return;

      // Get all visits
      const allVisits = await databaseService.getVisits();
      
      // Get all beneficiaries to join with visits
      const beneficiaries = await databaseService.getBeneficiaries(worker.id);
      const beneficiaryMap = new Map(
        beneficiaries.map(b => [b.id, b])
      );

      // Attach beneficiary info to visits
      const visitsWithBeneficiary: VisitWithBeneficiary[] = allVisits.map(visit => ({
        ...visit,
        beneficiary: beneficiaryMap.get(visit.beneficiary_id),
      }));

      setVisits(visitsWithBeneficiary);
      
      // Get pending sync count
      const count = await databaseService.getPendingVisitsCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Error loading visits:', error);
      Alert.alert(
        t('error'),
        t('failed_to_load_visits')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...visits];

    // Apply period filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      if (selectedPeriod === 'week') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        // month
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      filtered = filtered.filter(visit => 
        new Date(visit.visit_date_time) >= cutoffDate
      );
    }

    // Apply MCTS ID filter
    if (mctsFilter.trim()) {
      const searchTerm = mctsFilter.trim().toLowerCase();
      filtered = filtered.filter(visit =>
        visit.beneficiary?.mcts_id.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredVisits(filtered);
  }, [visits, selectedPeriod, mctsFilter]);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadVisits();
    }, [worker])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadVisits();
  };

  // Handle sync all pending visits
  const handleSyncAll = async () => {
    if (syncing) return;

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

      const result = await syncService.syncAllPending();

      if (result.success) {
        Alert.alert(
          t('sync_successful'),
          t('sync_success_message', { count: result.syncedCount })
        );
        // Reload visits to update sync status
        await loadVisits();
      } else {
        // Partial success
        Alert.alert(
          t('sync_partial_success'),
          t('sync_partial_message', {
            synced: result.syncedCount,
            failed: result.failedCount,
          })
        );
        // Reload visits
        await loadVisits();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      Alert.alert(
        t('sync_failed'),
        error.message || t('sync_error_message')
      );
    } finally {
      setSyncing(false);
    }
  };

  // Handle visit detail tap
  const handleVisitTap = (visit: VisitWithBeneficiary) => {
    // TODO: Navigate to visit detail screen (future enhancement)
    Alert.alert(
      t('visit_details'),
      `${t('beneficiary')}: ${visit.beneficiary?.first_name} ${visit.beneficiary?.last_name}\n` +
      `${t('visit_type')}: ${visit.visit_type.toUpperCase()}\n` +
      `${t('day')}: ${visit.day_number || 'N/A'}\n` +
      `${t('date')}: ${formatDate(visit.visit_date_time)}\n` +
      `${t('status')}: ${visit.is_synced ? t('synced') : t('pending_sync')}`
    );
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render filter chip
  const renderFilterChip = (period: FilterPeriod, label: string) => (
    <TouchableOpacity
      key={period}
      style={[
        styles.filterChip,
        selectedPeriod === period && styles.filterChipActive,
      ]}
      onPress={() => setSelectedPeriod(period)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedPeriod === period && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render visit item
  const renderVisitItem = ({ item }: { item: VisitWithBeneficiary }) => (
    <TouchableOpacity
      style={styles.visitCard}
      onPress={() => handleVisitTap(item)}
      activeOpacity={0.7}
    >
      <View style={styles.visitCardHeader}>
        <View style={styles.visitCardInfo}>
          <Text style={styles.beneficiaryName}>
            {item.beneficiary?.first_name} {item.beneficiary?.last_name}
          </Text>
          <Text style={styles.mctsId}>
            {t('mcts_id')}: {item.beneficiary?.mcts_id}
          </Text>
        </View>
        <View
          style={[
            styles.syncBadge,
            item.is_synced ? styles.syncBadgeSynced : styles.syncBadgePending,
          ]}
        >
          <Text
            style={[
              styles.syncBadgeText,
              item.is_synced ? styles.syncBadgeTextSynced : styles.syncBadgeTextPending,
            ]}
          >
            {item.is_synced ? t('synced') : t('pending')}
          </Text>
        </View>
      </View>
      
      <View style={styles.visitCardDetails}>
        <View style={styles.visitDetailRow}>
          <Text style={styles.visitDetailLabel}>{t('visit_type')}:</Text>
          <Text style={styles.visitDetailValue}>{item.visit_type.toUpperCase()}</Text>
        </View>
        <View style={styles.visitDetailRow}>
          <Text style={styles.visitDetailLabel}>{t('day')}:</Text>
          <Text style={styles.visitDetailValue}>{item.day_number || 'N/A'}</Text>
        </View>
        <View style={styles.visitDetailRow}>
          <Text style={styles.visitDetailLabel}>{t('date')}:</Text>
          <Text style={styles.visitDetailValue}>{formatDate(item.visit_date_time)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with sync button */}
      {pendingSyncCount > 0 && (
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleSyncAll}
            activeOpacity={0.8}
            disabled={syncing}
          >
            {syncing ? (
              <View style={styles.syncButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.syncButtonText, styles.syncButtonTextWithIcon]}>
                  {t('syncing')}
                </Text>
              </View>
            ) : (
              <Text style={styles.syncButtonText}>
                {t('sync_all_pending')} ({pendingSyncCount})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Section */}
      <View style={styles.filterSection}>
        {/* Period Filter Chips */}
        <View style={styles.filterChipsRow}>
          {renderFilterChip('all', t('all'))}
          {renderFilterChip('week', t('last_week'))}
          {renderFilterChip('month', t('last_month'))}
        </View>

        {/* MCTS ID Filter Input */}
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_by_mcts_id')}
          value={mctsFilter}
          onChangeText={setMctsFilter}
          placeholderTextColor="#999"
        />
      </View>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {mctsFilter.trim() || selectedPeriod !== 'all'
              ? t('no_visits_match_filters')
              : t('no_visits_recorded')}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {t('start_recording_visits_to_see_them_here')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVisits}
          renderItem={renderVisitItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  syncButton: {
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0066cc',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  visitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  visitCardInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mctsId: {
    fontSize: 13,
    color: '#666',
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeSynced: {
    backgroundColor: '#d4edda',
  },
  syncBadgePending: {
    backgroundColor: '#fff3cd',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  syncBadgeTextSynced: {
    color: '#155724',
  },
  syncBadgeTextPending: {
    color: '#856404',
  },
  visitCardDetails: {
    gap: 6,
  },
  visitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visitDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  visitDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonTextWithIcon: {
    marginLeft: 8,
  },
  offlineHint: {
    fontSize: 11,
    color: '#cce5ff',
    textAlign: 'center',
    marginTop: 2,
  },
});
