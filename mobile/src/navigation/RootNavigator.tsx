import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSession, setInMemoryAccessToken, setSession, setInitialized } from '../auth/sessionStore';
import { getRefreshToken, removeRefreshToken } from '../auth/secureStorage';
import { apiClient } from '../api/client';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { WakingUpBanner } from '../components/WakingUpBanner';
import { OfflineBanner } from '../components/OfflineBanner';
import { colors } from '../theme/colors';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized } = useSession();

  useEffect(() => {
    async function restoreAuthSession() {
      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          setInitialized(true);
          return;
        }

        // Validate refresh token with backend
        const response = await apiClient.post('/auth/refresh', {
          refreshToken: storedRefreshToken
        });

        const newAccessToken = response.data.accessToken;
        setInMemoryAccessToken(newAccessToken);

        // Session restored
        setInitialized(true);
      } catch (err) {
        // Refresh token invalid or revoked; clear SecureStore
        await removeRefreshToken();
        setInitialized(true);
      }
    }

    restoreAuthSession();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <WakingUpBanner />
        <OfflineBanner />
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  }
});

