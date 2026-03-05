# LoginScreen Component

## Overview

The LoginScreen component provides the authentication interface for ASHA workers to log into the Voice of Care mobile application. It implements the first step of the two-factor authentication flow (Worker ID + Password), with subsequent MPIN verification for returning users.

## Features

- **Worker ID Input**: 8-digit numeric input with validation
- **Password Input**: Secure text entry with minimum length validation
- **Form Validation**: Client-side validation before API calls
- **Error Handling**: Clear error messages for validation and API errors
- **Loading States**: Activity indicator during authentication
- **Internationalization**: Supports English and Hindi via i18next
- **Responsive Design**: Keyboard-aware layout with ScrollView
- **Navigation Flow**: Routes to MPIN setup (first login) or MPIN verification (subsequent logins)

## Props

```typescript
interface LoginScreenProps {
  navigation: any; // React Navigation navigation prop
}
```

## Usage

### Basic Integration (without navigation)

```typescript
import LoginScreen from './src/screens/LoginScreen';

// In your component
<LoginScreen navigation={navigation} />
```

### With React Navigation

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      {/* Add MPIN screens here */}
    </Stack.Navigator>
  );
}
```

## Validation Rules

### Worker ID
- Required field
- Must be exactly 8 digits
- Numeric only
- Trimmed of whitespace

### Password
- Required field
- Minimum 8 characters
- No specific character requirements (as per backend)

## Authentication Flow

1. User enters Worker ID and Password
2. Client-side validation runs
3. If valid, calls `authService.login(workerId, password)`
4. On success:
   - JWT token stored in SecureStore
   - Worker profile stored in SecureStore
   - Check if `worker.mpin_hash` exists:
     - If YES: Navigate to MPIN verification (subsequent login)
     - If NO: Navigate to MPIN setup (first-time login)
5. On failure:
   - Display error message from API
   - Allow user to retry

## Error Handling

The component handles three types of errors:

1. **Validation Errors**: Client-side validation (shown immediately)
   - Empty fields
   - Invalid format (Worker ID not 8 digits, password too short)

2. **API Errors**: Server-side errors (from authService)
   - 401: Invalid credentials
   - 403: Account not authorized
   - Network errors
   - Other server errors

3. **Display Priority**: Validation errors take precedence over API errors

## State Management

Uses Zustand store (`useAuthStore`) for:
- `login(workerId, password)`: Authenticate user
- `isLoading`: Loading state during API call
- `error`: API error message
- `clearError()`: Clear error state
- `worker`: Authenticated worker profile

## Styling

The component uses React Native StyleSheet with:
- Clean, modern design
- Proper spacing and padding
- Shadow effects for depth
- Color-coded error messages
- Disabled state styling
- Responsive layout

### Key Style Features
- **Container**: Full-screen with keyboard avoidance
- **Form Card**: White background with shadow
- **Inputs**: 48px height, rounded corners, border
- **Button**: Primary blue color, disabled gray state
- **Error Box**: Light red background with red text

## Accessibility Considerations

- Clear labels for all inputs
- Proper keyboard types (numeric for Worker ID)
- Secure text entry for password
- Disabled state prevents multiple submissions
- Error messages are clearly visible

## Dependencies

- `react-native`: Core components (View, Text, TextInput, etc.)
- `react-i18next`: Internationalization
- `zustand`: State management (via authStore)
- `expo-secure-store`: Secure token storage (via authService)
- `axios`: HTTP client (via authService)

## Translation Keys

Required keys in `en.json` and `hi.json`:
- `welcome`: Welcome message
- `worker_id`: Worker ID label
- `password`: Password label
- `login`: Login button text
- `loading`: Loading text
- `error`: Error label
- `success`: Success label

## Next Steps

After implementing this screen, you'll need to:

1. **Create MPIN Setup Screen** (Task 36.1)
   - For first-time login
   - 4-digit PIN input with confirmation

2. **Create MPIN Verification Screen** (Task 36.2)
   - For subsequent logins
   - 4-digit PIN input
   - Failed attempt tracking (max 3)

3. **Set up Navigation** (Task 39)
   - Auth stack (Login → MPIN Setup → MPIN Verify → Initialization)
   - Main app stack (Dashboard, etc.)

4. **Create Initialization Screen** (Task 37.2)
   - Download worker data, beneficiaries, templates
   - Seed local SQLite database

## Testing Checklist

- [ ] Valid login with correct credentials
- [ ] Invalid login with wrong credentials
- [ ] Validation errors for empty fields
- [ ] Validation error for invalid Worker ID format
- [ ] Validation error for short password
- [ ] Loading state displays during API call
- [ ] Error messages display correctly
- [ ] Navigation to MPIN setup (first login)
- [ ] Navigation to MPIN verification (subsequent login)
- [ ] Keyboard dismisses when tapping outside
- [ ] Language switching works (English/Hindi)
- [ ] Network error handling

## Known Limitations

1. **Navigation Placeholders**: Currently uses Alert for navigation since MPIN screens aren't implemented yet
2. **No "Forgot Password"**: Out of scope for v1
3. **No Biometric Auth**: Out of scope for v1
4. **Android Only**: iOS not supported in v1

## API Endpoint

**POST** `/api/v1/auth/login`

Request:
```json
{
  "worker_id": "12345678",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "worker": {
    "id": 1,
    "first_name": "Priya",
    "last_name": "Sharma",
    "worker_id": "12345678",
    "worker_type": "asha_worker",
    "mpin_hash": null,
    ...
  }
}
```

## Related Files

- `mobile/src/services/authService.ts`: Authentication API calls
- `mobile/src/store/authStore.ts`: Authentication state management
- `mobile/src/types/index.ts`: TypeScript interfaces
- `mobile/src/locales/en.json`: English translations
- `mobile/src/locales/hi.json`: Hindi translations
- `.kiro/specs/voice-of-care-asha/requirements.md`: Requirement 1

## Requirements Satisfied

This component satisfies **Requirement 1: ASHA Worker Authentication** from the requirements document:

✅ Worker enters valid worker_id and password  
✅ Mobile app authenticates and returns JWT token  
✅ Invalid credentials display error message  
✅ First-time login prompts for MPIN setup  
✅ Existing MPIN prompts for verification  
✅ JWT token stored securely in encrypted storage  
✅ Token expiration handled (via authService)
