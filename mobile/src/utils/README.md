# Network Utilities

This directory contains utility functions for network connectivity detection and monitoring.

## Files

### networkUtils.ts

Provides network connectivity detection and monitoring using `@react-native-community/netinfo`.

#### Functions

- **`checkConnectivity()`**: Async function that returns a boolean indicating if the device is connected to the internet
- **`useNetworkStatus()`**: React hook that monitors network connectivity status and returns `{ isOnline, isChecking }`
- **`getNetworkInfo()`**: Async function that returns detailed network information including connection type

#### Usage

```typescript
import { useNetworkStatus, checkConnectivity } from '../utils/networkUtils';

// In a component
const { isOnline, isChecking } = useNetworkStatus();

// Programmatic check
const isConnected = await checkConnectivity();
```

## Components

### NetworkIndicator

A visual indicator component that displays the current online/offline status.

- Shows a green dot with "Online" text when connected
- Shows a red dot with "Offline" text when disconnected
- Automatically updates when connectivity changes

#### Usage

```typescript
import { NetworkIndicator } from '../components/NetworkIndicator';

<View style={styles.header}>
  <NetworkIndicator />
</View>
```

## Integration

The network connectivity detection is integrated into:

1. **DashboardScreen**: Displays network indicator in header, disables sync when offline
2. **PastVisitsScreen**: Disables sync functionality when offline
3. **SyncService**: Can be enhanced to check connectivity before attempting sync

## Installation

The network utilities require the `@react-native-community/netinfo` package:

```bash
npm install @react-native-community/netinfo
```

## Requirements

This implementation satisfies Requirement 31 from the requirements document:
- Detects network connectivity status
- Displays online/offline indicator
- Enables/disables sync functionality based on connectivity
