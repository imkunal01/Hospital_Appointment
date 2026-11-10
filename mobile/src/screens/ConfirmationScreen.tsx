import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Elevated Success Badge with Glowing Ring */}
      <View style={styles.successIconOuter}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        </View>
      </View>

      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your consultation has been reserved on the hospital scheduling system.
      </Text>

      {/* Practo-Style Digital Appointment Pass Card */}
      <View style={styles.card}>
        {/* Pass Top Bar */}
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
          <View style={styles.detailLabelWrap}>
            <Feather name="user" size={15} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Consulting Physician</Text>
          </View>
          <Text style={styles.detailValue}>{appointment.doctorName}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelWrap}>
            <Feather name="activity" size={15} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Department</Text>
          </View>
          <Text style={styles.detailValue}>{appointment.departmentName}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelWrap}>
            <Feather name="award" size={15} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Specialty</Text>
          </View>
          <Text style={styles.detailValue}>{appointment.specialty}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelWrap}>
            <Feather name="calendar" size={15} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Date</Text>
          </View>
          <Text style={styles.detailValue}>{formatDate(appointment.startsAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelWrap}>
            <Feather name="clock" size={15} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Time Window</Text>
          </View>
          <Text style={styles.detailValue}>
            {formatTimeRange(appointment.startsAt, appointment.endsAt)}
          </Text>
        </View>
      </View>

      {/* Clinical Check-in Note (Zero Emojis) */}
      <View style={styles.noteBox}>
        <View style={styles.noteIconCircle}>
          <Feather name="info" size={16} color={colors.primary} />
        </View>
        <Text style={styles.noteText}>
          Please arrive 10 minutes prior to your scheduled consultation. You can view or manage this appointment anytime under My Appointments.
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
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  successIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.lg
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  referenceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  referenceValue: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: 2,
    letterSpacing: 0.3
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 3
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 13.5,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 13.5,
    color: colors.textPrimary,
    fontWeight: '800'
  },
  noteBox: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  noteIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2
  },
  noteText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18
  },
  actionButtons: {
    width: '100%'
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md
  }
});
