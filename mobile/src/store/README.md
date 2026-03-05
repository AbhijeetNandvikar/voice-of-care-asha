# Store

Global state management using Zustand.

## App Store

The `appStore` manages global application state including:

- **currentUser**: Authenticated worker profile
- **pendingSyncCount**: Number of unsynced visits
- **isOnline**: Network connectivity status
- **selectedLanguage**: UI language preference ('en' or 'hi')

### Usage

```typescript
import { useAppStore, useCurrentUser, usePendingSyncCount } from '@/store';

// Use the full store
function MyComponent() {
  const { currentUser, setCurrentUser } = useAppStore();
  
  // ...
}

// Use selector hooks for optimized re-renders
function UserProfile() {
  const currentUser = useCurrentUser();
  
  return <Text>{currentUser?.first_name}</Text>;
}

// Update state
function LoginScreen() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  
  const handleLogin = async () => {
    const user = await authService.login(workerId, password);
    setCurrentUser(user);
  };
}
```

### Persistence

The store automatically persists:
- `currentUser` - Restored on app restart
- `selectedLanguage` - Restored on app restart

The following are NOT persisted (reset on app restart):
- `pendingSyncCount` - Recalculated from database
- `isOnline` - Detected from network status

### Actions

#### setCurrentUser(user)
Set the authenticated user. Called after successful login or MPIN verification.

```typescript
setCurrentUser({
  id: 1,
  first_name: 'Priya',
  last_name: 'Sharma',
  worker_id: '12345678',
  worker_type: 'asha_worker',
  phone_number: '9876543210',
});
```

#### setPendingSyncCount(count)
Update the number of unsynced visits. Called after:
- Creating a new visit
- Successful sync
- App initialization

```typescript
setPendingSyncCount(5);
```

#### setIsOnline(online)
Update network connectivity status. Typically managed by NetInfo listener.

```typescript
setIsOnline(true);
```

#### setSelectedLanguage(language)
Change UI language. Triggers i18n language change.

```typescript
setSelectedLanguage('hi'); // Switch to Hindi
```

#### clearState()
Reset all state to initial values. Called on logout.

```typescript
clearState();
```

## Best Practices

1. **Use selector hooks** for components that only need specific state:
   ```typescript
   const currentUser = useCurrentUser(); // Only re-renders when user changes
   ```

2. **Use store actions** instead of direct state updates:
   ```typescript
   // Good
   const setPendingSyncCount = useAppStore((state) => state.setPendingSyncCount);
   setPendingSyncCount(10);
   
   // Bad - don't do this
   useAppStore.setState({ pendingSyncCount: 10 });
   ```

3. **Keep sync count updated** after database operations:
   ```typescript
   await databaseService.createVisit(visitData);
   const count = await databaseService.getPendingVisitsCount();
   setPendingSyncCount(count);
   ```

4. **Clear state on logout**:
   ```typescript
   const clearState = useAppStore((state) => state.clearState);
   await authService.logout();
   clearState();
   ```

## Integration Points

### Authentication Flow
- Login/MPIN screens set `currentUser`
- Logout clears all state

### Sync Flow
- Dashboard displays `pendingSyncCount` badge
- Sync service updates count after operations

### Language Selection
- Profile screen provides language toggle
- Changes propagate to i18n

### Network Status
- App.tsx monitors NetInfo
- Updates `isOnline` state
- UI shows offline indicator when false
