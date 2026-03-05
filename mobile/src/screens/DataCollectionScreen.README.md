# DataCollectionScreen

The DataCollectionScreen is the core component for recording visit data during HBNC visits. It provides a comprehensive interface for ASHA workers to answer questions using multiple input types.

## Features Implemented

### 1. Question Display & Navigation
- **Progress Indicator**: Shows current question number (e.g., "Question 3 of 15")
- **Question Text**: Displays in selected language (English or Hindi)
- **Language Toggle**: Switch between English and Hindi in real-time
- **Swipe Navigation**: Navigate between questions (handled by Previous/Next buttons)
- **Question List Menu**: Hamburger menu shows all questions with completion status

### 2. Text-to-Speech (TTS)
- **Play Button**: Reads question aloud using expo-speech
- **Language Support**: Automatically uses correct language (en-IN or hi-IN)
- **Play/Pause Toggle**: Stop speaking by tapping again

### 3. Answer Input Types

#### Yes/No Questions
- Two large toggle buttons for Yes/No selection
- Visual feedback for selected answer
- Immediate save to SQLite on selection
- Can change answer at any time

#### Numeric Questions
- Numeric keyboard input
- Real-time validation
- Error display for invalid input
- Save button to confirm entry
- Prevents navigation if required and unanswered

#### Voice Recording
- **Hold to Record**: Press and hold button to record
- **Auto-stop**: Automatically stops after 60 seconds
- **Duration Display**: Shows recording time in real-time
- **File Storage**: Saves to `{documentDirectory}/audio/visit_{visitId}/q_{questionId}.m4a`
- **Playback Review**: Can review recording (future enhancement)
- **Re-record**: Delete and record again
- **Permission Handling**: Prompts for microphone access with settings link

### 4. Previous Answer History
- Shows previous answer for the same question from past visits
- Displays answer value and date recorded
- Helps ASHA workers track changes over time

### 5. Action/Suggestion Cards
- Displays action text when defined in question template
- Highlighted with warning color for urgent actions
- Shows in selected language

### 6. Data Persistence
- **Immediate Save**: All answers saved to SQLite immediately
- **Visit Record**: Creates visit on screen load, updates with each answer
- **Offline-First**: All data stored locally, synced later

## Navigation Flow

```
DaySelectScreen → DataCollectionScreen → SummaryScreen
                  (with visitType, beneficiaryId, dayNumber, templateId)
```

## Required Dependencies

Install these packages if not already present:
```bash
cd mobile
npm install expo-file-system @expo/vector-icons
```

## Usage

The screen is automatically navigated to from DaySelectScreen with required parameters:
- `visitType`: Type of visit (e.g., 'hbnc')
- `beneficiaryId`: ID of the beneficiary
- `dayNumber`: Visit day number (1, 3, 7, 14, or 28)
- `templateId`: ID of the template to use

## Key Implementation Details

### Audio Recording
- Uses expo-av for high-quality audio recording
- Implements 60-second auto-stop timer
- Handles permission requests gracefully
- Stores files in organized directory structure

### State Management
- Uses local state for UI interactions
- Integrates with Zustand auth store for worker info
- Persists all data to SQLite immediately

### Validation
- Required questions prevent navigation until answered
- Numeric inputs validated before saving
- Audio permission checked before recording

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:
- **Requirement 6**: Question Display and Navigation
- **Requirement 7**: Answer Recording - Yes/No Questions
- **Requirement 8**: Answer Recording - Numeric Questions
- **Requirement 9**: Answer Recording - Voice Responses
- **Requirement 10**: Action and Suggestion Display
- **Requirement 11**: Visit History Display

## Future Enhancements

- Audio playback for recorded answers
- Swipe gestures for navigation (currently using buttons)
- Offline indicator
- Auto-save indicator
- Question validation rules (min/max for numbers)
