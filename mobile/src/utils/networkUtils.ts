/**
 * Network Connectivity Utilities
 * 
 * Provides network connectivity detection and monitoring using NetInfo.
 * Used to enable/disable sync functionality and display online/offline status.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Check if device is currently connected to the internet
 */
export const checkConnectivity = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};

/**
 * React hook to monitor network connectivity status
 * Returns current online status and updates when connectivity changes
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Initial check
    checkConnectivity().then((connected) => {
      setIsOnline(connected);
      setIsChecking(false);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(connected);
      setIsChecking(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, isChecking };
};

/**
 * Get detailed network information
 */
export const getNetworkInfo = async () => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type, // wifi, cellular, none, etc.
    details: state.details,
  };
};
