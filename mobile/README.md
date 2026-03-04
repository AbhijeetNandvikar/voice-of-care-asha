# Voice of Care - Mobile App

Expo React Native mobile application for ASHA workers to record visits offline.

## Technology Stack

- **Framework**: Expo React Native (SDK 55)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Local Database**: expo-sqlite
- **Audio Recording**: expo-av
- **Text-to-Speech**: expo-speech
- **Secure Storage**: expo-secure-store
- **Internationalization**: react-i18next (English + Hindi)
- **HTTP Client**: Axios

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components for navigation
│   ├── services/        # API clients, database services
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── locales/         # i18n translation files (en.json, hi.json)
│   └── i18n.ts          # i18n configuration
├── App.tsx              # Main app entry point
├── package.json
└── tsconfig.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android development)
- Physical Android device or emulator

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies (already done during initialization):
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on Android:
```bash
npm run android
```

## Development

### Running the App
- **Development server**: `npm start`
- **Android**: `npm run android`
- **Clear cache**: `npm start -- --clear`

### Key Features (Planned)
- Offline-first architecture with SQLite
- ASHA worker authentication with MPIN
- HBNC visit recording with voice, numeric, and yes/no inputs
- Audio recording for open-ended questions
- Data synchronization when online
- English and Hindi language support

## Environment Configuration

Create a `.env` file in the mobile directory with:
```
API_BASE_URL=http://your-backend-url:8000/api/v1
```

## Next Steps

The following tasks will implement:
- SQLite database setup for offline storage
- Authentication screens (Login, MPIN setup/verify)
- Visit recording workflow
- Data synchronization service
- Navigation structure

## Notes

- This is an Android-only application (v1)
- Requires backend API to be running for sync operations
- Offline-first design allows field work without connectivity
