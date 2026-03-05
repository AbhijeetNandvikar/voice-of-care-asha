# Internationalization (i18n) Guide

## Overview

The Voice of Care mobile app supports English and Hindi languages using `react-i18next`. The language preference is persisted locally and can be changed from the Profile screen.

## Configuration

The i18n configuration is located in `src/i18n.ts` and is automatically initialized when the app starts.

### Supported Languages
- **English (en)**: Default language
- **Hindi (hi)**: हिंदी

## Translation Files

Translation files are located in `src/locales/`:
- `en.json` - English translations
- `hi.json` - Hindi translations

## Usage in Components

### Using the useTranslation Hook

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('welcome')}</Text>
      <Text>{t('dashboard_subtitle')}</Text>
    </View>
  );
}
```

### Using the Helper Utility

```typescript
import { t, changeLanguage, getCurrentLanguage } from '../utils/i18n';

// Get translation
const welcomeText = t('welcome');

// Change language
await changeLanguage('hi'); // Switch to Hindi
await changeLanguage('en'); // Switch to English

// Get current language
const currentLang = getCurrentLanguage(); // Returns 'en' or 'hi'
```

### Interpolation

For dynamic values in translations:

```typescript
// In translation file:
{
  "greeting": "Hello, {{name}}!",
  "attempts_remaining": "{{count}} attempts remaining"
}

// In component:
t('greeting', { name: 'Asha' }) // "Hello, Asha!"
t('attempts_remaining', { count: 2 }) // "2 attempts remaining"
```

## Adding New Translations

1. Add the key-value pair to both `en.json` and `hi.json`
2. Use descriptive keys in snake_case (e.g., `mpin_setup_success`)
3. Keep translations concise and user-friendly
4. Test both languages to ensure proper display

### Example

```json
// en.json
{
  "new_feature_title": "New Feature",
  "new_feature_description": "This is a new feature description"
}

// hi.json
{
  "new_feature_title": "नई सुविधा",
  "new_feature_description": "यह एक नई सुविधा विवरण है"
}
```

## Language Switching

Users can switch languages from the Profile screen. The preference is saved to AsyncStorage and persists across app restarts.

```typescript
import { changeLanguage } from '../utils/i18n';

const handleLanguageChange = async (language: 'en' | 'hi') => {
  try {
    await changeLanguage(language);
    // UI will automatically update
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};
```

## Translation Categories

### Authentication
- Login, logout, MPIN setup/verification
- Error messages for invalid credentials
- Success messages

### Dashboard
- Welcome messages, schedule, sync status
- Beneficiary information
- Visit status indicators

### Visit Flow
- Visit type selection (HBNC, ANC, PNC)
- Beneficiary verification
- Day selection
- Data collection (questions, answers)
- Visit summary

### Profile
- User information labels
- Language preference
- Earnings display
- Logout confirmation

### Common UI Elements
- Buttons: Save, Cancel, Confirm, Retry
- Status: Loading, Error, Success
- Navigation: Back, Next, Previous
- Filters: All, Last Week, Last Month

## Best Practices

1. **Always use translation keys**: Never hardcode user-facing text
   ```typescript
   // ❌ Bad
   <Text>Welcome to Voice of Care</Text>
   
   // ✅ Good
   <Text>{t('welcome')}</Text>
   ```

2. **Use descriptive keys**: Make keys self-explanatory
   ```typescript
   // ❌ Bad
   t('msg1')
   
   // ✅ Good
   t('mpin_setup_success')
   ```

3. **Keep translations consistent**: Use the same terminology across the app
   - "MCTS ID" not "MCTS Id" or "mcts id"
   - "Beneficiary" not "Patient" or "Recipient"

4. **Test both languages**: Always verify translations display correctly in both English and Hindi

5. **Handle long text**: Ensure UI components can accommodate longer Hindi translations

6. **Use proper formatting**: Maintain proper spacing and punctuation in both languages

## Common Translation Keys

### Frequently Used
- `loading` - "Loading..."
- `error` - "Error"
- `success` - "Success"
- `retry` - "Retry"
- `cancel` - "Cancel"
- `confirm` - "Confirm"
- `save` - "Save"
- `back` - "Back"
- `next` - "Next"

### Status Messages
- `completed` - "Completed"
- `pending` - "Pending"
- `synced` - "Synced"
- `not_synced` - "Not Synced"

### Error Messages
- `network_error` - "Network error. Please check your connection."
- `server_error` - "Server error. Please try again later."
- `unknown_error` - "An unexpected error occurred."

## Troubleshooting

### Translations not updating
- Ensure you've added the key to both `en.json` and `hi.json`
- Restart the development server
- Clear Metro bundler cache: `npx expo start -c`

### Language not persisting
- Check AsyncStorage permissions
- Verify `changeLanguage()` is being called correctly
- Check for errors in console logs

### Missing translations
- Use `hasTranslation(key)` to check if a key exists
- Fallback to English if translation is missing
- Add missing keys to translation files

## Future Enhancements

- Add more regional languages (Tamil, Telugu, Bengali, etc.)
- Implement RTL support for future languages
- Add translation management system for easier updates
- Support for dynamic content translation from backend
