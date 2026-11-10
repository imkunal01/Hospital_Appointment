import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSession, setInMemoryAccessToken, setSession, setInitialized, updateSessionUser } from '../auth/sessionStore';
import { getRefreshToken, removeRefreshToken } from '../auth/secureStorage';
import { apiClient } from '../api/client';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AppNavigator } from './AppNavigator';
import { WakingUpBanner } from '../components/WakingUpBanner';
import { OfflineBanner } from '../components/OfflineBanner';
import { colors } from '../theme/colors';

export const RootNavigator: React.FC = () => {
  const { user, isAuthenticated, isInitialized } = useSession();

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

        // Fetch user profile to verify onboarding status
        try {
          const userRes = await apiClient.get('/auth/me');
          updateSessionUser(userRes.data);
        } catch {
          // If offline or profile fetch fails, proceed with stored session
        }

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

  const renderContent = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }
    // One-time only prompt: if user has not completed onboarding, gate into Onboarding flow
    if (!user?.onboardingCompleted) {
      return <OnboardingNavigator />;
    }
    return <AppNavigator />;
  };

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <WakingUpBanner />
        <OfflineBanner />
        {renderContent()}
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
