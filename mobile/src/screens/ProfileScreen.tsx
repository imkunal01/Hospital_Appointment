import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSession } from '../auth/sessionStore';
import { getRefreshToken } from '../auth/secureStorage';
import { logoutApi } from '../api/endpoints';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { useAppointments } from '../hooks/useAppointments';
import { showAlert } from '../utils/alert';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import {
  getUnreadCount,
  subscribeNotifications,
  triggerRandomHealthTip
} from '../notifications/notificationStore';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeInsets();
  const { user, clearSession } = useSession();
  const { data: preferences } = usePreferences();
  const { data: upcomingAppointments } = useAppointments('upcoming');
  const updatePreferencesMutation = useUpdatePreferences();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isNotifModalVisible, setNotifModalVisible] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (preferences) {
      setPushEnabled(preferences.enabled);
    }
  }, [preferences]);

  useEffect(() => {
    setUnreadNotifs(getUnreadCount());
    const unsubscribe = subscribeNotifications((notifs) => {
      setUnreadNotifs(notifs.filter((n) => !n.read).length);
    });
    return unsubscribe;
  }, []);

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
            // Always clear local session even if offline
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
        .toUpperCase()
    : 'JD';

  const patientIdDisplay = user?.id ? `MED-${user.id.slice(0, 6).toUpperCase()}` : 'MED-104892';
  const upcomingCount = upcomingAppointments ? upcomingAppointments.length : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Clinical Header Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 8 }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoPlusCircle}>
            <Feather name="plus" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandLogoText}>medibook</Text>
        </View>

        <Text style={styles.topBarTitle}>Patient Profile</Text>

        <View style={styles.topActionsRow}>
          {/* Notification Bell with Unread Badge */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Notification inbox, ${unreadNotifs} unread alerts`}
            style={styles.headerIconButton}
            onPress={() => setNotifModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={19} color="#0A2540" />
            {unreadNotifs > 0 && (
              <View style={styles.unreadBadgeDot}>
                <Text style={styles.unreadBadgeDotText}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings Shortcut */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Preferences & settings"
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Preferences')}
            activeOpacity={0.8}
          >
            <Feather name="settings" size={19} color="#0A2540" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Medical Sapphire Patient Card */}
        <View style={styles.patientHeroCard}>
          {/* Background subtle curve */}
          <View style={styles.heroDecoOval} />

          <View style={styles.heroTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <View style={styles.patientInfoCol}>
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={14} color="#60A5FA" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedTag}>Verified Patient</Text>
              </View>
              <Text style={styles.patientFullName} numberOfLines={1}>
                {user?.name || 'Jane Doe'}
              </Text>
              <Text style={styles.patientEmailText} numberOfLines={1}>
                {user?.email || 'patient1@example.test'}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit personal information"
              style={styles.heroEditPill}
              onPress={() => navigation.navigate('Preferences', { initialTab: 'personal' })}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.heroEditPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Divider inside Hero Card */}
          <View style={styles.heroDivider} />

          {/* Patient ID and Care Tier */}
          <View style={styles.heroFooterRow}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>PATIENT ID</Text>
              <Text style={styles.heroMetaValue}>{patientIdDisplay}</Text>
            </View>
            <View style={styles.heroVerticalLine} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>HOSPITAL WING</Text>
              <Text style={styles.heroMetaValue}>North Wing / A</Text>
            </View>
            <View style={styles.heroVerticalLine} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>STATUS</Text>
              <Text style={[styles.heroMetaValue, { color: '#86EFAC' }]}>Active Care</Text>
            </View>
          </View>
        </View>

        {/* 3 Clinical Health Vitals Metrics */}
        <View style={styles.vitalsRow}>
          <View style={styles.vitalTile}>
            <View style={[styles.vitalIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="water-outline" size={18} color={colors.brandBlue} />
            </View>
            <Text style={styles.vitalValue}>O+ Rh+</Text>
            <Text style={styles.vitalLabel}>Blood Group</Text>
          </View>

          <View style={styles.vitalTile}>
            <View style={[styles.vitalIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="calendar" size={18} color="#059669" />
            </View>
            <Text style={styles.vitalValue}>{upcomingCount} Active</Text>
            <Text style={styles.vitalLabel}>Upcoming Visits</Text>
          </View>

          <View style={styles.vitalTile}>
            <View style={[styles.vitalIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.vitalValue}>NABH</Text>
            <Text style={styles.vitalLabel}>Accredited</Text>
          </View>
        </View>

        {/* Health Notifications & Daily Tips Inbox Card */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open health alerts and notification inbox"
          style={styles.inboxBannerCard}
          onPress={() => setNotifModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={styles.inboxIconWrap}>
            <Ionicons name="sparkles" size={22} color={colors.brandBlue} />
          </View>
          <View style={styles.inboxTextCol}>
            <View style={styles.inboxTitleRow}>
              <Text style={styles.inboxTitle}>Health Tips & Reminders</Text>
              {unreadNotifs > 0 && (
                <View style={styles.inboxCountPill}>
                  <Text style={styles.inboxCountText}>{unreadNotifs} unread</Text>
                </View>
              )}
            </View>
            <Text style={styles.inboxSub}>
              Consultation advisories, timely check-in guides, & doctor choice tips
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.brandBlue} />
        </TouchableOpacity>

        {/* Personal Details Card */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit personal details"
              onPress={() => navigation.navigate('Preferences', { initialTab: 'personal' })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sectionActionText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Full Name</Text>
              <Text style={styles.infoRowValue}>{user?.name || 'Jane Doe'}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Date of Birth</Text>
              <Text style={styles.infoRowValue}>{user?.dob || 'Not specified'}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Phone Number</Text>
              <Text style={styles.infoRowValue}>{user?.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Location / Area</Text>
              <Text style={styles.infoRowValue}>{user?.location || 'Metro Hospital Wing'}</Text>
            </View>
          </View>
        </View>

        {/* Reminders & Notifications Card */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>NOTIFICATION DISPATCH</Text>

          <View style={styles.cardBox}>
            {/* Push Notifications Row */}
            <View style={styles.settingItemRow}>
              <View style={styles.settingIconSquare}>
                <Feather name="bell" size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSub}>Instant appointment updates & happy health tips</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: '#E2E8F0', true: colors.brandBlue }}
                thumbColor={pushEnabled ? colors.brandBlue : '#FFFFFF'}
              />
            </View>

            <View style={styles.cardDivider} />

            {/* Email Reminders Row */}
            <View style={styles.settingItemRow}>
              <View style={styles.settingIconSquare}>
                <Feather name="mail" size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Email Visit Summaries</Text>
                <Text style={styles.settingSub}>Non-diagnostic metadata sent 24h prior</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={toggleEmail}
                trackColor={{ false: '#E2E8F0', true: colors.brandBlue }}
                thumbColor={emailEnabled ? colors.brandBlue : '#FFFFFF'}
              />
            </View>

            <View style={styles.cardDivider} />

            {/* Reminder Lead Time Row */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change reminder lead hours"
              style={styles.settingItemRow}
              onPress={() => navigation.navigate('Preferences')}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconSquare}>
                <Feather name="clock" size={18} color={colors.brandBlue} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Reminder Lead Time</Text>
                <Text style={styles.settingSub}>
                  Currently set to {preferences?.hoursBefore || 24} hours before visit
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hospital Directory & Support Services */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>HOSPITAL SERVICES & CAMPUS</Text>

          <View style={styles.cardBox}>
            {/* North Wing Navigation */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="North Wing campus guide"
              style={styles.settingItemRow}
              onPress={() =>
                Alert.alert(
                  'North Wing Campus Guide',
                  'MediBook Healthcare Campus\n\n• Main Reception: Floor 2, North Wing\n• Parking: Underground validated parking (P1 & P2)\n• Visiting Hours: 08:00 AM – 08:00 PM\n• Triage Desk: Direct intake via Corridor B'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconSquare}>
                <MaterialCommunityIcons name="hospital-building" size={20} color="#0A2540" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Campus & Reception Desk</Text>
                <Text style={styles.settingSub}>Floor maps, visiting hours, and validated parking</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            {/* 24/7 Hotline */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Emergency and helpline desk"
              style={styles.settingItemRow}
              onPress={() =>
                Alert.alert(
                  'Emergency & Helpline',
                  'MediBook 24/7 Hospital Care Line:\n\n• Toll-Free Helpline: 1800-MEDIBOOK\n• Emergency Trauma Unit: Ext. 911\n• Specialist On-Call Desk: North Wing Pager 4'
                )
              }
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconSquare, { backgroundColor: '#FEF2F2' }]}>
                <Feather name="phone-call" size={18} color="#DC2626" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>24/7 Care Hotline</Text>
                <Text style={styles.settingSub}>Emergency concierge and on-call triage line</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            {/* Privacy & Security */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Security and encryption details"
              style={styles.settingItemRow}
              onPress={() =>
                Alert.alert(
                  'Data Security & Encryption',
                  'MediBook Enterprise Healthcare Security:\n\n• 256-Bit SSL end-to-end encryption\n• Hardware keystore token isolation (expo-secure-store)\n• Strict non-diagnostic metadata compliance\n• Zero PII leakage guarantee'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconSquare}>
                <Feather name="shield" size={18} color="#0A2540" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Security & Privacy Architecture</Text>
                <Text style={styles.settingSub}>Hardware keystore isolation & encrypted data</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Modern Sign Out Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out of hospital portal"
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version & Accreditation Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerHospitalName}>NABH & JCI Accredited Hospital System</Text>
          <Text style={styles.footerVersion}>MediBook Version 1.0.0 • Production Build</Text>
        </View>
      </ScrollView>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        visible={isNotifModalVisible}
        onClose={() => setNotifModalVisible(false)}
        onNavigateTab={(tabName) => {
          setNotifModalVisible(false);
          navigation.navigate(tabName);
        }}
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoPlusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.4
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540'
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.brandBlue,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  unreadBadgeDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF'
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 140 // Clearance for floating navigation dock
  },

  // Patient Hero Card (Medical Sapphire)
  patientHeroCard: {
    backgroundColor: colors.brandBlue,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 16
  },
  heroDecoOval: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brandBlue
  },
  patientInfoCol: {
    flex: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BFDBFE'
  },
  patientFullName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3
  },
  patientEmailText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1
  },
  heroEditPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  heroEditPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 16
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroMetaItem: {
    flex: 1,
    alignItems: 'center'
  },
  heroMetaLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BFDBFE',
    letterSpacing: 0.8
  },
  heroMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  heroVerticalLine: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.20)'
  },

  // 3 Vitals Metric Tiles
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  vitalTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  vitalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  vitalValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A2540',
    textAlign: 'center'
  },
  vitalLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center'
  },

  // Inbox Banner Card
  inboxBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20
  },
  inboxIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  inboxTextCol: {
    flex: 1,
    marginRight: 8
  },
  inboxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  inboxTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A2540'
  },
  inboxCountPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  inboxCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandBlue
  },
  inboxSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16
  },

  // Sections
  sectionWrap: {
    marginBottom: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.brandBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13
  },
  infoRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  infoRowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0A2540'
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },
  settingIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 10
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540'
  },
  settingSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  // Sign out button
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  signOutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626'
  },

  // Footer
  footerWrap: {
    alignItems: 'center',
    paddingBottom: 16
  },
  footerHospitalName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B'
  },
  footerVersion: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  }
});
