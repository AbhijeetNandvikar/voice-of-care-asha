# Authentication Service

This module handles all authentication-related operations for the Voice of Care (ASHA) mobile application.

## Features

- Worker login with worker ID and password
- MPIN setup for first-time users
- MPIN verification for subsequent logins
- Secure token storage using Expo SecureStore
- Automatic token injection in API requests
- Logout and session management

## API Functions

### `login(workerId: string, password: string): Promise<AuthResponse>`

Authenticates a worker using their 8-digit worker ID and password.

**Parameters:**
- `workerId`: 8-digit worker ID
- `password`: Worker password

**Returns:** `AuthResponse` containing JWT token and worker profile

**Throws:**
- `Error` with message "Invalid worker ID or password" (401)
- `Error` with message "Account is not authorized" (403)
- `Error` with message "Network error. Please check your internet connection."

**Example:**
```typescript
import { login } from '../services/authService';

try {
  const response = await login('12345678', 'password123');
  console.log('Logged in:', response.worker.first_name);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### `setupMPIN(mpin: string): Promise<void>`

Sets up a 4-digit MPIN for the authenticated worker (first-time login).

**Parameters:**
- `mpin`: 4-digit MPIN (must be numeric)

**Throws:**
- `Error` with message "MPIN must be exactly 4 digits"
- `Error` with message "Not authenticated. Please login first."
- `Error` with message "Session expired. Please login again." (401)

**Example:**
```typescript
import { setupMPIN } from '../services/authService';

try {
  await setupMPIN('1234');
  console.log('MPIN setup successful');
} catch (error) {
  console.error('MPIN setup failed:', error.message);
}
```

### `verifyMPIN(workerId: string, mpin: string): Promise<AuthResponse>`

Verifies MPIN for subsequent logins (after MPIN has been set up).

**Parameters:**
- `workerId`: 8-digit worker ID
- `mpin`: 4-digit MPIN

**Returns:** `AuthResponse` containing JWT token and worker profile

**Throws:**
- `Error` with message "MPIN must be exactly 4 digits"
- `Error` with message "Invalid MPIN" (401)
- `Error` with message "Worker not found" (404)

**Example:**
```typescript
import { verifyMPIN } from '../services/authService';

try {
  const response = await verifyMPIN('12345678', '1234');
  console.log('MPIN verified:', response.worker.first_name);
} catch (error) {
  console.error('MPIN verification failed:', error.message);
}
```

### `logout(): Promise<void>`

Logs out the current user and clears all stored credentials.

**Example:**
```typescript
import { logout } from '../services/authService';

await logout();
console.log('Logged out successfully');
```

### `getStoredToken(): Promise<string | null>`

Retrieves the stored JWT token from secure storage.

**Returns:** JWT token string or `null` if not found

**Example:**
```typescript
import { getStoredToken } from '../services/authService';

const token = await getStoredToken();
if (token) {
  console.log('Token exists');
}
```

### `getStoredWorker(): Promise<Worker | null>`

Retrieves the stored worker data from secure storage.

**Returns:** Worker object or `null` if not found

**Example:**
```typescript
import { getStoredWorker } from '../services/authService';

const worker = await getStoredWorker();
if (worker) {
  console.log('Worker:', worker.first_name);
}
```

### `isAuthenticated(): Promise<boolean>`

Checks if the user is currently authenticated (has a valid token stored).

**Returns:** `true` if authenticated, `false` otherwise

**Example:**
```typescript
import { isAuthenticated } from '../services/authService';

const isAuth = await isAuthenticated();
if (isAuth) {
  // Navigate to dashboard
} else {
  // Navigate to login
}
```

### `hasMPINSetup(): Promise<boolean>`

Checks if the worker has MPIN setup (should be called after successful login).

**Returns:** `true` if MPIN is setup, `false` otherwise

**Example:**
```typescript
import { hasMPINSetup } from '../services/authService';

const hasMPIN = await hasMPINSetup();
if (hasMPIN) {
  // Navigate to MPIN verification
} else {
  // Navigate to MPIN setup
}
```

## Authentication Flow

### First-Time Login Flow

1. User enters worker ID and password
2. Call `login(workerId, password)`
3. Check if MPIN is setup using `hasMPINSetup()`
4. If no MPIN, navigate to MPIN setup screen
5. User enters and confirms 4-digit MPIN
6. Call `setupMPIN(mpin)`
7. Navigate to initialization/dashboard

### Subsequent Login Flow

1. User enters worker ID
2. Check if MPIN is setup (from previous login or API)
3. If MPIN exists, show MPIN entry screen
4. User enters 4-digit MPIN
5. Call `verifyMPIN(workerId, mpin)`
6. Navigate to dashboard

### MPIN Verification with Retry Logic

```typescript
let attempts = 0;
const MAX_ATTEMPTS = 3;

const handleMPINVerify = async (workerId: string, mpin: string) => {
  try {
    await verifyMPIN(workerId, mpin);
    // Success - navigate to dashboard
  } catch (error) {
    attempts++;
    if (attempts >= MAX_ATTEMPTS) {
      // Max attempts reached - require full login
      Alert.alert(
        'Too many failed attempts',
        'Please login with your password',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Invalid MPIN', `${MAX_ATTEMPTS - attempts} attempts remaining`);
    }
  }
};
```

## Using with Zustand Store

The authentication service is integrated with a Zustand store for easier state management:

```typescript
import { useAuthStore } from '../store/authStore';

const LoginScreen = () => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login(workerId, password);
      // Navigate to next screen
    } catch (error) {
      // Error is already set in store
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    // Your UI
  );
};
```

## Security Considerations

1. **Secure Storage**: JWT tokens and worker data are stored using Expo SecureStore, which uses:
   - iOS: Keychain Services
   - Android: EncryptedSharedPreferences (API 23+) or Keystore (API 21-22)

2. **Token Injection**: The API client automatically injects the JWT token in the Authorization header for all requests.

3. **Token Expiration**: The API interceptor automatically clears the token on 401 responses.

4. **MPIN Validation**: MPIN format is validated client-side before sending to the backend.

5. **Error Handling**: All functions include comprehensive error handling with user-friendly messages.

## Backend API Endpoints

This service interacts with the following backend endpoints:

- `POST /api/v1/auth/login` - Worker login
- `POST /api/v1/auth/mpin/setup` - MPIN setup (requires authentication)
- `POST /api/v1/auth/mpin/verify` - MPIN verification

## Requirements Fulfilled

- **Requirement 1**: ASHA Worker Authentication
- **Requirement 2**: MPIN Management
- **Requirement 28**: Security and Authentication

## Testing

To test the authentication service:

1. Ensure backend is running
2. Update `API_BASE_URL` in `api.ts` if needed
3. Test login with valid credentials
4. Test MPIN setup after first login
5. Test MPIN verification for subsequent logins
6. Test error cases (invalid credentials, network errors)

## Troubleshooting

### "Network error. Please check your internet connection."
- Ensure backend is running
- Check API_BASE_URL in api.ts
- Verify device/emulator has network access

### "Session expired. Please login again."
- JWT token has expired (24-hour expiration)
- User needs to login again with password

### "MPIN must be exactly 4 digits"
- Ensure MPIN input only accepts numeric values
- Validate MPIN length before calling API
