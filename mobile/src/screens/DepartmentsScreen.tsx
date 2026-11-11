import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform
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
            tintColor={colors.chartreuse}
            colors={[colors.foundation]}
          />
        }
      >
        {/* Top Editorial Hero Banner (Deep Ink-Green) */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 12 }
          ]}
        >
          {/* Decorative Geometric Artwork */}
          <View style={styles.decorRing} />
          <View style={styles.decorCoralArch} />

          {/* Top Brand Bar */}
          <View style={styles.topBrandRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoPlusCircle}>
                <Feather name="plus" size={18} color={colors.foundation} />
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
                <Feather name="bell" size={20} color={colors.ink} />
                <View style={styles.bellDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Editorial Greeting */}
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
              <Feather name="calendar" size={22} color={colors.chartreuse} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Book an appointment</Text>
              <Text style={styles.ctaSubtitle}>Find a doctor and choose a time</Text>
            </View>
            <Feather name="chevron-right" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Lower Canvas Content (Warm Parchment) */}
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
                    style={[styles.deptCard, { backgroundColor: theme.bg }]}
                    onPress={() => handleSelectDepartment(dept)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.deptIconCircle}>
                      {theme.iconFamily === 'Ionicons' ? (
                        <Ionicons name={theme.iconName as any} size={24} color={colors.ink} />
                      ) : (
                        <MaterialCommunityIcons name={theme.iconName as any} size={24} color={colors.ink} />
                      )}
                    </View>
                    <Text style={styles.deptCardName} numberOfLines={1}>
                      {dept.name.replace(' Medicine', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* "All clinics" shortcut */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all clinics"
                style={[styles.deptCard, { backgroundColor: colors.peach }]}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                <View style={styles.deptIconCircle}>
                  <MaterialCommunityIcons name="hospital-building" size={24} color={colors.ink} />
                </View>
                <Text style={styles.deptCardName} numberOfLines={1}>
                  All clinics
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* 2. Up Next / Your appointment */}
            <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
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

                <Feather name="chevron-right" size={22} color={colors.ink} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Book an appointment now"
                style={[styles.appointmentCard, { backgroundColor: colors.lilacLight }]}
                onPress={() => handleSelectDepartment()}
                activeOpacity={0.85}
              >
                <View style={styles.dateBlock}>
                  <Feather name="calendar" size={26} color={colors.ink} />
                </View>
                <View style={styles.appointmentInfo}>
                  <View style={[styles.statusPill, { backgroundColor: colors.lilac }]}>
                    <Text style={styles.statusText}>Ready to book</Text>
                  </View>
                  <Text style={styles.doctorName}>No upcoming appointments</Text>
                  <Text style={styles.doctorSpecialty}>Tap to consult verified specialists</Text>
                </View>
                <Feather name="chevron-right" size={22} color={colors.ink} />
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

  // Hero Section
  heroSection: {
    backgroundColor: colors.foundation,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    backgroundColor: colors.chartreuse,
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
    shadowColor: colors.chartreuse,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral
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
  heroHeadline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 22
  },

  // CTA Card
  ctaCard: {
    backgroundColor: colors.chartreuse,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.foundation,
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
    color: colors.ink,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink
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
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  deptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deptCardName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.2
  },

  // Appointment Card
  appointmentCard: {
    backgroundColor: colors.sky,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  dateBlock: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  dateBlockDay: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 24
  },
  dateBlockMonth: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.inkMuted,
    letterSpacing: 0.5
  },
  appointmentInfo: {
    flex: 1
  },
  statusPill: {
    backgroundColor: colors.chartreuse,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginRight: 5
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '900',
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
