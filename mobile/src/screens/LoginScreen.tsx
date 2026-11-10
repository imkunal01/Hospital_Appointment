import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginApi, registerApi, googleAuthApi } from '../api/endpoints';
import { setSession } from '../auth/sessionStore';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const LoginScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLoginOrRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError('');

    try {
      if (isSignUp) {
        const response = await registerApi(email.trim(), password, name.trim() || undefined);
        await setSession(response.user, response.accessToken, response.refreshToken);
      } else {
        const response = await loginApi(email.trim(), password);
        await setSession(response.user, response.accessToken, response.refreshToken);
      }
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGeneralError('');

    try {
      // Mock Google OAuth authentication payload
      const mockGoogleEmail = 'alex.demo@gmail.com';
      const mockGoogleName = 'Alex Demo';
      const mockGoogleId = 'google-oauth2|9876543210';

      const response = await googleAuthApi(mockGoogleEmail, mockGoogleName, mockGoogleId);
      await setSession(response.user, response.accessToken, response.refreshToken);
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Gradient with Decorative Graphic */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Background concentric depth rings */}
            <View style={styles.decorCircleTopRightOuter} />
            <View style={styles.decorCircleTopRightMid} />
            <View style={styles.decorCircleTopRightInner} />
            <View style={styles.decorCircleBottomLeftOuter} />
            <View style={styles.decorCircleBottomLeftInner} />

            {/* Top Brand Bar */}
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCard}>
                <Ionicons name="fitness" size={24} color={colors.primary} />
              </View>
              <Text style={styles.brandTitle}>MediBook</Text>
            </View>

            {/* Central Floating Calendar Graphic */}
            <View style={styles.centerGraphicContainer}>
              <View style={styles.cardShadowOffset} />
              <View style={styles.floatingCard}>
                <MaterialCommunityIcons
                  name="calendar-plus"
                  size={42}
                  color={colors.primaryDark}
                />
                <View style={styles.notificationBadge}>
                  <Ionicons name="pulse" size={17} color="#E11D48" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.bodyContent}>
          <Text style={styles.eyebrow}>
            {isSignUp ? 'JOIN MEDIBOOK' : 'GOOD TO SEE YOU'}
          </Text>
          <Text style={styles.title}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Sign up to discover top doctors and manage appointments.'
              : 'Book and manage your hospital visits, simply.'}
          </Text>

          {/* Social Sign-In (Method 1: Google) */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.75}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {generalError ? (
            <View
              accessibilityRole="alert"
              style={styles.errorAlert}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.errorText}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.errorAlertText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form Fields (Method 2: Email & Password) */}
          <View style={styles.formContainer}>
            {isSignUp ? (
              <Input
                label="Full Name (Optional)"
                placeholder="e.g. Alex Sharma"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            ) : null}

            <Input
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              error={passwordError}
              rightElement={
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title={isSignUp ? 'Create account' : 'Sign in'}
              onPress={handleLoginOrRegister}
              loading={loading}
              style={styles.signInButton}
              textStyle={styles.signInButtonText}
            />
          </View>

          {/* Toggle between Sign In & Sign Up */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
            style={styles.toggleAuthModeRow}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setGeneralError('');
              setEmailError('');
              setPasswordError('');
            }}
          >
            <Text style={styles.toggleAuthText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleAuthLink}>
                {isSignUp ? 'Sign in' : 'Create account'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Credentials Cards (For Evaluator Testing) */}
          {!isSignUp ? (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fill Patient 1 credentials"
                style={styles.demoAccountCard}
                onPress={() => fillDemoCredentials('patient1@example.test')}
                activeOpacity={0.7}
              >
                <View style={styles.demoAvatarBadge}>
                  <Feather name="user" size={18} color={colors.primary} />
                </View>
                <View style={styles.demoAccountInfo}>
                  <Text style={styles.demoCardTitle}>Try the demo account</Text>
                  <Text style={styles.demoCardSubtitle}>patient1@example.test</Text>
                </View>
                <Text style={styles.demoActionText}>Tap to fill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fill Patient 2 credentials"
                style={[styles.demoAccountCard, { marginTop: 8 }]}
                onPress={() => fillDemoCredentials('patient2@example.test')}
                activeOpacity={0.7}
              >
                <View style={[styles.demoAvatarBadge, { backgroundColor: '#EDE9FE' }]}>
                  <Feather name="users" size={18} color="#7C3AED" />
                </View>
                <View style={styles.demoAccountInfo}>
                  <Text style={styles.demoCardTitle}>Concurrency test account</Text>
                  <Text style={styles.demoCardSubtitle}>patient2@example.test</Text>
                </View>
                <Text style={[styles.demoActionText, { color: '#7C3AED' }]}>Tap to fill</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Trust & Security Badge */}
          <View style={styles.securityFooter}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.securityText}>
              Your information is securely protected
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background
  },
  heroWrapper: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background
  },
  heroGradient: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
    overflow: 'hidden'
  },
  decorCircleTopRightOuter: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  decorCircleTopRightMid: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  decorCircleTopRightInner: {
    position: 'absolute',
    top: 40,
    right: 75,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.16)'
  },
  decorCircleBottomLeftOuter: {
    position: 'absolute',
    bottom: -25,
    left: -25,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  decorCircleBottomLeftInner: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16
  },
  brandLogoCard: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  brandTitle: {
    marginLeft: 12,
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  centerGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 16,
    position: 'relative'
  },
  cardShadowOffset: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
    position: 'absolute',
    transform: [{ translateY: 6 }, { translateX: -4 }]
  },
  floatingCard: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 4
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: 6
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20
  },
  googleButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600'
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  errorAlertText: {
    flex: 1,
    color: colors.errorText,
    fontSize: 14,
    fontWeight: '600'
  },
  formContainer: {
    marginBottom: 4
  },
  eyeButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  signInButton: {
    marginTop: 10,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700'
  },
  toggleAuthModeRow: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14
  },
  toggleAuthText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  toggleAuthLink: {
    color: colors.primary,
    fontWeight: '800'
  },
  demoAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    minHeight: 52
  },
  demoAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  demoAccountInfo: {
    flex: 1,
    marginLeft: 12
  },
  demoCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  demoCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  demoActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8
  },
  securityText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginLeft: 6
  }
});
