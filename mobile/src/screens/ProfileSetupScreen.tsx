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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { updateProfileApi } from '../api/endpoints';
import { useSession, updateSessionUser } from '../auth/sessionStore';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const ProfileSetupScreen: React.FC = () => {
  const { user } = useSession();

  const [name, setName] = useState(user?.name && !user.name.includes('@') ? user.name : '');
  const [dob, setDob] = useState('');
  const [location, setLocation] = useState('');

  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic live age calculator
  const calculateAge = (dobString: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobString)) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 125 ? age : null;
  };

  const calculatedAge = calculateAge(dob);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError('');
    setDobError('');
    setLocationError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    if (!dob.trim()) {
      setDobError('Date of birth is required');
      isValid = false;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
      setDobError('Please use format YYYY-MM-DD (e.g. 1998-05-14)');
      isValid = false;
    } else {
      const birthDate = new Date(dob.trim());
      if (isNaN(birthDate.getTime()) || birthDate >= new Date()) {
        setDobError('Date of birth must be a valid past date');
        isValid = false;
      }
    }

    if (!location.trim()) {
      setLocationError('Location / City is required for matching');
      isValid = false;
    } else if (location.trim().length < 2) {
      setLocationError('Location must be at least 2 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const response = await updateProfileApi(name.trim(), dob.trim(), location.trim());
      // Update session store with completed onboarding profile
      updateSessionUser(response.user);
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
        {/* Top Hero Gradient with Profile Graphic */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Background depth circles */}
            <View style={styles.decorCircleTopRightOuter} />
            <View style={styles.decorCircleTopRightMid} />
            <View style={styles.decorCircleBottomLeftOuter} />

            {/* Top Brand & Step Row */}
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCard}>
                <Ionicons name="fitness" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
              </View>
            </View>

            {/* Central 3D Floating Graphic */}
            <View style={styles.centerGraphicContainer}>
              <View style={styles.cardShadowOffset} />
              <View style={styles.floatingCard}>
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={42}
                  color={colors.primaryDark}
                />
                <View style={styles.notificationBadge}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.bodyContent}>
          <Text style={styles.eyebrow}>PATIENT PERSONALIZATION</Text>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            Tell us a bit about yourself. Your birth date and location allow us to tailor clinical appointments and match nearby specialists.
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

          <View style={styles.formContainer}>
            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Alex Sharma"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              autoCapitalize="words"
              error={nameError}
            />

            {/* Date of Birth & Live Age Calculation */}
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD (e.g. 1998-05-14)"
              value={dob}
              onChangeText={(text) => {
                setDob(text);
                if (dobError) setDobError('');
              }}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              error={dobError}
            />

            {/* Live Age Feedback Banner */}
            {calculatedAge !== null ? (
              <View style={styles.ageBadgeContainer}>
                <MaterialCommunityIcons
                  name="cake-variant-outline"
                  size={18}
                  color={colors.primaryDark}
                />
                <Text style={styles.ageBadgeText}>
                  Calculated Age:{' '}
                  <Text style={styles.ageHighlight}>
                    {calculatedAge} years old {calculatedAge < 18 ? '(Pediatric)' : '(Adult)'}
                  </Text>
                </Text>
              </View>
            ) : null}

            {/* Location (Proximity Matching Feature) */}
            <Input
              label="Your Location (City / Locality)"
              placeholder="e.g. Mumbai Central, Bandra, Bengaluru"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (locationError) setLocationError('');
              }}
              error={locationError}
            />

            {/* Location Matching Explanation Card */}
            <View style={styles.locationInfoCard}>
              <View style={styles.locationIconBox}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.locationInfoTextWrap}>
                <Text style={styles.locationInfoTitle}>Location-Based Matching</Text>
                <Text style={styles.locationInfoBody}>
                  We use your location to automatically rank and recommend nearest hospital wings and specialist doctors.
                </Text>
              </View>
            </View>

            {/* Quick Location Chips */}
            <View style={styles.chipsRow}>
              {['Mumbai Central', 'Bengaluru South', 'Delhi NCR', 'Hyderabad'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  accessibilityRole="button"
                  accessibilityLabel={`Select location ${loc}`}
                  style={[
                    styles.locChip,
                    location === loc && styles.locChipActive
                  ]}
                  onPress={() => {
                    setLocation(loc);
                    if (locationError) setLocationError('');
                  }}
                >
                  <View style={styles.chipContentRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={location === loc ? colors.primaryDark : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.locChipText,
                        location === loc && styles.locChipTextActive
                      ]}
                    >
                      {loc}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Primary Action Button */}
            <Button
              title="Save & Enter MediBook"
              onPress={handleCompleteProfile}
              loading={loading}
              style={styles.primaryButton}
            />
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
    paddingBottom: 36
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
    fontWeight: '600'
  },
  formContainer: {
    marginTop: 4
  },
  ageBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#99F6E4'
  },
  ageBadgeText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.primaryDark
  },
  ageHighlight: {
    fontWeight: '800',
    color: colors.primaryDark
  },
  locationInfoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  locationInfoTextWrap: {
    flex: 1
  },
  locationInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  locationInfoBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  locChip: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center'
  },
  chipContentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locChipActive: {
    backgroundColor: '#CCFBF1',
    borderColor: colors.primary
  },
  locChipText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  locChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700'
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary
  }
});

