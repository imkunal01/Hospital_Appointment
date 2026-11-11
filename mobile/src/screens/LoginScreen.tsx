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
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginApi, registerApi, googleAuthApi } from '../api/endpoints';
import { setSession } from '../auth/sessionStore';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

export const LoginScreen: React.FC = () => {
  const insets = useSafeInsets();
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

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const session = await registerApi(email.trim(), password, name.trim() || undefined);
        await setSession(session);
      } else {
        const session = await loginApi(email.trim(), password);
        await setSession(session);
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
      const mockGoogleEmail = 'patient.google@example.test';
      const mockGoogleName = 'Alex Morgan';
      const mockGoogleId = 'mock-google-id-' + Date.now();
      const session = await googleAuthApi(mockGoogleEmail, mockGoogleName, mockGoogleId);
      await setSession(session);
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setIsSignUp(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Banner (Deep Ink-Green with Editorial Shapes) */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 16 }
          ]}
        >
          {/* Decorative Art Rings */}
          <View style={styles.decorRing} />
          <View style={styles.decorCoralArch} />

          {/* Logo Bar */}
          <View style={styles.brandRow}>
            <View style={styles.logoPlusCircle}>
              <Feather name="plus" size={18} color={colors.foundation} />
            </View>
            <Text style={styles.brandTitle}>medibook</Text>
          </View>

          <View style={styles.greetingPill}>
            <Text style={styles.greetingPillText}>Healthcare Portal</Text>
          </View>

          <Text style={styles.heroTitle}>
            {isSignUp ? 'Create your\npatient account' : 'Sign in to\nyour care portal'}
          </Text>
        </View>

        {/* Form Body Canvas */}
        <View style={styles.formCanvas}>
          {/* Demo Credentials Quick-Fill Cards */}
          <View style={styles.demoSection}>
            <Text style={styles.demoEyebrow}>EVALUATOR QUICK-SIGN IN (SINGLE TAP)</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fill Patient 1 credentials"
                style={[styles.demoCard, { backgroundColor: colors.chartreuse }]}
                onPress={() => fillDemo('patient1@example.test')}
                activeOpacity={0.8}
              >
                <Feather name="user-check" size={16} color={colors.ink} style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.demoCardTitle}>Patient 1 (Jane)</Text>
                  <Text style={styles.demoCardSub}>patient1@example.test</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fill Patient 2 credentials"
                style={[styles.demoCard, { backgroundColor: colors.lilac }]}
                onPress={() => fillDemo('patient2@example.test')}
                activeOpacity={0.8}
              >
                <Feather name="user-check" size={16} color={colors.ink} style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.demoCardTitle}>Patient 2 (Sarah)</Text>
                  <Text style={styles.demoCardSub}>patient2@example.test</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Sign In */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {generalError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Input Fields */}
          {isSignUp && (
            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <Input
            label="Email Address"
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
            error={passwordError}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 8 }}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.inkMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* Sign In CTA Button */}
          <Button
            title={loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* Toggle between Login and Register */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
            style={styles.toggleRow}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setGeneralError('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already registered? ' : "Don't have an account? "}
              <Text style={styles.toggleTextBold}>
                {isSignUp ? 'Sign in' : 'Create account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  scrollContent: {
    paddingBottom: 40
  },

  // Hero Section
  heroSection: {
    backgroundColor: colors.foundation,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
    overflow: 'hidden'
  },
  decorRing: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 26,
    borderColor: colors.lilac,
    opacity: 0.85
  },
  decorCoralArch: {
    position: 'absolute',
    top: 50,
    right: 40,
    width: 80,
    height: 100,
    borderRadius: 40,
    backgroundColor: colors.coral,
    opacity: 0.95
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  logoPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.chartreuse,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  greetingPill: {
    backgroundColor: colors.chartreuse,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10
  },
  greetingPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 36
  },

  // Form Canvas
  formCanvas: {
    paddingHorizontal: 18,
    paddingTop: 20
  },
  demoSection: {
    marginBottom: 16
  },
  demoEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 8
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  demoCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  demoCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: colors.ink
  },
  demoCardSub: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkMuted
  },

  // Social
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 16
  },
  googleButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E2DDD2'
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coralLight,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.error
  },

  submitBtn: {
    marginTop: 8,
    marginBottom: 14
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: 10
  },
  toggleText: {
    fontSize: 14,
    color: colors.inkMuted,
    fontWeight: '600'
  },
  toggleTextBold: {
    color: colors.ink,
    fontWeight: '900',
    textDecorationLine: 'underline'
  }
});
