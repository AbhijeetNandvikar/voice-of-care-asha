# ProfileScreen Implementation

## Overview
The ProfileScreen displays worker profile information, language preferences, earnings data, and provides logout functionality. It implements Requirements 16 and 17 from the specification.

## Features

### 1. Profile Information Display
- Worker name with profile photo or initials placeholder
- Worker ID, phone, email, and address
- Worker type (ASHA Worker, Medical Officer, etc.)

### 2. Language Selection
- Toggle between English and Hindi
- Persists preference to AsyncStorage
- Updates UI immediately using react-i18next
- Visual feedback with checkmark for selected language

### 3. Earnings Display
- Fetches earnings from backend API when online
- Shows "Earnings This Month" and "Total Earnings"
- Caches earnings data to AsyncStorage for offline viewing
- Displays "Last updated" timestamp when showing cached data
- Shows offline badge when data is from cache
- Retry button if earnings fail to load

### 4. Logout Functionality
- Confirmation dialog before logout
- Clears authentication tokens from SecureStore
- Resets auth state in Zustand store
- Navigates back to login screen

## API Integration

### Earnings Endpoint
```
GET /api/v1/workers/earnings
Authorization: Bearer {token}

Response:
{
  "earnings_this_month": 5000,
  "total_earnings": 45000,
  "worker_id": "12345678",
  "worker_name": "John Doe"
}
```

Note: In v1, the backend returns placeholder data from worker meta_data. Future versions will calculate actual earnings based on completed visits.

## Data Persistence

### AsyncStorage Keys
- `app_language`: Stores selected language ('en' or 'hi')
- `cached_earnings`: Stores earnings data for offline viewing

### SecureStore (via authService)
- `auth_token`: JWT token (cleared on logout)
- `worker_data`: Worker profile (cleared on logout)

## Offline Behavior

1. **Online Mode**:
   - Fetches fresh earnings data from API
   - Caches data to AsyncStorage
   - No offline indicator shown

2. **Offline Mode**:
   - Loads earnings from AsyncStorage cache
   - Shows orange "Offline" badge
   - Displays "Last updated" timestamp
   - Profile information still available (from auth store)

## UI Components

### Profile Header
- Circular profile photo or initials placeholder
- Worker name and type
- Blue gradient background

### Information Card
- Key-value pairs for worker details
- Conditional rendering (only shows fields that exist)

### Language Selection Card
- Two options: English and Hindi
- Selected option highlighted with blue background
- Checkmark icon for selected language

### Earnings Card
- Two rows: This Month and Total
- Currency formatted as ₹ (Indian Rupee)
- Divider between rows
- Last updated timestamp (when offline)

### Logout Button
- Red destructive style
- Confirmation alert before logout

## Styling

- Follows existing app design patterns
- Uses consistent color scheme:
  - Primary: #0066cc (blue)
  - Destructive: #dc3545 (red)
  - Warning: #ff9800 (orange)
  - Background: #f5f5f5 (light gray)
- Card-based layout with elevation/shadows
- Responsive spacing and typography

## Dependencies

### New Dependencies Added
- `@react-native-async-storage/async-storage`: For language and earnings caching

### Existing Dependencies Used
- `react-i18next`: For internationalization
- `expo-secure-store`: For secure token storage (via authService)
- `zustand`: For auth state management
- `axios`: For API calls

## Installation

After implementing this screen, run:
```bash
cd mobile
npm install
```

This will install the new AsyncStorage dependency.

## Testing Checklist

- [ ] Profile information displays correctly
- [ ] Profile photo shows if URL exists, otherwise shows initials
- [ ] Language toggle switches between English and Hindi
- [ ] Language preference persists after app restart
- [ ] Earnings load from API when online
- [ ] Earnings show from cache when offline
- [ ] Offline badge appears when using cached data
- [ ] Last updated timestamp shows for cached data
- [ ] Logout confirmation dialog appears
- [ ] Logout clears tokens and navigates to login
- [ ] All translations work in both languages
- [ ] UI is responsive on different screen sizes

## Future Enhancements

1. **Earnings Calculation**: Calculate actual earnings from completed visits
2. **Profile Photo Upload**: Allow workers to upload/change profile photo
3. **Edit Profile**: Allow workers to update their contact information
4. **Payment History**: Show detailed payment transaction history
5. **Biometric Authentication**: Add fingerprint/face unlock option
6. **Dark Mode**: Support dark theme preference

## Related Files

- `mobile/src/screens/ProfileScreen.tsx`: Main component
- `mobile/src/locales/en.json`: English translations
- `mobile/src/locales/hi.json`: Hindi translations
- `mobile/src/i18n.ts`: i18n configuration with AsyncStorage integration
- `mobile/src/services/authService.ts`: Authentication service
- `mobile/src/store/authStore.ts`: Auth state management
- `backend/app/routers/workers.py`: Earnings API endpoint
- `mobile/package.json`: Updated with AsyncStorage dependency
