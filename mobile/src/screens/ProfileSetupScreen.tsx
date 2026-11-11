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
import { updateProfileApi } from '../api/endpoints';
import { useSession, updateSessionUser } from '../auth/sessionStore';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

const SAMPLE_LOCALITIES = [
  'Bengaluru Central',
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Jayanagar'
];

export const ProfileSetupScreen: React.FC = () => {
  const insets = useSafeInsets();
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
    }

    if (!dob.trim()) {
      setDobError('Date of birth is required');
      isValid = false;
    } else if (calculatedAge === null) {
      setDobError('Please enter a valid date in YYYY-MM-DD format');
      isValid = false;
    }

    if (!location.trim()) {
      setLocationError('City / Locality is required');
      isValid = false;
    }

    return isValid;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const result = await updateProfileApi(name.trim(), dob.trim(), location.trim());
      if (result?.user) {
        updateSessionUser(result.user);
      }
    } catch (err: any) {
      setGeneralError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
          <View style={styles.brandRow}>
            <View style={styles.logoPlusCircle}>
              <Feather name="plus" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>medibook</Text>
          </View>

          <View style={styles.greetingPill}>
            <Text style={styles.greetingPillText}>Patient Onboarding</Text>
          </View>

          <Text style={styles.heroTitle}>Complete your{'\n'}patient profile</Text>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperLabelRow}>
            <Text style={styles.stepText}>STEP 2 OF 2</Text>
            <Text style={styles.stepName}>Profile Information</Text>
          </View>
          <View style={styles.stepperTrack}>
            <View style={[styles.stepperFill, { width: '100%' }]} />
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

          <Input
            label="Legal Full Name"
            placeholder="e.g. Alex Morgan"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            autoCapitalize="words"
            error={nameError}
          />

          <View>
            <Input
              label="Date of Birth (YYYY-MM-DD)"
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
            {calculatedAge !== null && (
              <View style={styles.ageBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.foundation} style={{ marginRight: 6 }} />
                <Text style={styles.ageBadgeText}>
                  Calculated Age: {calculatedAge} years old ({calculatedAge >= 18 ? 'Adult' : 'Pediatric'})
                </Text>
              </View>
            )}
          </View>

          <Input
            label="Hospital Area / Locality"
            placeholder="e.g. Central Wing or Bengaluru South"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              if (locationError) setLocationError('');
            }}
            error={locationError}
          />

          {/* Interactive Locality Chips */}
          <Text style={styles.chipsLabel}>QUICK SELECT PREFERRED AREA</Text>
          <View style={styles.chipsRow}>
            {SAMPLE_LOCALITIES.map((loc) => {
              const isSelected = location === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  accessibilityRole="button"
                  accessibilityLabel={`Select locality ${loc}`}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => {
                    setLocation(loc);
                    if (locationError) setLocationError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={loading ? 'Saving Profile...' : 'Save & Enter MediBook'}
            accessibilityLabel="Save & Enter MediBook"
            onPress={handleComplete}
            loading={loading}
            style={{ marginTop: 20 }}
          />
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  logoPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandBlue,
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
    backgroundColor: '#1E3A8A',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3B82F6'
  },
  greetingPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DBEAFE'
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34
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
    color: colors.brandBlue
  },
  stepperTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.brandBlue,
    borderRadius: 3
  },

  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 10
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.coralDark
  },

  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 14
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlueDark
  },

  chipsLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 8
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  chipActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  }
});
