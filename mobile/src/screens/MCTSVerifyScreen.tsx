import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { VisitScreenProps } from '../navigation/types';
import databaseService from '../services/databaseService';
import { Beneficiary } from '../types';
import { useAuthStore } from '../store/authStore';

type Props = VisitScreenProps<'MCTSVerify'>;

export default function MCTSVerifyScreen({ navigation, route }: Props) {
  const { visitType } = route.params;
  const { user } = useAuthStore();
  
  const [mctsId, setMctsId] = useState('');
  const [loading, setLoading] = useState(false);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);

  const handleVerify = async () => {
    if (!mctsId.trim()) {
      Alert.alert('Error', 'Please enter MCTS ID');
      return;
    }

    setLoading(true);
    try {
      const foundBeneficiary = await databaseService.getBeneficiaryByMCTS(
        mctsId.trim()
      );

      if (!foundBeneficiary) {
        Alert.alert(
          'Beneficiary Not Found',
          'No beneficiary found with this MCTS ID. Please check the ID or sync your data.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Check if beneficiary is assigned to current worker
      if (foundBeneficiary.assigned_asha_id !== user?.id) {
        Alert.alert(
          'Authorization Error',
          'This beneficiary is not assigned to you. Please contact your supervisor.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Show beneficiary details for confirmation
      setBeneficiary(foundBeneficiary);
    } catch (error) {
      console.error('Error verifying MCTS ID:', error);
      Alert.alert('Error', 'Failed to verify MCTS ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!beneficiary) return;

    navigation.navigate('DaySelect', {
      visitType,
      beneficiaryId: beneficiary.id,
      beneficiaryName: `${beneficiary.first_name} ${beneficiary.last_name}`,
      mctsId: beneficiary.mcts_id,
    });
  };

  const handleCancel = () => {
    setBeneficiary(null);
    setMctsId('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify Beneficiary</Text>
          <Text style={styles.subtitle}>
            Enter the MCTS ID to verify the beneficiary
          </Text>

          {!beneficiary ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>MCTS ID</Text>
                <TextInput
                  style={styles.input}
                  value={mctsId}
                  onChangeText={setMctsId}
                  placeholder="Enter MCTS ID"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.confirmationCard}>
                <Text style={styles.confirmationTitle}>
                  Beneficiary Details
                </Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {beneficiary.first_name} {beneficiary.last_name}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MCTS ID:</Text>
                  <Text style={styles.detailValue}>{beneficiary.mcts_id}</Text>
                </View>

                {beneficiary.age && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Age:</Text>
                    <Text style={styles.detailValue}>{beneficiary.age}</Text>
                  </View>
                )}

                {beneficiary.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>
                      {beneficiary.address}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {beneficiary.beneficiary_type}
                  </Text>
                </View>
              </View>

              <Text style={styles.confirmationText}>
                Is this the correct beneficiary?
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  confirmationText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonPrimary: {
    flex: 1,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
