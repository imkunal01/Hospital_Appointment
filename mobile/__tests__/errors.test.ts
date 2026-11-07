import { mapErrorCodeToMessage, extractErrorMessage } from '../src/utils/errors.js';

describe('Error Code Mapper & Error Extractor', () => {
  describe('mapErrorCodeToMessage', () => {
    it('maps SLOT_TAKEN to actionable re-selection guidance', () => {
      const msg = mapErrorCodeToMessage('SLOT_TAKEN');
      expect(msg).toContain('reserved by someone else');
      expect(msg).toContain('select another time');
    });

    it('maps VALIDATION_ERROR to user form validation notice', () => {
      const msg = mapErrorCodeToMessage('VALIDATION_ERROR');
      expect(msg).toContain('check the entered information');
    });

    it('maps UNAUTHORIZED to invalid credential message', () => {
      const msg = mapErrorCodeToMessage('UNAUTHORIZED');
      expect(msg).toContain('Incorrect email or password');
    });

    it('maps TOKEN_EXPIRED to session expiry notice', () => {
      const msg = mapErrorCodeToMessage('TOKEN_EXPIRED');
      expect(msg).toContain('session has expired');
    });

    it('maps NOT_FOUND to resource missing message', () => {
      const msg = mapErrorCodeToMessage('NOT_FOUND');
      expect(msg).toContain('could not be found');
    });

    it('maps RATE_LIMITED to rate limiting guidance', () => {
      const msg = mapErrorCodeToMessage('RATE_LIMITED');
      expect(msg).toContain('Too many attempts');
    });

    it('maps INTERNAL to polite server error notice', () => {
      const msg = mapErrorCodeToMessage('INTERNAL');
      expect(msg).toContain('server encountered an issue');
    });

    it('falls back to default message when code is unknown', () => {
      const msg = mapErrorCodeToMessage('UNKNOWN_CODE', 'Custom fallback');
      expect(msg).toBe('Custom fallback');
    });
  });

  describe('extractErrorMessage', () => {
    it('extracts direct backend response message if present', () => {
      const error = {
        response: {
          data: {
            error: {
              code: 'SLOT_TAKEN',
              message: 'Custom backend message from server'
            }
          }
        }
      };
      expect(extractErrorMessage(error)).toBe('Custom backend message from server');
    });

    it('falls back to code mapping if message is omitted in response', () => {
      const error = {
        response: {
          data: {
            error: {
              code: 'SLOT_TAKEN'
            }
          }
        }
      };
      expect(extractErrorMessage(error)).toContain('reserved by someone else');
    });

    it('handles network disconnection errors cleanly without crashing', () => {
      const error = { code: 'ERR_NETWORK', message: 'Network Error' };
      expect(extractErrorMessage(error)).toContain('check your internet connection');
    });

    it('handles server cold-start timeouts cleanly without crashing', () => {
      const error = { code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' };
      expect(extractErrorMessage(error)).toContain('Server request timed out');
    });
  });
});
