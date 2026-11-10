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
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { sendPhoneOtpApi, verifyPhoneOtpApi } from '../api/endpoints';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

export const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (overridePhone?: string) => {
    const targetPhone = (overridePhone || phone).trim();
    if (!targetPhone) {
      setPhoneError('Mobile phone number is required');
      return;
    }

    // Basic length check (10 to 15 digits)
    const digitsOnly = targetPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setPhoneError('');
    setGeneralError('');

    try {
      await sendPhoneOtpApi(targetPhone);
      setStep('OTP');
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Verification code is required');
      return;
    }
    if (otp.trim().length < 4) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setOtpError('');
    setGeneralError('');

    try {
      await verifyPhoneOtpApi(phone.trim(), otp.trim());
      // Navigate to Step 2: Profile Setup
      navigation.navigate('ProfileSetup');
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const autoFillDemoNumber = (demoPhone: string) => {
    setPhone(demoPhone);
    setPhoneError('');
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
        {/* Top Hero Gradient with Security / Phone Graphic */}
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

            {/* Top Brand & Step Row */}
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCard}>
                <Ionicons name="fitness" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1 OF 2</Text>
              </View>
            </View>

            {/* Central 3D Floating Graphic */}
            <View style={styles.centerGraphicContainer}>
              <View style={styles.cardShadowOffset} />
              <View style={styles.floatingCard}>
                <MaterialCommunityIcons
                  name="cellphone-check"
                  size={42}
                  color={colors.primaryDark}
                />
                <View style={styles.notificationBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.bodyContent}>
          <Text style={styles.eyebrow}>AUTHENTICATION & VERIFICATION</Text>
          <Text style={styles.title}>
            {step === 'PHONE' ? 'Verify your phone' : 'Enter 6-digit code'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE'
              ? 'Each mobile number is securely tied to one verified patient account to ensure genuine clinical visits.'
              : `We sent a mock verification code to ${phone}. Enter the code below to confirm your phone.`}
          </Text>

          {generalError ? (
            <View
              accessibilityRole="alert"
              style={styles.errorAlert}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.errorText}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorAlertText}>{generalError}</Text>
            </View>
          ) : null}

          {step === 'PHONE' ? (
            <View style={styles.formContainer}>
              <Input
                label="Mobile Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                  if (generalError) setGeneralError('');
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                error={phoneError}
              />

              <Button
                title="Send Verification Code"
                onPress={() => handleSendOtp()}
                loading={loading}
                style={styles.primaryButton}
              />

              {/* Quick Testing Chips for Reviewer */}
              <View style={styles.testChipsContainer}>
                <Text style={styles.testChipsTitle}>Quick Tester Helpers:</Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Test with fresh new number"
                  style={styles.chipButton}
                  onPress={() => autoFillDemoNumber('+919123456789')}
                >
                  <Text style={styles.chipText}>
                    Fresh Available Number: <Text style={styles.chipBold}>+91 9123456789</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Test duplicate number conflict"
                  style={[styles.chipButton, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                  onPress={() => autoFillDemoNumber('+919876543210')}
                >
                  <Text style={[styles.chipText, { color: '#B91C1C' }]}>
                    Existing Verified Number (triggers duplicate alert): <Text style={styles.chipBold}>+91 9876543210</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Input
                label="Verification Code (OTP)"
                placeholder="123456"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (otpError) setOtpError('');
                  if (generalError) setGeneralError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={otpError}
                style={styles.otpInput}
              />

              {/* Quick Helper to autofill mock OTP */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Auto-fill mock OTP"
                style={styles.mockOtpBanner}
                onPress={() => setOtp('123456')}
              >
                <Feather name="zap" size={16} color={colors.primary} />
                <Text style={styles.mockOtpText}>
                  Mock OTP: <Text style={{ fontWeight: '800' }}>123456</Text> (Tap to auto-fill)
                </Text>
              </TouchableOpacity>

              <Button
                title="Verify & Continue"
                onPress={handleVerifyOtp}
                loading={loading}
                style={styles.primaryButton}
              />

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Change phone number"
                style={styles.changePhoneButton}
                onPress={() => {
                  setStep('PHONE');
                  setOtp('');
                  setGeneralError('');
                }}
              >
                <View style={styles.changePhoneRow}>
                  <Feather name="arrow-left" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.changePhoneText}>Change phone number</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
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
    backgroundColor: '#CCFBF1',
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
    fontSize: 28,
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
    fontWeight: '600',
    lineHeight: 20
  },
  formContainer: {
    marginTop: 4
  },
  primaryButton: {
    marginTop: 10,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary
  },
  testChipsContainer: {
    marginTop: 24,
    padding: 14,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  testChipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  chipButton: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    justifyContent: 'center'
  },
  chipText: {
    fontSize: 13,
    color: colors.textPrimary
  },
  chipBold: {
    fontWeight: '700'
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center'
  },
  mockOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14
  },
  mockOtpText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.primaryDark
  },
  changePhoneButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  changePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  changePhoneText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600'
  }
});

