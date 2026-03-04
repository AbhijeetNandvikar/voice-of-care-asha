# Navigation Structure

This directory contains the navigation configuration for the Voice of Care mobile app.

## Overview

The app uses React Navigation with a hierarchical structure:

```
RootNavigator
├── AuthNavigator (Stack)
│   ├── Login
│   ├── MPINSetup
│   ├── MPINVerify
│   └── Initialization
└── MainNavigator (Bottom Tabs)
    ├── Dashboard
    ├── NewVisit (Stack)
    │   ├── VisitType
    │   ├── MCTSVerify
    │   ├── DaySelect
    │   ├── DataCollection
    │   └── Summary
    ├── PastVisits
    └── Profile
```

## Navigation Flow

### Authentication Flow
1. **Login** → User enters worker_id and password
2. **MPINSetup** → First-time users set up 4-digit MPIN
3. **MPINVerify** → Returning users verify MPIN
4. **Initialization** → Download beneficiaries and templates

### Main App Flow
- **Dashboard**: Shows today's schedule and pending syncs
- **NewVisit**: Multi-step visit recording flow
- **PastVisits**: View and filter past visits
- **Profile**: User profile and settings

### Visit Recording Flow
1. **VisitType**: Select HBNC (ANC/PNC disabled in v1)
2. **MCTSVerify**: Enter and verify beneficiary MCTS ID
3. **DaySelect**: Choose visit day (1, 3, 7, 14, 28)
4. **DataCollection**: Answer questions with voice/text
5. **Summary**: Review and save visit

## Files

- **AppNavigator.tsx**: Main navigation component with all navigators
- **types.ts**: TypeScript type definitions for navigation params
- **index.ts**: Exports for easy importing

## Usage

### In App.tsx
```typescript
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

### In Screens
```typescript
import { AuthScreenProps } from '../navigation/types';

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  // Navigate to MPIN setup
  navigation.navigate('MPINSetup');
}
```

### Using useNavigation Hook
```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function SomeComponent() {
  const navigation = useNavigation<NavigationProp>();
  
  navigation.navigate('Login');
}
```

## Authentication State

The navigation switches between Auth and Main stacks based on the `isAuthenticated` state from the auth store:

```typescript
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
```

When a user logs in successfully, set the auth state:
```typescript
useAuthStore.getState().setAuth(token, worker);
```

When a user logs out:
```typescript
useAuthStore.getState().logout();
```

## Adding New Screens

1. Create the screen component in `src/screens/`
2. Add the route params to the appropriate type in `types.ts`
3. Import and add the screen to the navigator in `AppNavigator.tsx`

Example:
```typescript
// In types.ts
export type MainTabParamList = {
  // ... existing routes
  NewScreen: { param1: string };
};

// In AppNavigator.tsx
import NewScreen from '../screens/NewScreen';

<MainTab.Screen
  name="NewScreen"
  component={NewScreen}
  options={{ title: 'New Screen' }}
/>
```

## Placeholder Screens

Currently, the following screens are placeholders and need to be implemented:
- DashboardScreen
- PastVisitsScreen
- ProfileScreen
- VisitTypeScreen
- MCTSVerifyScreen
- DaySelectScreen
- DataCollectionScreen
- SummaryScreen

These will be implemented in subsequent tasks.
