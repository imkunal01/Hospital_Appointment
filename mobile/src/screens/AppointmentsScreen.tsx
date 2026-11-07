import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { useAppointments } from '../hooks/useAppointments.js';
import { ScreenState } from '../components/ScreenState.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Appointment } from '../api/types.js';
import { formatDate, formatTimeRange } from '../utils/dates.js';
import { extractErrorMessage } from '../utils/errors.js';
import { colors } from '../theme/colors.js';
import { spacing, borderRadius } from '../theme/spacing.js';

interface AppointmentsScreenProps {
  navigation: any;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ navigation }) => {
  const [activeScope, setActiveScope] = useState<'upcoming' | 'past'>('upcoming');

  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useAppointments(activeScope);

  const handleSelectAppointment = (appointment: Appointment) => {
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
  };

  return (
    <View style={styles.container}>
      {/* Scope Segmented Control (Tabs) */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityLabel="Show Upcoming Appointments"
          accessibilityState={{ selected: activeScope === 'upcoming' }}
          style={[
            styles.segmentButton,
            activeScope === 'upcoming' && styles.segmentButtonActive
          ]}
          onPress={() => setActiveScope('upcoming')}
        >
          <Text
            style={[
              styles.segmentText,
              activeScope === 'upcoming' && styles.segmentTextActive
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityLabel="Show Past Appointments"
          accessibilityState={{ selected: activeScope === 'past' }}
          style={[
            styles.segmentButton,
            activeScope === 'past' && styles.segmentButtonActive
          ]}
          onPress={() => setActiveScope('past')}
        >
          <Text
            style={[
              styles.segmentText,
              activeScope === 'past' && styles.segmentTextActive
            ]}
          >
            Past & Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <ScreenState
        loading={isLoading}
        loadingMessage={`Loading ${activeScope} appointments...`}
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
        empty={!isLoading && (!appointments || appointments.length === 0)}
        emptyMessage={
          activeScope === 'upcoming'
            ? 'You have no upcoming appointments. Use the Doctors tab to book a consultation.'
            : 'No past appointments or visit records on file.'
        }
      >
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Appointment with ${item.doctorName} on ${formatDate(item.startsAt)}, status ${item.status}`}
              style={styles.appointmentCard}
              onPress={() => handleSelectAppointment(item)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.referenceText}>{item.reference}</Text>
                  <Text style={styles.doctorName}>{item.doctorName}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.specialtyText}>
                {item.specialty} • {item.departmentName}
              </Text>

              <View style={styles.timeRow}>
                <Text style={styles.timeIcon}>🕒</Text>
                <Text style={styles.timeText}>
                  {formatDate(item.startsAt)} at {formatTimeRange(item.startsAt, item.endsAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </ScreenState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xs,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  segmentButton: {
    flex: 1,
    minHeight: spacing.minTouchTarget, // 48dp minimum
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm
  },
  segmentButtonActive: {
    backgroundColor: colors.primary
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary
  },
  segmentTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0
  },
  appointmentCard: {
    minHeight: spacing.minTouchTarget, // 48dp minimum
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  specialtyText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  timeIcon: {
    fontSize: 13,
    marginRight: 6
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  }
});
