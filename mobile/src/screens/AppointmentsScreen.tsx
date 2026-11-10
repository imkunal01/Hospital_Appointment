import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAppointments } from '../hooks/useAppointments';
import { ScreenState } from '../components/ScreenState';
import { StatusBadge } from '../components/StatusBadge';
import { Appointment } from '../api/types';
import { formatDate, formatTimeRange } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

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

  const getCalendarDateParts = (isoDate: string) => {
    const d = new Date(isoDate);
    const month = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const day = d.getDate();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    return { month, day, weekday };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return colors.success;
      case 'CANCELLED':
        return colors.error;
      case 'COMPLETED':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Scope Segmented Control (Pill Tabs) */}
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
          activeOpacity={0.8}
        >
          <Feather
            name="calendar"
            size={15}
            color={activeScope === 'upcoming' ? '#FFFFFF' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
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
          activeOpacity={0.8}
        >
          <Feather
            name="archive"
            size={15}
            color={activeScope === 'past' ? '#FFFFFF' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const { month, day, weekday } = getCalendarDateParts(item.startsAt);
            const statusColor = getStatusColor(item.status);

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Appointment with ${item.doctorName} on ${formatDate(item.startsAt)}, status ${item.status}`}
                style={styles.appointmentCard}
                onPress={() => handleSelectAppointment(item)}
                activeOpacity={0.8}
              >
                {/* Status Indicator Left Accent Bar */}
                <View style={[styles.statusAccentBar, { backgroundColor: statusColor }]} />

                <View style={styles.cardContentWrapper}>
                  {/* Main Ticket Row */}
                  <View style={styles.cardMainRow}>
                    {/* Left Date Block */}
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateBlockMonth}>{month}</Text>
                      <Text style={styles.dateBlockDay}>{day}</Text>
                      <Text style={styles.dateBlockWeekday}>{weekday}</Text>
                    </View>

                    {/* Right Details */}
                    <View style={styles.appointmentDetails}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.refPill}>
                          <Text style={styles.referenceText}>{item.reference}</Text>
                        </View>
                        <StatusBadge status={item.status} />
                      </View>

                      <Text style={styles.doctorName}>{item.doctorName}</Text>
                      <Text style={styles.specialtyText}>
                        {item.specialty} • {item.departmentName}
                      </Text>

                      <View style={styles.timeRow}>
                        <Feather name="clock" size={13} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.timeText}>
                          {formatTimeRange(item.startsAt, item.endsAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Bottom Indicator Bar */}
                  <View style={styles.cardBottomBar}>
                    <Text style={styles.viewDetailsText}>Tap to view details & options</Text>
                    <Feather name="chevron-right" size={14} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    padding: 4,
    margin: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  segmentButton: {
    flex: 1,
    minHeight: spacing.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textSecondary
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 110 // Safe clearance for floating pill nav
  },
  appointmentCard: {
    minHeight: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  statusAccentBar: {
    width: 5
  },
  cardContentWrapper: {
    flex: 1
  },
  cardMainRow: {
    flexDirection: 'row',
    padding: spacing.md
  },
  dateBlock: {
    width: 60,
    backgroundColor: '#F0F6FF',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#D4E5FE'
  },
  dateBlockMonth: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary
  },
  dateBlockDay: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.primaryDark,
    marginVertical: 1
  },
  dateBlockWeekday: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary
  },
  appointmentDetails: {
    flex: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  refPill: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  referenceText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  doctorName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  specialtyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  cardBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  }
});
