export function mapErrorCodeToMessage(code?: string, fallback = 'An unexpected error occurred'): string {
  switch (code) {
    case 'SLOT_TAKEN':
      return 'This appointment slot was just reserved by someone else. Please select another time.';
    case 'VALIDATION_ERROR':
      return 'Please check the entered information and try again.';
    case 'UNAUTHORIZED':
      return 'Incorrect email or password. Please try again.';
    case 'TOKEN_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'NOT_FOUND':
      return 'The requested record or doctor could not be found.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'INTERNAL':
      return 'The server encountered an issue. Please try again in a few moments.';
    default:
      return fallback;
  }
}

export function extractErrorMessage(err: any): string {
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.response?.data?.error?.code) {
    return mapErrorCodeToMessage(err.response.data.error.code);
  }
  if (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Server request timed out. The server may still be waking up.';
  }
  return err?.message || 'An unexpected error occurred';
}

