import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSession, updateSessionUser } from '../auth/sessionStore';
import { updatePersonalInfoApi } from '../api/endpoints';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { useNetwork } from '../hooks/useNetwork';
import { ScreenState } from '../components/ScreenState';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { DobDatePickerModal } from '../components/DobDatePickerModal';
import { addNotification } from '../notifications/notificationStore';
import { extractErrorMessage } from '../utils/errors';
import { showAlert } from '../utils/alert';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

const HOUR_OPTIONS = [6, 12, 24, 48];

interface PreferencesScreenProps {
  route?: {
    params?: {
      initialTab?: 'personal' | 'reminders';
    };
  };
  navigation?: any;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ route, navigation }) => {
  const insets = useSafeInsets();
  const { user } = useSession();
  const { data: preferences, isLoading: isPrefLoading, isError: isPrefError, error: prefError, refetch } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const { isOffline } = useNetwork();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'personal' | 'reminders'>(
    route?.params?.initialTab || 'personal'
  );

  // Personal Info Form State
  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');

  // Validation Errors
  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Date of Birth Modal State
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Reminder Preferences State
  const [enabled, setEnabled] = useState<boolean>(true);
  const [hoursBefore, setHoursBefore] = useState<number>(24);

  // Sync state if session user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDob(user.dob || '');
      setPhone(user.phone || '');
      setLocation(user.location || '');
    }
  }, [user]);

  // Sync reminder preferences
  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.enabled);
      setHoursBefore(preferences.hoursBefore);
    }
  }, [preferences]);

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

  const validatePersonalInfo = (): boolean => {
    let isValid = true;
    setNameError('');
    setDobError('');
    setPhoneError('');

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Full name must be at least 2 characters');
      isValid = false;
    }

    if (dob.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
        setDobError('Date of Birth must be in YYYY-MM-DD format');
        isValid = false;
      } else {
        const parsed = new Date(dob.trim());
        if (isNaN(parsed.getTime()) || parsed >= new Date()) {
          setDobError('Date of Birth must be a valid past date');
          isValid = false;
        }
      }
    }

    if (phone.trim()) {
      if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
        setPhoneError('Please enter a valid phone number (10 to 15 digits)');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSavePersonalInfo = async () => {
    if (isOffline) {
      showAlert('Offline Mode', 'Cannot update personal details while offline. Please reconnect.');
      return;
    }

    if (!validatePersonalInfo()) return;

    setSavingPersonal(true);
    try {
      const response = await updatePersonalInfoApi({
        name: name.trim(),
        dob: dob.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null
      });

      // Update session state in memory
      updateSessionUser(response.user);

      // Trigger In-App Notification
      addNotification({
        type: 'REMINDER',
        title: 'Profile Updated',
        message: 'Your personal information was updated in the patient registry.',
        priority: 'normal',
        actionLabel: 'View Profile',
        actionTab: 'ProfileTab'
      });

      showAlert('Profile Updated', 'Your personal information has been saved successfully.', [
        { text: 'OK' }
      ]);
    } catch (err) {
      showAlert('Update Failed', extractErrorMessage(err));
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveReminders = () => {
    if (isOffline) {
      showAlert('Offline Mode', 'Cannot save reminder settings while offline. Please reconnect.');
      return;
    }

    updateMutation.mutate(
      { enabled, hoursBefore },
      {
        onSuccess: () => {
          addNotification({
            type: 'REMINDER',
            title: 'Reminders Saved',
            message: `Hospital dispatch alerts configured for ${hoursBefore} hours before visits.`,
            priority: 'normal'
          });
          showAlert('Saved', 'Your reminder preferences have been updated on the server.');
        },
        onError: (err) => {
          showAlert('Error', extractErrorMessage(err));
        }
      }
    );
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'JD';

  const patientIdDisplay = user?.id ? `MED-${user.id.slice(0, 6).toUpperCase()}` : 'MED-104892';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Clinical Navigation Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back to profile"
          style={styles.backButton}
          onPress={() => (navigation ? navigation.goBack() : null)}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#0A2540" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Account & Settings</Text>

        <View style={{ width: 42 }} />
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityLabel="Personal Information Tab"
          accessibilityState={{ selected: activeTab === 'personal' }}
          style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]}
          onPress={() => setActiveTab('personal')}
          activeOpacity={0.8}
        >
          <Feather
            name="user"
            size={16}
            color={activeTab === 'personal' ? colors.brandBlue : colors.inkMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, activeTab === 'personal' && styles.tabButtonTextActive]}>
            Personal Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityLabel="Visit Reminders Tab"
          accessibilityState={{ selected: activeTab === 'reminders' }}
          style={[styles.tabButton, activeTab === 'reminders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('reminders')}
          activeOpacity={0.8}
        >
          <Feather
            name="bell"
            size={16}
            color={activeTab === 'reminders' ? colors.brandBlue : colors.inkMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, activeTab === 'reminders' && styles.tabButtonTextActive]}>
            Visit Reminders
          </Text>
        </TouchableOpacity>
      </View>

      <ScreenState
        loading={isPrefLoading}
        loadingMessage="Loading your account settings..."
        error={isPrefError ? extractErrorMessage(prefError) : null}
        onRetry={refetch}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'personal' ? (
            /* ============================================================== */
            /* TAB 1: PERSONAL INFORMATION EDITING                            */
            /* ============================================================== */
            <View>
              {/* Patient Badge Card */}
              <View style={styles.patientBadgeCard}>
                <View style={styles.patientAvatarCircle}>
                  <Text style={styles.patientAvatarText}>{initials}</Text>
                </View>
                <View style={styles.patientBadgeTextCol}>
                  <View style={styles.verifiedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.brandBlue} style={{ marginRight: 4 }} />
                    <Text style={styles.verifiedText}>Verified Patient Registry</Text>
                  </View>
                  <Text style={styles.badgeNameText}>{user?.name || 'Jane Doe'}</Text>
                  <Text style={styles.badgeIdText}>Patient ID: {patientIdDisplay}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeading}>Patient Demographics</Text>
              <Text style={styles.sectionSubheading}>
                Update your registered contact and outpatient identification details.
              </Text>

              {/* Personal Information Form Card */}
              <View style={styles.formCard}>
                {/* Full Name Input */}
                <Input
                  label="Full Name *"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (nameError) setNameError('');
                  }}
                  error={nameError}
                  autoCapitalize="words"
                  accessibilityLabel="Patient full name"
                />

                {/* Date of Birth Input with Calendar Modal Trigger */}
                <View style={{ marginTop: 14 }}>
                  <Input
                    label="Date of Birth (YYYY-MM-DD)"
                    placeholder="YYYY-MM-DD (e.g. 1994-08-20)"
                    value={dob}
                    onChangeText={(val) => {
                      setDob(val);
                      if (dobError) setDobError('');
                    }}
                    error={dobError}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel="Date of Birth in YYYY-MM-DD format"
                    rightElement={
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Open interactive calendar date of birth selector"
                        style={styles.calendarIconBtn}
                        onPress={() => setDatePickerVisible(true)}
                        activeOpacity={0.7}
                      >
                        <Feather name="calendar" size={19} color={colors.brandBlue} />
                      </TouchableOpacity>
                    }
                  />

                  {/* Calculated Age Preview Badge */}
                  {calculatedAge !== null && (
                    <View style={styles.ageBadge}>
                      <Ionicons name="sparkles" size={13} color={colors.brandBlue} style={{ marginRight: 5 }} />
                      <Text style={styles.ageBadgeText}>
                        Calculated Age: <Text style={{ fontWeight: '800' }}>{calculatedAge} years</Text>
                        {' '}({calculatedAge >= 18 ? 'Adult Care' : 'Pediatric Care'})
                      </Text>
                    </View>
                  )}
                </View>

                {/* Phone Number Input */}
                <View style={{ marginTop: 14 }}>
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (phoneError) setPhoneError('');
                    }}
                    error={phoneError}
                    keyboardType="phone-pad"
                    accessibilityLabel="Contact phone number"
                  />
                </View>

                {/* Location / Wing Input */}
                <View style={{ marginTop: 14 }}>
                  <Input
                    label="Residential City / Area"
                    placeholder="e.g. North Wing, City Center"
                    value={location}
                    onChangeText={setLocation}
                    accessibilityLabel="Residential location or city"
                  />
                </View>

                {/* Registered Email (Read-Only) */}
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.readOnlyLabel}>Registered Account Email</Text>
                  <View style={styles.readOnlyBox}>
                    <Feather name="lock" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                    <Text style={styles.readOnlyEmailText}>{user?.email || 'patient1@example.test'}</Text>
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  </View>
                  <Text style={styles.readOnlyHelp}>Email is locked to your authenticated security identity.</Text>
                </View>
              </View>

              {isOffline && (
                <View style={styles.offlineBox}>
                  <Feather name="wifi-off" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.offlineText}>
                    You are currently offline. Changes cannot be saved until you reconnect.
                  </Text>
                </View>
              )}

              <Button
                title={savingPersonal ? 'Saving Profile...' : 'Save Personal Information'}
                onPress={handleSavePersonalInfo}
                disabled={isOffline || savingPersonal}
                loading={savingPersonal}
                style={styles.saveBtn}
              />
            </View>
          ) : (
            /* ============================================================== */
            /* TAB 2: VISIT REMINDER PREFERENCES                              */
            /* ============================================================== */
            <View>
              <Text style={styles.sectionHeading}>Appointment Reminders</Text>
              <Text style={styles.sectionSubheading}>
                Configure how and when the hospital automated dispatch delivers visit alerts.
              </Text>

              {/* Setting Card */}
              <View style={styles.card}>
                <View style={styles.switchRow}>
                  <View style={styles.iconCircle}>
                    <Feather name="bell" size={20} color={colors.brandBlue} />
                  </View>
                  <View style={styles.switchTextCol}>
                    <Text style={styles.switchLabel}>Enable Visit Reminders</Text>
                    <Text style={styles.switchHelp}>
                      Deliver automatic notifications before outpatient consultation
                    </Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={setEnabled}
                    trackColor={{ false: '#E2E8F0', true: colors.brandBlue }}
                    thumbColor={enabled ? '#FFFFFF' : '#F8FAFC'}
                    ios_backgroundColor="#E2E8F0"
                  />
                </View>

                {enabled && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.leadLabel}>REMIND ME IN ADVANCE</Text>
                    <View style={styles.hoursRow}>
                      {HOUR_OPTIONS.map((h) => {
                        const isSelected = hoursBefore === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            accessibilityRole="button"
                            accessibilityLabel={`${h} hours before appointment`}
                            style={[styles.hourPill, isSelected && styles.hourPillSelected]}
                            onPress={() => setHoursBefore(h)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                              {h >= 24 ? `${h / 24}d before` : `${h}h before`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>

              {isOffline && (
                <View style={styles.offlineBox}>
                  <Feather name="wifi-off" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.offlineText}>
                    You are currently offline. Changes cannot be saved until you reconnect.
                  </Text>
                </View>
              )}

              <Button
                title={updateMutation.isPending ? 'Saving...' : 'Save Reminder Preferences'}
                onPress={handleSaveReminders}
                disabled={isOffline || updateMutation.isPending}
                loading={updateMutation.isPending}
                style={styles.saveBtn}
              />
            </View>
          )}
        </ScrollView>
      </ScreenState>

      {/* Date of Birth Picker Modal */}
      <DobDatePickerModal
        visible={isDatePickerVisible}
        value={dob}
        onSelect={(newDate) => {
          setDob(newDate);
          if (dobError) setDobError('');
        }}
        onClose={() => setDatePickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.3
  },

  // Segmented Tabs
  tabBarContainer: {
    flexDirection: 'row',
    padding: 6,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 14
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted
  },
  tabButtonTextActive: {
    color: colors.brandBlue,
    fontWeight: '800'
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 64
  },

  // Patient Badge
  patientBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  patientAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  patientAvatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  patientBadgeTextCol: {
    flex: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  badgeNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540'
  },
  badgeIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1
  },

  // Headings
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.4
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18
  },
  calendarIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandBlue
  },

  // Read-only email
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540',
    marginBottom: 6
  },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    minHeight: 48
  },
  readOnlyEmailText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  primaryBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  readOnlyHelp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 15
  },

  // Reminders Card
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540'
  },
  switchHelp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 18
  },
  leadLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
    marginBottom: 12
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 8
  },
  hourPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hourPillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.brandBlue
  },
  hourText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  hourTextSelected: {
    color: colors.brandBlue,
    fontWeight: '800'
  },

  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600'
  },
  saveBtn: {
    minHeight: 50,
    borderRadius: 14
  }
});
