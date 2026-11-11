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
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { sendPhoneOtpApi, verifyPhoneOtpApi } from '../api/endpoints';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

export const PhoneVerificationScreen: React.FC = () => {
  const insets = useSafeInsets();
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

    setLoading(true);
    setOtpError('');
    setGeneralError('');

    try {
      await verifyPhoneOtpApi(phone.trim(), otp.trim());
      navigation.navigate('ProfileSetup');
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const quickFillPhone = (val: string) => {
    setPhone(val);
    setPhoneError('');
    setGeneralError('');
    handleSendOtp(val);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Section */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 16 }
          ]}
        >
          <View style={styles.decorRing} />
          <View style={styles.decorCoralArch} />

          <View style={styles.brandRow}>
            <View style={styles.logoPlusCircle}>
              <Feather name="plus" size={18} color={colors.foundation} />
            </View>
            <Text style={styles.brandTitle}>medibook</Text>
          </View>

          <View style={styles.greetingPill}>
            <Text style={styles.greetingPillText}>Patient Onboarding</Text>
          </View>

          <Text style={styles.heroTitle}>
            {step === 'PHONE' ? 'Verify your\nmobile number' : 'Enter 6-digit\nsecurity code'}
          </Text>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperLabelRow}>
            <Text style={styles.stepText}>STEP 1 OF 2</Text>
            <Text style={styles.stepName}>Phone Verification</Text>
          </View>
          <View style={styles.stepperTrack}>
            <View style={[styles.stepperFill, { width: step === 'PHONE' ? '30%' : '50%' }]} />
          </View>
        </View>

        {/* Form Body Canvas */}
        <View style={styles.bodyContent}>
          {generalError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {step === 'PHONE' ? (
            <>
              {/* Evaluator Quick-Fill Helper */}
              <View style={styles.evaluatorBox}>
                <Text style={styles.evaluatorEyebrow}>EVALUATOR QUICK-TEST NUMBER</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Use evaluator mobile test number"
                  style={styles.quickFillPill}
                  onPress={() => quickFillPhone('+919876543299')}
                  activeOpacity={0.8}
                >
                  <Feather name="phone-call" size={14} color={colors.ink} style={{ marginRight: 8 }} />
                  <Text style={styles.quickFillText}>+91 98765 43299 (Auto-Send OTP)</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Mobile Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                error={phoneError}
              />

              <Button
                title={loading ? 'Sending Code...' : 'Send Verification Code'}
                onPress={() => handleSendOtp()}
                loading={loading}
                style={{ marginTop: 10 }}
              />
            </>
          ) : (
            <>
              <View style={styles.evaluatorBox}>
                <Text style={styles.evaluatorEyebrow}>DEVELOPMENT TEST OTP CODE</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Auto-fill OTP code"
                  style={styles.quickFillPill}
                  onPress={() => setOtp('123456')}
                  activeOpacity={0.8}
                >
                  <Feather name="shield" size={14} color={colors.ink} style={{ marginRight: 8 }} />
                  <Text style={styles.quickFillText}>Click to fill standard code: 123456</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Enter 6-digit code"
                placeholder="123456"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (otpError) setOtpError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={otpError}
              />

              <Button
                title={loading ? 'Verifying Code...' : 'Confirm & Continue'}
                onPress={handleVerifyOtp}
                loading={loading}
                style={{ marginTop: 10 }}
              />

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit phone number"
                style={styles.editPhoneRow}
                onPress={() => setStep('PHONE')}
              >
                <Text style={styles.editPhoneText}>
                  Change phone number ({phone})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  scrollContent: {
    paddingBottom: 40
  },
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

  stepperContainer: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10
  },
  stepperLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  stepText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1
  },
  stepName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink
  },
  stepperTrack: {
    height: 7,
    backgroundColor: '#E4DFD5',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden'
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.chartreuse,
    borderRadius: 3
  },

  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 10
  },
  evaluatorBox: {
    backgroundColor: colors.lilacLight,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  evaluatorEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 8
  },
  quickFillPill: {
    backgroundColor: colors.chartreuse,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickFillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink
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

  editPhoneRow: {
    alignItems: 'center',
    paddingVertical: 14
  },
  editPhoneText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline'
  }
});
