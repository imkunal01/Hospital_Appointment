import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'ha_auth_refresh_token';

// In-memory fallback for web environment
let webInMemoryRefreshToken: string | null = null;

/**
 * Persist the refresh token in platform secure hardware keystore.
 * On native Android/iOS, uses expo-secure-store (Android Keystore / iOS Keychain).
 * On web (browser), falls back to localStorage / in-memory.
 * Never logs the token value.
 */
export async function saveRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        webInMemoryRefreshToken = token;
      }
    } catch {
      webInMemoryRefreshToken = token;
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  } catch (err) {
    console.error('Failed to save refresh token to SecureStore');
    throw err;
  }
}

/**
 * Retrieve the refresh token from platform secure storage.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return webInMemoryRefreshToken;
    } catch {
      return webInMemoryRefreshToken;
    }
  }

  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to read refresh token from SecureStore');
    return null;
  }
}

/**
 * Remove the refresh token on logout or session reset.
 */
export async function removeRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {}
    webInMemoryRefreshToken = null;
    return;
  }

  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove refresh token from SecureStore');
  }
}

