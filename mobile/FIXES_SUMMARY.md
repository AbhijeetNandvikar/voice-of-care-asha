# Mobile App Fixes Summary

## Issues Fixed

### 1. Navigation Bug - VisitType Screen Not Found ✅
**Problem**: Clicking "Start New Visit" caused navigation error
**Solution**: Updated navigation to use nested navigator syntax
```typescript
navigation.navigate('NewVisit', { screen: 'VisitType' })
```

### 2. Mock Data Not Loading ✅
**Problem**: Beneficiaries showing as empty even with valid MCTS IDs
**Solution**: 
- Fixed `user` → `worker` reference in MCTSVerifyScreen
- Added detailed logging to track data flow
- Added manual "Download Data from Server" button on Dashboard

### 3. Backend URL Configuration ✅
**Problem**: App trying to connect to localhost
**Solution**: Updated all config files to use AWS backend: `http://43.204.24.107:8000/api/v1`

### 4. Day Select Screen Not Scrollable ✅
**Problem**: Days 14 and 28 were cut off on smaller screens
**Solution**: Wrapped content in ScrollView

### 5. Questions Screen Blank ✅
**Problem**: DataCollectionScreen showing empty screen
**Solution**: Added validation to check if template has questions and show error message

### 6. Bottom Navigation Missing Icons ✅
**Problem**: Tab bar had no icons
**Solution**: Added Ionicons (home, add-circle, time, person)

### 7. Incomplete Visits Being Saved ✅
**Problem**: Visits created immediately, even if user navigates away
**Solution**: Only create visit when user completes all required questions

### 8. Visit Progress Not Persisted ✅
**Problem**: When navigating away from DataCollectionScreen, all progress is lost
**Solution**: 
- Implemented draft system using AsyncStorage
- Drafts saved automatically after each answer
- Draft restored when returning to same visit
- Draft cleared after successful visit completion
- Draft key format: `visit_draft_{beneficiaryId}_{dayNumber}_{visitType}`

### 9. Language Toggle Not Working ✅
**Problem**: Toggle doesn't switch between English and Hindi properly
**Solution**: 
- Added draft save when language changes
- Language preference persisted in draft
- TTS configured for both 'en-IN' and 'hi-IN'

### 10. Sync Button Enhanced ✅
**Problem**: Sync button needs better error handling and logging
**Solution**: 
- Added detailed console logging
- Improved error messages
- Better network status checking
- Clearer success/failure feedback

### 11. Sync Authentication Error Fixed ✅
**Problem**: Users getting "not authenticated" error when trying to sync, even though logged in
**Root Cause**: Users who logged in offline or verified MPIN offline received mock tokens (e.g., `mock_offline_ASH001`). When syncing, the backend couldn't validate these mock tokens as real JWT tokens, resulting in 401 errors.
**Solution**: 
- Added token validation in syncService before attempting sync
- Detects mock/offline tokens (tokens starting with `mock_offline_`)
- Shows clear error: "You are logged in with offline credentials. Please logout and login again with internet connection to sync."
- Added warning banner on Dashboard when user has offline token but is online
- Added `hasOfflineToken()` method to check token status
- Users with valid JWT tokens (online login) can sync normally

**User Action Required**: If you see this error, logout from Profile screen and login again with internet connection to get a valid token for syncing.

## Implementation Details

### Draft Persistence System
```typescript
// Draft structure
{
  answers: Answer[],
  currentQuestionIndex: number,
  language: 'en' | 'hi',
  timestamp: string
}

// Key functions
- loadDraft(): Restores saved progress on screen load
- saveDraft(): Saves progress after each answer/navigation
- clearDraft(): Removes draft after visit completion
```

### When Drafts Are Saved
- After answering any question
- When navigating to next/previous question
- When changing language
- When navigating away from screen

### When Drafts Are Cleared
- After successfully completing visit (navigating to Summary)
- User can manually discard (future enhancement)

## Files Modified

- `mobile/src/services/api.ts` - Backend URL
- `mobile/src/services/authService.ts` - Added logging
- `mobile/src/services/databaseService.ts` - Added detailed logging
- `mobile/src/services/syncService.ts` - Added token validation, offline mode detection, hasOfflineToken() method
- `mobile/src/screens/DashboardScreen.tsx` - Added download button, fixed navigation, improved sync, offline token warning banner
- `mobile/src/screens/MCTSVerifyScreen.tsx` - Fixed user→worker reference
- `mobile/src/screens/DaySelectScreen.tsx` - Made scrollable
- `mobile/src/screens/DataCollectionScreen.tsx` - Added draft persistence, validation, fixed visit creation, language toggle
- `mobile/src/navigation/AppNavigator.tsx` - Added tab icons
- `mobile/.env` - Backend URL
- `web/.env*` - Backend URL (all env files)

## Testing Checklist

- [x] Login with backend credentials
- [x] Login with mock credentials (offline)
- [x] Download data from server
- [x] Search for beneficiary by MCTS ID
- [x] Select visit day (scrollable)
- [x] View questions
- [x] Answer questions and save progress
- [x] Navigate away and return (progress persists)
- [x] Toggle language (EN ↔ हिं)
- [x] Complete visit
- [x] Sync visit to backend (with logging)

## User Experience Improvements

1. **No Data Loss**: Users can safely navigate away and return without losing progress
2. **Language Flexibility**: Can switch languages mid-visit without losing answers
3. **Better Feedback**: Clear console logs for debugging sync issues
4. **Offline-First**: Drafts work completely offline
5. **Automatic Saving**: No manual save button needed

## Known Limitations

1. **Draft Cleanup**: Drafts are only cleared on successful completion. If user abandons a visit, draft remains until they return or manually clear it (future: add "Discard Draft" option)
2. **Audio Files**: Audio recordings are not included in drafts (only saved in final visit)
3. **Multiple Devices**: Drafts are device-specific (not synced across devices)

## Future Enhancements

- [ ] Add "Resume Draft" indicator on visit selection
- [ ] Add "Discard Draft" button
- [ ] Show draft age/timestamp
- [ ] Sync drafts across devices (optional)
- [ ] Add draft cleanup on logout

