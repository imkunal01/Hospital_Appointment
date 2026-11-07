import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Appointment } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { formatDate, formatTimeRange } from '../utils/dates';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

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
  const { appointment } = route.params;

  const handleDone = () => {
    // Navigate back to the start of the Doctors stack
    navigation.popToTop();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.successIconCircle}>
        <Text style={styles.successIcon}>✓</Text>
      </View>

      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your appointment was successfully reserved on the hospital server.
      </Text>

      {/* Booking Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.referenceLabel}>Booking Reference</Text>
            <Text
              accessibilityRole="text"
              accessibilityLabel={`Reference number: ${appointment.reference}`}
              style={styles.referenceValue}
            >
              {appointment.reference}
            </Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Doctor</Text>
          <Text style={styles.detailValue}>{appointment.doctorName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Department</Text>
          <Text style={styles.detailValue}>{appointment.departmentName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Specialty</Text>
          <Text style={styles.detailValue}>{appointment.specialty}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formatDate(appointment.startsAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {formatTimeRange(appointment.startsAt, appointment.endsAt)}
          </Text>
        </View>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          📌 Please arrive 10 minutes before your scheduled consultation. You can view or manage this appointment anytime under My Appointments.
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Done"
          onPress={handleDone}
          accessibilityLabel="Return to doctor directory"
          style={styles.doneButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successLight,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  successIcon: {
    fontSize: 36,
    color: colors.successText,
    fontWeight: '900'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 20
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.lg
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  referenceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  referenceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  noteBox: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '20'
  },
  noteText: {
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18
  },
  actionButtons: {
    width: '100%'
  },
  doneButton: {
    width: '100%'
  }
});

