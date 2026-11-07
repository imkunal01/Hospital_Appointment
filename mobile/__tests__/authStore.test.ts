import * as SecureStore from 'expo-secure-store';
import {
  setSession,
  clearSession,
  getInMemoryAccessToken,
  setInMemoryAccessToken
} from '../src/auth/sessionStore';
import { UserProfile } from '../src/api/types';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY'
  };
});

describe('Auth Store & Secure Storage Isolation', () => {
  const mockUser: UserProfile = {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'patient1@example.test',
    name: 'John Doe',
    role: 'PATIENT'
  };

  beforeEach(async () => {
    await clearSession();
    jest.clearAllMocks();
  });

  it('keeps access token strictly in memory', () => {
    setInMemoryAccessToken('sample_access_jwt_token_123');
    expect(getInMemoryAccessToken()).toBe('sample_access_jwt_token_123');
  });

  it('setSession stores refresh token in SecureStore and access token in memory', async () => {
    const rawRefreshToken = 'secure_random_refresh_token_hex_999';
    const rawAccessToken = 'signed_access_jwt_header_payload_signature';

    await setSession(mockUser, rawAccessToken, rawRefreshToken);

    // Verify access token is accessible in memory
    expect(getInMemoryAccessToken()).toBe(rawAccessToken);

    // Verify SecureStore received the refresh token
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'ha_auth_refresh_token',
      rawRefreshToken,
      expect.any(Object)
    );
  });

  it('clearSession wipes in-memory access token and removes refresh token from SecureStore', async () => {
    await setSession(mockUser, 'access_token', 'refresh_token');
    expect(getInMemoryAccessToken()).toBe('access_token');

    await clearSession();

    // Verify memory token is cleared
    expect(getInMemoryAccessToken()).toBeNull();

    // Verify SecureStore item deleted
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ha_auth_refresh_token');
  });
});

