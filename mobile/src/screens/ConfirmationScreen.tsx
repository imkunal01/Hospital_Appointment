import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Appointment } from '../api/types';
import { DoctorAvatar } from '../components/DoctorAvatar';
import { formatDate, formatTimeRange } from '../utils/dates';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface ConfirmationScreenProps {
  route: {
    params: {
      appointment: Appointment;
    };
  };
  navigation: any;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  route,
  navigation
}) => {
  const insets = useSafeInsets();
  const { appointment } = route.params;

  const handleDone = () => {
    navigation.navigate('DoctorsTab', { screen: 'Departments' });
  };

  const handleGoToAppointments = () => {
    // Navigate to Appointments Tab
    navigation.navigate('AppointmentsTab', {
      screen: 'AppointmentsList'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Section (Deep Ink-Green) */}
        <View
          style={[
            styles.heroSection,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 16 }
          ]}
        >
          {/* Decorative Art Rings */}
          <View style={styles.decorRing} />

          {/* Success Badge */}
          <View style={styles.badgeWrapper}>
            <View style={styles.successCircle}>
              <Feather name="check" size={38} color={colors.foundation} />
            </View>
          </View>

          <Text style={styles.heroTitle}>You’re booked!</Text>
          <Text style={styles.heroSubtitle}>Your appointment is confirmed.</Text>
        </View>

        {/* Appointment Details Canvas */}
        <View style={styles.canvasContent}>
          {/* Appointment Ticket Card */}
          <View style={styles.ticketCard}>
            {/* Header: Confirmed Pill + Reference */}
            <View style={styles.ticketHeader}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Confirmed</Text>
              </View>
              <Text style={styles.refText}>REF #{appointment.reference}</Text>
            </View>

            {/* Doctor Info Row */}
            <View style={styles.doctorRow}>
              <DoctorAvatar name={appointment.doctorName} size={64} style={styles.doctorAvatar} />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                <Text style={styles.doctorSpecialty}>
                  {appointment.specialty || appointment.departmentName}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Info Items */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Feather name="calendar" size={18} color={colors.ink} />
              </View>
              <View>
                <Text style={styles.infoEyebrow}>DATE</Text>
                <Text style={styles.infoValue}>{formatDate(appointment.startsAt)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Feather name="clock" size={18} color={colors.ink} />
              </View>
              <View>
                <Text style={styles.infoEyebrow}>TIME</Text>
                <Text style={styles.infoValue}>
                  {formatTimeRange(appointment.startsAt, appointment.endsAt)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.ink} />
              </View>
              <View>
                <Text style={styles.infoEyebrow}>LOCATION</Text>
                <Text style={styles.infoValue}>North Wing, Floor 2</Text>
              </View>
            </View>
          </View>

          {/* Reminder Banner */}
          <View style={styles.reminderBanner}>
            <View style={styles.bellCircle}>
              <Feather name="bell" size={20} color={colors.ink} />
            </View>
            <View style={styles.reminderTextWrap}>
              <Text style={styles.reminderTitle}>Reminder is on</Text>
              <Text style={styles.reminderSubtitle}>We’ll remind you 24 hours before.</Text>
            </View>
            <Feather name="check" size={22} color={colors.ink} />
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View my appointments"
            style={styles.primaryButton}
            onPress={handleGoToAppointments}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>View my appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            style={styles.secondaryLink}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryLinkText}>Back to home</Text>
          </TouchableOpacity>
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
    paddingBottom: 64
  },

  // Hero Section
  heroSection: {
    backgroundColor: colors.foundation,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  decorRing: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 28,
    borderColor: colors.lilac,
    opacity: 0.85
  },
  badgeWrapper: {
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 16
  },
  successCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.chartreuse,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.chartreuse,
    letterSpacing: -0.6,
    marginBottom: 4
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF'
  },

  // Content
  canvasContent: {
    paddingHorizontal: 18,
    marginTop: -16
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 16
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statusPill: {
    backgroundColor: colors.chartreuse,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginRight: 6
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink
  },
  refText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 0.5
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  doctorAvatar: {
    marginRight: 14
  },
  doctorInfo: {
    flex: 1
  },
  doctorName: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 2
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E8E3D7',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  infoEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 0.8
  },
  infoValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 1
  },

  // Reminder Banner
  reminderBanner: {
    backgroundColor: colors.lilac,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 20
  },
  bellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  reminderTextWrap: {
    flex: 1
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink
  },
  reminderSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 2
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.foundation,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 14
  },
  primaryButtonText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: colors.chartreuse,
    letterSpacing: -0.2
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8
  },
  secondaryLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline'
  }
});
