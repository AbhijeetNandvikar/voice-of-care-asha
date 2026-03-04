import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { VisitScreenProps } from '../navigation/types';
import databaseService from '../services/databaseService';
import { Visit, VisitTemplate } from '../types';

type Props = VisitScreenProps<'DaySelect'>;

const HBNC_DAYS = [1, 3, 7, 14, 28];

export default function DaySelectScreen({ navigation, route }: Props) {
  const { visitType, beneficiaryId, beneficiaryName, mctsId } = route.params;

  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [template, setTemplate] = useState<VisitTemplate | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load template
      const loadedTemplate = await databaseService.getTemplate(visitType);
      if (!loadedTemplate) {
        Alert.alert('Error', 'Visit template not found. Please sync your data.');
        navigation.goBack();
        return;
      }
      setTemplate(loadedTemplate);

      // Load completed visits for this beneficiary
      const visits = await databaseService.getVisits({
        beneficiary_id: beneficiaryId,
      });

      // Extract completed day numbers for HBNC visits
      const completed = visits
        .filter((visit: Visit) => visit.visit_type === 'hbnc' && visit.day_number)
        .map((visit: Visit) => visit.day_number!);

      setCompletedDays(completed);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load visit data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDaySelect = (day: number) => {
    // Check if day was already completed
    if (completedDays.includes(day)) {
      setSelectedDay(day);
      setShowWarningModal(true);
    } else {
      proceedToDataCollection(day);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    if (selectedDay) {
      proceedToDataCollection(selectedDay);
    }
  };

  const handleWarningCancel = () => {
    setShowWarningModal(false);
    setSelectedDay(null);
  };

  const proceedToDataCollection = (day: number) => {
    if (!template) return;

    navigation.navigate('DataCollection', {
      visitType,
      beneficiaryId,
      dayNumber: day,
      templateId: template.id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Visit Day</Text>
        <Text style={styles.subtitle}>
          {beneficiaryName} ({mctsId})
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Select the day number for this HBNC visit
          </Text>
        </View>

        <View style={styles.daysContainer}>
          {HBNC_DAYS.map((day) => {
            const isCompleted = completedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isCompleted && styles.dayButtonCompleted,
                ]}
                onPress={() => handleDaySelect(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isCompleted && styles.dayNumberCompleted,
                  ]}
                >
                  Day {day}
                </Text>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Completed</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {completedDays.length > 0 && (
          <View style={styles.legendCard}>
            <Text style={styles.legendText}>
              Green days indicate previously completed visits. You can revisit
              them if needed.
            </Text>
          </View>
        )}
      </View>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={handleWarningCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Revisit Warning</Text>
            <Text style={styles.modalText}>
              This day has already been completed for this beneficiary. Are you
              sure you want to conduct this visit again?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleWarningCancel}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleWarningConfirm}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
  },
  daysContainer: {
    gap: 12,
  },
  dayButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dayNumberCompleted: {
    color: '#2E7D32',
  },
  completedBadge: {
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  legendCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
