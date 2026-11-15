import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ClinicalProgressBar } from '../components/ClinicalProgressBar';
import { loginApi, registerApi, googleAuthApi, resetDemoAccountApi } from '../api/endpoints';
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
  const [selectedDemo, setSelectedDemo] = useState<'patient1' | null>('patient1');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In Sheet State
  const [isGoogleModalVisible, setGoogleModalVisible] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isCustomGoogleMode, setIsCustomGoogleMode] = useState(false);
  const [googleModalError, setGoogleModalError] = useState('');

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

  const handleExecuteGoogleSignIn = async (userEmail: string, userName: string) => {
    const trimmedEmail = userEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setGoogleModalError('Please enter a valid Google email address');
      return;
    }

    setGoogleLoading(true);
    setGoogleModalError('');
    setGeneralError('');
    setGoogleModalVisible(false);

    try {
      const googleId = 'g-' + Math.abs(trimmedEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      const session = await googleAuthApi(trimmedEmail, userName.trim() || 'Google User', googleId);
      await setSession(session);
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemo = (demoEmail: string = 'patient1@example.test') => {
    setSelectedDemo('patient1');
    setEmail(demoEmail);
    setPassword('Password123!');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setIsSignUp(false);
    // Auto-reset onboarding state in background so recruiters experience fresh onboarding
    resetDemoAccountApi();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Header: Soft Medical Ice Blue with Stethoscope Branding */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 12 }
          ]}
        >
          {/* Circular decorative soft glow behind stethoscope */}
          <View style={styles.stethoscopeGlowCircle} />

          {/* Stethoscope Image from Assets */}
          <Image
            source={require('../../assets/stethoscope.png')}
            style={styles.headerStethoscope}
            resizeMode="contain"
            accessibilityLabel="Hospital Stethoscope illustration"
          />

          {/* Brand Logo Row: + medibook */}
          <View style={styles.brandRow}>
            <View style={styles.logoPlusCircle}>
              <Feather name="plus" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>medibook</Text>
          </View>

          {/* Healthcare Portal Pill */}
          <View style={styles.greetingPill}>
            <Text style={styles.greetingPillText}>Healthcare Portal</Text>
          </View>

          {/* Hero Main Headline */}
          <Text style={styles.heroTitle}>
            {isSignUp ? 'Create your\npatient account' : 'Sign in to portal'}
          </Text>
        </View>

        {/* Clean White Card Form Canvas */}
        <View style={styles.formCanvasWrapper}>
          <View style={styles.formCard}>
            {/* Evaluator Quick-Sign In (Single Tap) */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeaderRow}>
                <Text style={styles.demoEyebrow}>EVALUATOR QUICK-SIGN IN (SINGLE TAP)</Text>
                <View style={styles.freshBadge}>
                  <Text style={styles.freshBadgeText}>✨ Fresh Onboarding</Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fill Patient 1 credentials"
                style={[
                  styles.demoCard,
                  styles.demoCardSingle,
                  selectedDemo === 'patient1' ? styles.demoCardActive : styles.demoCardInactive
                ]}
                onPress={() => fillDemo('patient1@example.test')}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.demoIconWrap,
                    selectedDemo === 'patient1' && styles.demoIconWrapActive
                  ]}
                >
                  <Feather
                    name="user-check"
                    size={18}
                    color={selectedDemo === 'patient1' ? colors.brandBlue : colors.inkMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.demoCardTitle,
                      selectedDemo === 'patient1' && styles.demoCardTitleActive
                    ]}
                    numberOfLines={1}
                  >
                    Evaluator Demo (Fresh Onboarding)
                  </Text>
                  <Text
                    style={[
                      styles.demoCardSub,
                      selectedDemo === 'patient1' && styles.demoCardSubActive
                    ]}
                    numberOfLines={1}
                  >
                    patient1@example.test · Password123!
                  </Text>
                </View>
                <Feather
                  name="check-circle"
                  size={20}
                  color={selectedDemo === 'patient1' ? colors.brandBlue : '#CBD5E1'}
                />
              </TouchableOpacity>
            </View>

            {/* Social Sign In (Google) */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              style={styles.googleButton}
              onPress={() => {
                setGoogleModalError('');
                setIsCustomGoogleMode(false);
                setGoogleModalVisible(true);
              }}
              disabled={googleLoading || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
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
              rightElement={
                <View style={{ paddingRight: 8 }}>
                  <Feather name="mail" size={18} color={colors.inkSubtle} />
                </View>
              }
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
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.inkSubtle}
                  />
                </TouchableOpacity>
              }
            />

            {/* Active Authentication Progress Bar */}
            {(loading || googleLoading) && (
              <View style={styles.loginProgressCardWrap}>
                <ClinicalProgressBar
                  active={loading || googleLoading}
                  title="Authenticating Clinical Credentials"
                  variant="inline"
                />
              </View>
            )}

            {/* Sign In CTA Button */}
            <Button
              title={loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
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
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleTextBold}>
                  {isSignUp ? 'Sign in' : 'Create account'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Google Sign-In Account Chooser Modal */}
        <Modal
          visible={isGoogleModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGoogleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.googleSheetContainer}>
              {/* Google Brand Header */}
              <View style={styles.googleSheetHeader}>
                <View style={styles.googleLogoWrap}>
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                </View>
                <Text style={styles.googleSheetTitle}>Sign in with Google</Text>
                <Text style={styles.googleSheetSubtitle}>Choose an account to continue to MediBook</Text>
              </View>

              {googleModalError ? (
                <View style={styles.googleErrorBanner}>
                  <Feather name="alert-circle" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
                  <Text style={styles.googleErrorText}>{googleModalError}</Text>
                </View>
              ) : null}

              {!isCustomGoogleMode ? (
                <View style={styles.googleAccountsList}>
                  {/* 1-Tap Quick Google Sign-In */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Alex Morgan Google account"
                    style={styles.googleAccountCard}
                    onPress={() => handleExecuteGoogleSignIn('alex.recruiter@gmail.com', 'Alex Morgan')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.googleAvatarCircle}>
                      <Text style={styles.googleAvatarLetter}>A</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.googleAccountName}>Alex Morgan (Recruiter)</Text>
                      <Text style={styles.googleAccountEmail}>alex.recruiter@gmail.com</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                  </TouchableOpacity>

                  {/* Custom Real Google Account Option */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Use your Google account"
                    style={styles.googleAccountCard}
                    onPress={() => setIsCustomGoogleMode(true)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.googleAvatarCircle, { backgroundColor: '#F1F5F9' }]}>
                      <Feather name="user-plus" size={18} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.googleAccountName}>Use your Google account</Text>
                      <Text style={styles.googleAccountEmail}>Enter your real Google / Gmail address</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Custom Google Email Form */
                <View style={styles.customGoogleForm}>
                  <Text style={styles.customGooglePrompt}>Enter your Google account details:</Text>
                  <TextInput
                    placeholder="Your Google email (e.g. name@gmail.com)"
                    placeholderTextColor={colors.inkSubtle}
                    value={customGoogleEmail}
                    onChangeText={setCustomGoogleEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.googleInput}
                  />
                  <TextInput
                    placeholder="Your Display Name (optional)"
                    placeholderTextColor={colors.inkSubtle}
                    value={customGoogleName}
                    onChangeText={setCustomGoogleName}
                    style={[styles.googleInput, { marginTop: 10 }]}
                  />

                  <View style={styles.customGoogleActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Back to accounts list"
                      style={styles.googleCancelBtn}
                      onPress={() => setIsCustomGoogleMode(false)}
                    >
                      <Text style={styles.googleCancelBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Continue with entered Google account"
                      style={styles.googleProceedBtn}
                      onPress={() => handleExecuteGoogleSignIn(customGoogleEmail, customGoogleName)}
                    >
                      <Text style={styles.googleProceedBtnText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Dismiss Google sign in sheet"
                style={styles.googleDismissBtn}
                onPress={() => setGoogleModalVisible(false)}
              >
                <Text style={styles.googleDismissText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingBottom: 36
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#EBF4FE',
    paddingHorizontal: 22,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden'
  },
  stethoscopeGlowCircle: {
    position: 'absolute',
    top: 20,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DCEBFE',
    opacity: 0.95
  },
  headerStethoscope: {
    position: 'absolute',
    top: 14,
    right: 2,
    width: 145,
    height: 145
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  logoPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.5
  },
  greetingPill: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10
  },
  greetingPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8'
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.5,
    lineHeight: 35,
    maxWidth: '72%'
  },

  // Form Canvas Wrapper & Card
  formCanvasWrapper: {
    paddingHorizontal: 16,
    marginTop: -8
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4
  },

  // Evaluator Quick-Sign In
  demoSection: {
    marginBottom: 14
  },
  demoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  freshBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  freshBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  demoEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8
  },
  demoCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  demoCardSingle: {
    width: '100%'
  },
  demoCardActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2
  },
  demoCardInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  demoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  demoIconWrapActive: {
    backgroundColor: '#DBEAFE'
  },
  demoCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B'
  },
  demoCardTitleActive: {
    color: '#0A2540',
    fontWeight: '900'
  },
  demoCardSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B'
  },
  demoCardSubActive: {
    color: '#2563EB'
  },

  // Social
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540'
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B'
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626'
  },

  loginProgressCardWrap: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    marginBottom: 10
  },
  submitBtn: {
    marginTop: 6,
    marginBottom: 12
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: 8
  },
  toggleText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600'
  },
  toggleTextBold: {
    color: '#2563EB',
    fontWeight: '800'
  },

  // Google Sign-In Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.65)',
    justifyContent: 'flex-end'
  },
  googleSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  googleSheetHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  googleLogoWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  googleSheetTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.3
  },
  googleSheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center'
  },
  googleAccountsList: {
    gap: 12
  },
  googleAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  googleAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  googleAvatarLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB'
  },
  googleAccountName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540'
  },
  googleAccountEmail: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1
  },
  customGoogleForm: {
    gap: 8
  },
  customGooglePrompt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 4
  },
  googleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0A2540'
  },
  customGoogleActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  googleCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B'
  },
  googleProceedBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleProceedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  googleDismissBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8
  },
  googleDismissText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B'
  },
  googleErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12
  },
  googleErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '700'
  }
});
