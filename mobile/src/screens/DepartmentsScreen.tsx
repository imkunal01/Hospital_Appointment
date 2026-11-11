import React, { useState, useMemo } from 'react';
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

  const firstName = user?.name ? user.name.split(' ')[0] : 'Alex';

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
            colors={[colors.foundation]}
          />
        }
      >
        {/* Top Hero Banner: Deep Clinical Midnight Navy with Stethoscope Visual */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 12 }
          ]}
        >
          {/* Circular soft blue glow behind stethoscope */}
          <View style={styles.stethoscopeGlowCircle} />

          {/* Stethoscope Header Illustration */}
          <Image
            source={require('../../assets/stethoscope.png')}
            style={styles.headerStethoscope}
            resizeMode="contain"
            accessibilityLabel="Hospital Stethoscope illustration"
          />

          {/* Top Brand Bar */}
          <View style={styles.topBrandRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoPlusCircle}>
                <Feather name="plus" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>medibook</Text>
            </View>

            <View style={styles.bellWrapper}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                style={styles.bellButton}
                onPress={() => navigation.navigate('AppointmentsTab')}
                activeOpacity={0.85}
              >
                <Feather name="bell" size={20} color="#FFFFFF" />
                <View style={styles.bellDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Clinical Greeting */}
          <View style={styles.greetingPill}>
            <Text style={styles.greetingPillText}>Good morning,</Text>
          </View>

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
              <Feather name="calendar" size={22} color={colors.brandBlue} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Book an appointment</Text>
              <Text style={styles.ctaSubtitle}>Find a doctor and choose a time</Text>
            </View>
            <Feather name="chevron-right" size={24} color={colors.brandBlue} />
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
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptCardsRow}
            >
              {departments?.map((dept, index) => {
                const theme = getDepartmentTheme(dept.name);
                return (
                  <TouchableOpacity
                    key={dept.id || index}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${dept.name}`}
                    style={[
                      styles.deptCard,
                      {
                        backgroundColor: theme.bg,
                        borderColor: theme.borderColor || colors.border
                      }
                    ]}
                    onPress={() => handleSelectDepartment(dept)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.deptIconCircle}>
                      {theme.iconFamily === 'Ionicons' ? (
                        <Ionicons name={theme.iconName as any} size={24} color={theme.textColor} />
                      ) : (
                        <MaterialCommunityIcons name={theme.iconName as any} size={24} color={theme.textColor} />
                      )}
                    </View>
                    <Text style={[styles.deptCardName, { color: colors.ink }]} numberOfLines={1}>
                      {dept.name.replace(' Medicine', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* "All clinics" shortcut */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all clinics"
                style={[styles.deptCard, { backgroundColor: '#F8FAFC', borderColor: colors.border }]}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                <View style={styles.deptIconCircle}>
                  <MaterialCommunityIcons name="hospital-building" size={24} color={colors.brandBlue} />
                </View>
                <Text style={[styles.deptCardName, { color: colors.ink }]} numberOfLines={1}>
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

                <Feather name="chevron-right" size={22} color={colors.inkMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Book an appointment now"
                style={[styles.appointmentCard, { backgroundColor: '#FFFFFF' }]}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                <View style={styles.dateBlock}>
                  <Feather name="calendar" size={26} color={colors.brandBlue} />
                </View>
                <View style={styles.appointmentInfo}>
                  <View style={[styles.statusPill, { backgroundColor: colors.brandBlueLight, borderColor: colors.brandBlueBorder }]}>
                    <Text style={[styles.statusText, { color: colors.brandBlue }]}>Ready to book</Text>
                  </View>
                  <Text style={styles.doctorName}>No upcoming appointments</Text>
                  <Text style={styles.doctorSpecialty}>Tap to consult verified specialists</Text>
                </View>
                <Feather name="chevron-right" size={22} color={colors.inkMuted} />
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
    backgroundColor: colors.canvas
  },
  scrollContent: {
    paddingBottom: 110 // Clearance for floating navigation dock
  },

  // Hero Section: Deep Midnight Clinical Navy
  heroSection: {
    backgroundColor: colors.foundation,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: '#0F3057',
    opacity: 0.95
  },
  headerStethoscope: {
    position: 'absolute',
    top: 10,
    right: 2,
    width: 140,
    height: 140,
    opacity: 0.85
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
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
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  bellWrapper: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral
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
  heroHeadline: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 20,
    maxWidth: '75%'
  },

  // Professional CTA Card (Pure White with Royal Blue Accents)
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandBlueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  ctaTextWrap: {
    flex: 1
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.foundation,
    letterSpacing: -0.3
  },
  ctaSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 2
  },

  // Canvas Section
  canvasSection: {
    paddingHorizontal: 18,
    paddingTop: 24
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 2
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlue
  },

  // Horizontal Department Cards
  deptCardsRow: {
    paddingRight: 20,
    gap: 12
  },
  deptCard: {
    width: 105,
    height: 125,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  deptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deptCardName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2
  },

  // Appointment Card: Clean Medical Pass
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  dateBlock: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  dateBlockDay: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brandBlueDark,
    lineHeight: 24
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
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.successText
  },
  doctorName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.2
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  }
});
