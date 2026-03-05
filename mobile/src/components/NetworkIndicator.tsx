/**
 * Network Indicator Component
 * 
 * Displays online/offline status in the app header.
 * Shows a green dot when online, red dot when offline.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../utils/networkUtils';

export const NetworkIndicator: React.FC = () => {
  const { isOnline, isChecking } = useNetworkStatus();

  if (isChecking) {
    return null; // Don't show anything while checking
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, isOnline ? styles.onlineDot : styles.offlineDot]} />
      <Text style={styles.text}>{isOnline ? 'Online' : 'Offline'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#F44336',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});
