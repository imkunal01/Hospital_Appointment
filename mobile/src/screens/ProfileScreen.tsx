import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSession } from '../auth/sessionStore';
import { getRefreshToken } from '../auth/secureStorage';
import { logoutApi } from '../api/endpoints';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { showAlert } from '../utils/alert';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeInsets();
  const { user, clearSession } = useSession();
  const { data: preferences } = usePreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    if (preferences) {
      setPushEnabled(preferences.enabled);
    }
  }, [preferences]);

  const togglePush = (val: boolean) => {
    setPushEnabled(val);
    updatePreferencesMutation.mutate({
      enabled: val,
      hoursBefore: preferences?.hoursBefore || 24
    });
  };

  const toggleEmail = (val: boolean) => {
    setEmailEnabled(val);
  };

  const handleLogout = async () => {
    showAlert('Sign Out', 'Are you sure you want to sign out of the hospital portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getRefreshToken();
            if (token) {
              await logoutApi(token);
            }
          } catch {
            // Even if network fails, always clear local session
          } finally {
            await clearSession();
          }
        }
      }
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'AM';

  const patientIdDisplay = user?.id ? user.id.slice(0, 6) : '104892';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Editorial Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 6 }]}>
        <View style={styles.plusWrapper}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Quick book appointment"
            style={styles.plusButton}
            onPress={() => navigation.navigate('BookTab')}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color={colors.brandBlue} />
          </TouchableOpacity>
        </View>

        <Text style={styles.topBarTitle}>Profile</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Preferences"
          style={styles.gearButton}
          onPress={() => navigation.navigate('Preferences')}
          activeOpacity={0.8}
        >
          <Feather name="settings" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Hero Card (Chartreuse Lime) */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.heroInfoCol}>
            <Text style={styles.userName}>{user?.name || 'Alex Morgan'}</Text>
            <Text style={styles.patientIdText}>Patient ID · {patientIdDisplay}</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.editButton}
            onPress={() => navigation.navigate('Preferences')}
            activeOpacity={0.8}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Reminders */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>REMINDERS</Text>

          <View style={styles.editorialCard}>
            {/* Push Notifications Row */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconCircle}>
                <Feather name="bell" size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Push notifications</Text>
                <Text style={styles.settingSubtitle}>Appointment updates and reminders</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: '#E2E8F0', true: colors.brandBlue }}
                thumbColor={pushEnabled ? colors.foundation : '#FFFFFF'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <View style={styles.divider} />

            {/* Email Reminders Row */}
            <View style={styles.settingRow}>
              <View style={styles.settingIconCircle}>
                <Feather name="file-text" size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Email reminders</Text>
                <Text style={styles.settingSubtitle}>Sent 24 hours before your visit</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={toggleEmail}
                trackColor={{ false: '#E2E8F0', true: colors.brandBlue }}
                thumbColor={emailEnabled ? colors.foundation : '#FFFFFF'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>
          </View>
        </View>

        {/* Section: Account */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>

          <View style={styles.editorialCard}>
            {/* Personal Information Row */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Personal information"
              style={styles.navRow}
              onPress={() =>
                Alert.alert(
                  'Patient Profile',
                  `Name: ${user?.name || 'Alex Morgan'}\nEmail: ${user?.email || 'patient1@example.test'}\nPhone: ${user?.phone || 'Verified Keystore'}\nRole: ${user?.role || 'PATIENT'}`
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconCircle}>
                <Feather name="user" size={18} color={colors.ink} />
              </View>
              <Text style={styles.navTitle}>Personal information</Text>
              <Feather name="chevron-right" size={20} color={colors.ink} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Hospital & Contact Row */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Hospital & contact"
              style={styles.navRow}
              onPress={() =>
                Alert.alert(
                  'Hospital & Clinical Desk',
                  'MediBook Multi-Specialty Hospital\nNorth Wing Reception · Floor 2\nHelpline: +1 (800) 555-CARE\nEmergency: 24/7 On-Call'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconCircle}>
                <MaterialCommunityIcons name="hospital-building" size={20} color={colors.ink} />
              </View>
              <Text style={styles.navTitle}>Hospital & contact</Text>
              <Feather name="chevron-right" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Pill Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out of hospital portal"
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* App Version Footer */}
        <Text style={styles.footerText}>Medibook version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14
  },
  plusWrapper: {
    shadowColor: colors.chartreuse,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.foundation,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4
  },
  gearButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130 // Clearance for floating navigation dock
  },

  // Profile Hero Card: Clean Medical Sapphire Wash
  profileHeroCard: {
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.foundation,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  heroInfoCol: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foundation,
    letterSpacing: -0.3
  },
  patientIdText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brandBlue,
    marginTop: 2
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1
  },
  editText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlue
  },

  // Section Blocks
  sectionBlock: {
    marginBottom: 18
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 8
  },
  editorialCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  settingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 10
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink
  },
  settingSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },
  navTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink
  },

  // Sign out button
  signOutButton: {
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 6,
    marginBottom: 16
  },
  signOutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.coralDark
  },

  footerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSubtle,
    textAlign: 'center',
    marginBottom: 20
  }
});
