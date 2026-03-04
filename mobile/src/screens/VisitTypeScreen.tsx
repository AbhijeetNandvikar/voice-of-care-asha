import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { VisitScreenProps } from '../navigation/types';

type Props = VisitScreenProps<'VisitType'>;

export default function VisitTypeScreen({ navigation }: Props) {
  const handleVisitTypeSelect = (visitType: string) => {
    if (visitType === 'hbnc') {
      navigation.navigate('MCTSVerify', { visitType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Visit Type</Text>
        <Text style={styles.subtitle}>
          Choose the type of visit you want to conduct
        </Text>

        <View style={styles.buttonContainer}>
          {/* HBNC - Enabled */}
          <TouchableOpacity
            style={[styles.button, styles.buttonEnabled]}
            onPress={() => handleVisitTypeSelect('hbnc')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>HBNC</Text>
            <Text style={styles.buttonSubtext}>
              Home-Based Newborn Care
            </Text>
          </TouchableOpacity>

          {/* ANC - Disabled */}
          <TouchableOpacity
            style={[styles.button, styles.buttonDisabled]}
            disabled
          >
            <Text style={[styles.buttonText, styles.disabledText]}>ANC</Text>
            <Text style={[styles.buttonSubtext, styles.disabledText]}>
              Antenatal Care (Coming Soon)
            </Text>
          </TouchableOpacity>

          {/* PNC - Disabled */}
          <TouchableOpacity
            style={[styles.button, styles.buttonDisabled]}
            disabled
          >
            <Text style={[styles.buttonText, styles.disabledText]}>PNC</Text>
            <Text style={[styles.buttonSubtext, styles.disabledText]}>
              Postnatal Care (Coming Soon)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Note: Only HBNC visits are supported in this version
        </Text>
      </View>
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
  buttonContainer: {
    gap: 16,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonEnabled: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  note: {
    marginTop: 24,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
