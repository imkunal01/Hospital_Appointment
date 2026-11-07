import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'ha_auth_refresh_token';

/**
 * Persist the refresh token in platform secure hardware keystore.
 * Never logs the token value.
 */
export async function saveRefreshToken(token: string): Promise<void> {
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
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove refresh token from SecureStore');
  }
}
