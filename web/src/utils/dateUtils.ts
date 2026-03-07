/**
 * Date utility functions
 * Handles timezone-aware date parsing for IST display
 */

/**
 * Parse a date string from the API as UTC (appends 'Z' if no timezone info is present).
 * This fixes the issue where backend returns naive datetime strings that are actually UTC,
 * but the browser would otherwise parse them as local time.
 */
export function parseUTCDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  // If no timezone indicator, treat as UTC
  const normalized =
    dateString.endsWith('Z') || /[+\-]\d{2}:\d{2}$/.test(dateString)
      ? dateString
      : dateString + 'Z';
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date string for display (date only, localized to user's timezone).
 */
export function formatDate(
  dateString: string | null | undefined,
  locale = 'en-IN'
): string {
  const date = parseUTCDate(dateString);
  if (!date) return dateString ?? '';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string for display (date + time, localized to user's timezone).
 */
export function formatDateTime(
  dateString: string | null | undefined,
  locale = 'en-IN'
): string {
  const date = parseUTCDate(dateString);
  if (!date) return dateString ?? '';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
