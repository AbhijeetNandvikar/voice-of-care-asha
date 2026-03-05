// Utility helper functions

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time to readable string
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  // This will be implemented with NetInfo in future tasks
  return true;
};

/**
 * Validate MCTS ID format
 */
export const isValidMCTSId = (mctsId: string): boolean => {
  // Basic validation - adjust based on actual MCTS ID format
  return mctsId.length > 0 && /^[A-Z0-9]+$/.test(mctsId);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

/**
 * Validate MPIN (4 digits)
 */
export const isValidMPIN = (mpin: string): boolean => {
  return /^\d{4}$/.test(mpin);
};

/**
 * Generate unique visit ID for local storage
 */
export const generateLocalVisitId = (): string => {
  return `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate file size in MB
 */
export const bytesToMB = (bytes: number): number => {
  return bytes / (1024 * 1024);
};

/**
 * Format duration in seconds to MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
