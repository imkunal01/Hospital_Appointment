import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDepartments } from '../hooks/useCatalog';
import { useAppointments } from '../hooks/useAppointments';
import { useSession } from '../auth/sessionStore';
import { ScreenState } from '../components/ScreenState';
import { Department } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { getDepartmentTheme } from '../theme/departmentThemes';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface DepartmentsScreenProps {
  navigation: any;
}

export const DepartmentsScreen: React.FC<DepartmentsScreenProps> = ({ navigation }) => {
  const insets = useSafeInsets();
  const { user } = useSession();
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useDepartments();
  const { data: upcomingAppointments } = useAppointments('upcoming');

  const nextAppointment = upcomingAppointments && upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  // Patient 1 seed name is "Jane Doe" - default to 'Jane' matching design reference
  const firstName = user?.name ? user.name.split(' ')[0] : 'Jane';

  const handleSelectDepartment = (dept?: Department) => {
    navigation.navigate('DoctorsList', {
      departmentId: dept?.id,
      departmentName: dept?.name || 'All Specialists'
    });
  };

  const getCalendarParts = (isoDate?: string) => {
    if (!isoDate) return { day: '18', month: 'JUN' };
    const d = new Date(isoDate);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    return { day: String(day), month };
  };

  const nextDateParts = getCalendarParts(nextAppointment?.startsAt);

  // Preferred visual order to match screenshot: Cardiology, Dermatology, General Medicine first
  const sortedDepartments = React.useMemo(() => {
    if (!departments) return [];
    const priority = ['cardio', 'derma', 'general'];
    return [...departments].sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aIdx = priority.findIndex(p => aLower.includes(p));
      const bIdx = priority.findIndex(p => bLower.includes(p));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [departments]);

  const formatDeptName = (name: string) => {
    if (name.toLowerCase().includes('general')) return 'General';
    if (name.toLowerCase().includes('derma')) return 'Dermatol...';
    return name;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
            colors={[colors.brandBlue]}
          />
        }
      >
        {/* Top Hero Banner: Deep Clinical Navy with Stethoscope Visual & Organic Curves */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 12 }
          ]}
        >
          {/* Organic Curved Wave Layers in Background */}
          <View style={styles.heroWaveOvalTop} />
          <View style={styles.heroWaveArcMid} />
          <View style={styles.heroWaveBottomCurve} />

          {/* Stethoscope Decorative Glow & Medical Watermark (Behind Stethoscope) */}
          <View style={styles.stethoscopeOuterRing} />
          <View style={styles.stethoscopeGlowCircle} />
          <View style={styles.crossWatermarkHoriz} />
          <View style={styles.crossWatermarkVert} />

          {/* Stethoscope Asset - Completely Clear & Unobstructed */}
          <Image
            source={require('../../assets/stethoscope.png')}
            style={styles.headerStethoscope}
            resizeMode="contain"
            accessibilityLabel="Hospital Stethoscope illustration"
          />

          {/* Top Brand Bar: + medibook (NO notification bell) */}
          <View style={styles.topBrandRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoPlusCircle}>
                <Feather name="plus" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>medibook</Text>
            </View>
          </View>

          {/* Clinical Greeting Pill with Sun Icon */}
          <View style={styles.greetingPill}>
            <Ionicons name="sunny" size={15} color="#FBBF24" />
            <Text style={styles.greetingPillText}>Good morning,</Text>
          </View>

          {/* Headline */}
          <Text style={styles.heroHeadline}>
            How can we help{'\n'}today, {firstName}?
          </Text>

          {/* Quick Action CTA Card: Book an appointment */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Book an appointment"
            style={styles.ctaCard}
            onPress={() => handleSelectDepartment()}
            activeOpacity={0.88}
          >
            <View style={styles.ctaIconCircle}>
              <MaterialCommunityIcons name="calendar-month-outline" size={26} color={colors.brandBlue} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Book an appointment</Text>
              <Text style={styles.ctaSubtitle}>Find a doctor and choose a time</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#071F38" />
          </TouchableOpacity>
        </View>

        {/* Clean Hospital Canvas Content */}
        <View style={styles.canvasSection}>
          <ScreenState
            loading={isLoading}
            loadingMessage="Loading hospital specialties..."
            error={isError ? extractErrorMessage(error) : null}
            onRetry={refetch}
            empty={!isLoading && (!departments || departments.length === 0)}
            emptyMessage="No departments currently active."
          >
            {/* 1. Specialists / Choose a department */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.eyebrow}>SPECIALISTS</Text>
                <Text style={styles.sectionTitle}>Choose a department</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="See all departments"
                style={styles.pillButton}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.8}
              >
                <Text style={styles.pillButtonText}>See all</Text>
                <Feather name="arrow-right" size={14} color={colors.brandBlue} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptCardsRow}
            >
              {sortedDepartments.map((dept, index) => {
                const theme = getDepartmentTheme(dept.name);
                const displayName = formatDeptName(dept.name);

                return (
                  <TouchableOpacity
                    key={dept.id || index}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${dept.name}`}
                    style={[
                      styles.deptCard,
                      {
                        backgroundColor: theme.bg,
                        borderColor: theme.borderColor || '#E2E8F0'
                      }
                    ]}
                    onPress={() => handleSelectDepartment(dept)}
                    activeOpacity={0.85}
                  >
                    {/* Bottom subtle wave tint inside card */}
                    <View
                      style={[
                        styles.cardBottomWave,
                        {
                          backgroundColor:
                            dept.name.toLowerCase().includes('cardio')
                              ? 'rgba(244, 63, 94, 0.10)'
                              : dept.name.toLowerCase().includes('derma')
                              ? 'rgba(16, 185, 129, 0.10)'
                              : 'rgba(37, 99, 235, 0.10)'
                        }
                      ]}
                    />

                    <View style={styles.deptIconCircle}>
                      {theme.iconFamily === 'Ionicons' ? (
                        <Ionicons name={theme.iconName as any} size={26} color={theme.textColor} />
                      ) : (
                        <MaterialCommunityIcons name={theme.iconName as any} size={26} color={theme.textColor} />
                      )}
                    </View>
                    <Text style={styles.deptCardName} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* "All clinics" shortcut card */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all clinics"
                style={[styles.deptCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                <View style={styles.deptIconCircle}>
                  <MaterialCommunityIcons name="hospital-building" size={26} color={colors.brandBlue} />
                </View>
                <Text style={styles.deptCardName} numberOfLines={1}>
                  All clinics
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* 2. Up Next / Your appointment */}
            <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
              <View>
                <Text style={styles.eyebrow}>UP NEXT</Text>
                <Text style={styles.sectionTitle}>Your appointment</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all appointments"
                style={styles.pillButton}
                onPress={() => navigation.navigate('AppointmentsTab')}
                activeOpacity={0.8}
              >
                <Text style={styles.pillButtonText}>View all</Text>
                <Feather name="arrow-right" size={14} color={colors.brandBlue} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {nextAppointment ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`View appointment with ${nextAppointment.doctorName}`}
                style={styles.appointmentCard}
                onPress={() =>
                  navigation.navigate('AppointmentsTab', {
                    screen: 'AppointmentDetail',
                    params: { appointmentId: nextAppointment.id }
                  })
                }
                activeOpacity={0.88}
              >
                {/* Royal Blue Left Accent Stripe */}
                <View style={styles.cardLeftStripe} />

                <View style={styles.dateBlock}>
                  <Text style={styles.dateBlockDay}>{nextDateParts.day}</Text>
                  <Text style={styles.dateBlockMonth}>{nextDateParts.month}</Text>
                </View>

                <View style={styles.appointmentInfo}>
                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Confirmed</Text>
                  </View>
                  <Text style={styles.doctorName}>{nextAppointment.doctorName}</Text>
                  <Text style={styles.doctorSpecialty}>
                    {nextAppointment.specialty || nextAppointment.departmentName}
                  </Text>
                </View>

                <Feather name="chevron-right" size={24} color={colors.brandBlue} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Book an appointment now"
                style={styles.appointmentCard}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                {/* Royal Blue Left Accent Stripe */}
                <View style={styles.cardLeftStripe} />

                {/* Left Calendar Rounded Square */}
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.brandBlue} />
                </View>

                <View style={styles.appointmentInfo}>
                  <View style={styles.readyToBookPill}>
                    <Text style={styles.readyToBookText}>Ready to book</Text>
                  </View>
                  <Text style={styles.emptyCardTitle}>No upcoming appointments</Text>
                  <Text style={styles.emptyCardSubtitle}>Tap to consult verified specialists</Text>
                </View>

                <Feather name="chevron-right" size={24} color={colors.brandBlue} />

                {/* Soft circular wash on right edge */}
                <View style={styles.emptyCardWash} />
              </TouchableOpacity>
            )}
          </ScreenState>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FA'
  },
  scrollContent: {
    paddingBottom: 110 // Clearance for floating navigation dock
  },

  // Hero Section: Deep Midnight Navy with Organic Curved Waves
  heroSection: {
    backgroundColor: '#061A30',
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
    overflow: 'hidden'
  },

  // Layered Organic Waves inside Hero
  heroWaveOvalTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0E2C4F',
    opacity: 0.8
  },
  heroWaveArcMid: {
    position: 'absolute',
    top: 60,
    right: -20,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#174A82',
    opacity: 0.45
  },
  heroWaveBottomCurve: {
    position: 'absolute',
    bottom: -18,
    left: -20,
    right: -20,
    height: 55,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 90,
    backgroundColor: '#1E5896',
    opacity: 0.35
  },

  // Stethoscope Glow and Translucent Watermark (Behind Stethoscope)
  stethoscopeOuterRing: {
    position: 'absolute',
    top: 8,
    right: -14,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.20)'
  },
  stethoscopeGlowCircle: {
    position: 'absolute',
    top: 18,
    right: 2,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(23, 74, 130, 0.55)'
  },
  crossWatermarkHoriz: {
    position: 'absolute',
    top: 80,
    right: 26,
    width: 50,
    height: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.16)'
  },
  crossWatermarkVert: {
    position: 'absolute',
    top: 63,
    right: 43,
    width: 16,
    height: 50,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.16)'
  },
  headerStethoscope: {
    position: 'absolute',
    top: 12,
    right: 6,
    width: 175,
    height: 175,
    opacity: 0.98
  },

  // Top Brand Row: + medibook (NO notification bell)
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoPlusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6
  },

  // Clinical Greeting Pill with Sun Icon
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 35, 65, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 18,
    marginBottom: 12
  },
  greetingPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6
  },

  // Hero Headline
  heroHeadline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 22,
    maxWidth: '78%'
  },

  // Quick Action CTA Card ("Book an appointment")
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#071F38',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6
  },
  ctaIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  ctaTextWrap: {
    flex: 1
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#071F38',
    letterSpacing: -0.3
  },
  ctaSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3
  },

  // Canvas Section
  canvasSection: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071F38',
    letterSpacing: -0.5,
    marginTop: 4
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF'
  },
  pillButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandBlue
  },

  // Horizontal Department Cards
  deptCardsRow: {
    paddingRight: 20,
    gap: 14,
    paddingVertical: 4
  },
  deptCard: {
    width: 126,
    height: 152,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#071F38',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  cardBottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22
  },
  deptIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  deptCardName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#071F38',
    letterSpacing: -0.2,
    textAlign: 'center'
  },

  // Appointment Cards with Left Royal Blue Accent Stripe
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#071F38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4
  },
  cardLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.brandBlue,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24
  },
  emptyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 14
  },
  readyToBookPill: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  readyToBookText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandBlue
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071F38',
    letterSpacing: -0.2
  },
  emptyCardSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2
  },
  emptyCardWash: {
    position: 'absolute',
    right: -25,
    bottom: -25,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37, 99, 235, 0.06)'
  },

  // Active Appointment Date Block
  dateBlock: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 14
  },
  dateBlockDay: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071F38',
    lineHeight: 22
  },
  dateBlockMonth: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandBlue,
    letterSpacing: 0.5
  },
  appointmentInfo: {
    flex: 1
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534'
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071F38',
    letterSpacing: -0.2
  },
  doctorSpecialty: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2
  }
});
