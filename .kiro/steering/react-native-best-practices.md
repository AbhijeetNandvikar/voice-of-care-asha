# React Native Best Practices

## Project Structure (Expo)
- Use Expo managed workflow for simplicity
- Organize by feature, not by type
- Keep platform-specific code minimal and isolated
- Use TypeScript for type safety

## Navigation
- Use React Navigation (stack, tab, drawer)
- Type navigation props for type safety
- Keep navigation logic in navigation folder
- Use deep linking for important flows

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type RootStackParamList = {
    Home: undefined;
    Visit: { visitId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
```

## State Management
- Use Zustand for global state (lightweight, simple)
- Keep local state in components when possible
- Persist critical state (auth, offline data)
- Use SQLite for offline-first data

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            login: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
        }),
        { name: 'auth-storage' }
    )
);
```

## Offline-First Architecture
- Use SQLite as source of truth
- Sync with backend when online
- Queue operations when offline
- Handle conflicts gracefully
- Show sync status to user

```typescript
// Store data locally first
await db.insertVisit(visitData);

// Sync when online
if (isOnline) {
    await syncService.syncVisits();
}
```

## Performance
- Use FlatList/SectionList for long lists (not ScrollView)
- Implement pagination and lazy loading
- Optimize images (resize, compress, cache)
- Use React.memo for expensive components
- Avoid inline functions in render
- Use useCallback and useMemo appropriately

```typescript
<FlatList
    data={items}
    renderItem={renderItem}
    keyExtractor={(item) => item.id}
    initialNumToRender={10}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
/>
```

## Styling
- Use StyleSheet.create for performance
- Create theme constants (colors, spacing, typography)
- Use Flexbox for layouts
- Avoid inline styles
- Consider responsive design (different screen sizes)

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
});
```

## Forms & Input
- Use controlled components
- Validate input appropriately
- Handle keyboard (KeyboardAvoidingView, dismiss on tap)
- Use appropriate keyboard types (numeric, email, phone)
- Provide clear error messages

```typescript
<KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
    <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
        placeholder="Enter phone number"
    />
</KeyboardAvoidingView>
```

## Audio Recording (expo-av)
- Request permissions before recording
- Handle recording lifecycle properly
- Clean up resources (unload audio)
- Show recording status to user
- Handle interruptions (calls, other apps)

```typescript
import { Audio } from 'expo-av';

const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;
    
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
    });
    
    const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(recording);
};

const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    // Save or upload audio
};
```

## Database (expo-sqlite)
- Create schema on app initialization
- Use transactions for multiple operations
- Index frequently queried columns
- Handle migrations carefully
- Use prepared statements to prevent SQL injection

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('voiceofcare.db');

db.transaction(tx => {
    tx.executeSql(
        'CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, data TEXT)',
        [],
        () => console.log('Table created'),
        (_, error) => console.error(error)
    );
});
```

## Internationalization (i18n)
- Use react-i18next for translations
- Support English and Hindi
- Store translations in JSON files
- Use translation keys, not hardcoded strings
- Handle RTL if needed in future

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: require('./i18n/en.json') },
        hi: { translation: require('./i18n/hi.json') },
    },
    lng: 'en',
    fallbackLng: 'en',
});

// In component
const { t } = useTranslation();
<Text>{t('welcome_message')}</Text>
```

## API Integration
- Create API client with auth interceptor
- Handle network errors gracefully
- Show loading states
- Retry failed requests
- Cache responses when appropriate

```typescript
import axios from 'axios';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use(config => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

## Security
- Store sensitive data in SecureStore
- Never log sensitive information
- Validate all user input
- Use HTTPS for API calls
- Implement certificate pinning for production

```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', authToken);
const token = await SecureStore.getItemAsync('token');
```

## Common Pitfalls to Avoid
- Don't use ScrollView for long lists (use FlatList)
- Don't forget to clean up listeners and subscriptions
- Don't block the main thread with heavy computations
- Don't ignore Android-specific issues (test on Android)
- Don't forget to handle app state changes (background/foreground)
- Don't use console.log in production (use proper logging)
- Don't forget to unload audio/video resources

## Android-Specific Considerations
- Test on different screen sizes
- Handle back button properly
- Request runtime permissions (Android 6+)
- Optimize for lower-end devices
- Test with different Android versions
- Handle app lifecycle correctly

## Expo-Specific Tips
- Use Expo SDK modules when available (better maintained)
- Keep Expo SDK version up to date
- Use EAS for builds and updates
- Leverage Expo Go for development
- Use expo-updates for OTA updates
