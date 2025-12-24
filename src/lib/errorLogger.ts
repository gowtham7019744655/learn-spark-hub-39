/**
 * Secure error logging utility
 * Prevents sensitive database schema information from leaking to browser console in production
 */

const isDev = import.meta.env.DEV;

/**
 * Log errors only in development mode
 */
export const logError = (context: string, error: unknown): void => {
  if (isDev) {
    console.error(`[${context}]`, error);
  }
};

/**
 * Convert database/API errors to safe user-facing messages
 * Maps common error patterns to generic messages without exposing internals
 */
export const getSafeErrorMessage = (error: unknown): string => {
  const message = error instanceof Error 
    ? error.message 
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  // Map common database errors to user-friendly messages
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return 'This record already exists';
  }
  if (message.includes('foreign key')) {
    return 'Related record not found';
  }
  if (message.includes('JWT') || message.includes('token')) {
    return 'Your session has expired. Please sign in again';
  }
  if (message.includes('permission') || message.includes('denied')) {
    return 'You do not have permission to perform this action';
  }
  if (message.includes('not found') || message.includes('no rows')) {
    return 'Record not found';
  }
  if (message.includes('timeout') || message.includes('network')) {
    return 'Network error. Please check your connection';
  }
  if (message.includes('rate limit')) {
    return 'Too many requests. Please try again later';
  }

  // Generic fallback - don't expose internal details
  return 'Operation failed. Please try again';
};
