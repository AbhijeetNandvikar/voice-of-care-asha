# Data Schema Fix - Question Fields Issue

## Problem
The mobile app was showing `undefined` for question text because it had old template data stored in AsyncStorage with an outdated schema:
- Old schema: `text`, `type` fields
- New schema: `question_en`, `question_hi`, `input_type` fields

## Root Cause
The mobile app's AsyncStorage contained templates from a previous version that used different field names. When the DataCollectionScreen tried to access `question_en` and `question_hi`, these fields didn't exist in the old data.

## Solution Applied

### 1. Updated `databaseService.ts`
- Changed `seedFromServer()` to REPLACE templates completely instead of merging them
- This prevents schema conflicts when templates are updated
- Added `clearAllData()` method for manual data reset

### 2. Added Clear & Re-sync Feature in `ProfileScreen.tsx`
- Added "Clear Data & Re-sync" button in the Profile screen
- This allows users to manually clear all local data and re-download from server
- Useful for fixing data schema issues or corrupted data

## How to Fix the Issue

### Option 1: Use the Clear Data Button (Recommended)
1. Open the mobile app
2. Navigate to Profile screen (bottom tab)
3. Scroll down and tap "Clear Data & Re-sync" button
4. Confirm the action
5. The app will clear all local data and re-download fresh data from the server

### Option 2: Clear App Data Manually
1. Go to Android Settings > Apps > Voice of Care
2. Tap "Storage"
3. Tap "Clear Data"
4. Reopen the app and log in again

### Option 3: Reinstall the App
1. Uninstall the app
2. Reinstall from Expo Go or development build
3. Log in again

## Prevention
The fix in `databaseService.ts` ensures that future template updates will completely replace old templates rather than merging them, preventing this type of schema mismatch from happening again.

## Files Modified
- `mobile/src/services/databaseService.ts` - Changed template storage to replace instead of merge
- `mobile/src/screens/ProfileScreen.tsx` - Added clear data & re-sync functionality
