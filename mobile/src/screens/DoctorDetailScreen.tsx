import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Doctor, Slot } from '../api/types';
import { useDoctorSlots } from '../hooks/useCatalog';
import { useBookSlot } from '../hooks/useBooking';
import { ScreenState } from '../components/ScreenState';
import { Button } from '../components/Button';
import { formatDate, formatTimeRange, toISODateString } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface DoctorDetailScreenProps {
  route: {
    params: {
      doctor: Doctor;
    };
  };
  navigation: any;
}

export const DoctorDetailScreen: React.FC<DoctorDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { doctor } = route.params;

  // Generate next 14 calendar days starting from today
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(
    toISODateString(availableDates[0])
  );
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch available slots for this doctor on the selected date
  const {
    data: slots,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    error: slotsError,
    refetch: refetchSlots
  } = useDoctorSlots(doctor.id, selectedDate);

  const bookSlotMutation = useBookSlot();

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setBookingError(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;

    // Generate unique idempotency key for this booking attempt
    const idempotencyKey = `mobile-book-${selectedSlot.id}-${Date.now()}`;
    setBookingError(null);

    bookSlotMutation.mutate(
      {
        slotId: selectedSlot.id,
        idempotencyKey,
        doctorId: doctor.id,
        date: selectedDate
      },
      {
        onSuccess: (confirmedAppointment) => {
          // Rule A5: Transition to confirmation screen ONLY after server confirms with HTTP 201/200
          navigation.navigate('Confirmation', {
            appointment: confirmedAppointment
          });
        },
        onError: (err: any) => {
          const isSlotTaken = err?.response?.data?.error?.code === 'SLOT_TAKEN';
          const message = isSlotTaken
            ? 'This appointment slot was just reserved by another patient. We have updated available times.'
            : extractErrorMessage(err);

          setBookingError(message);
          setSelectedSlot(null);

          Alert.alert(
            isSlotTaken ? 'Slot No Longer Available' : 'Booking Error',
            message,
            [{ text: 'OK' }]
          );
        }
      }
    );
  };

  const promptConfirmationDialog = () => {
    if (!selectedSlot) return;

    Alert.alert(
      'Confirm Appointment',
      `Book consultation with ${doctor.name} on ${formatDate(selectedSlot.startsAt)} from ${formatTimeRange(selectedSlot.startsAt, selectedSlot.endsAt)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: handleConfirmBooking }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Doctor Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {doctor.name
                .replace('Dr. ', '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <Text style={styles.deptBadge}>{doctor.departmentName}</Text>
          {doctor.bio ? (
            <Text style={styles.bioText}>{doctor.bio}</Text>
          ) : null}
        </View>

        {/* Date Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1. Select Date</Text>
          <Text style={styles.sectionSubtitle}>Choose an upcoming day</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {availableDates.map((dateObj) => {
            const dateStr = toISODateString(dateObj);
            const isSelected = selectedDate === dateStr;
            const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthStr = dateObj.toLocaleDateString(undefined, { month: 'short' });

            return (
              <TouchableOpacity
                key={dateStr}
                accessibilityRole="button"
                accessibilityLabel={`Date ${weekday} ${monthStr} ${dayNum}`}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected
                ]}
                onPress={() => {
                  setSelectedDate(dateStr);
                  setSelectedSlot(null);
                  setBookingError(null);
                }}
              >
                <Text style={[styles.dateWeekday, isSelected && styles.dateTextSelected]}>
                  {weekday}
                </Text>
                <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>
                  {dayNum}
                </Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                  {monthStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slot Picker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>2. Select Available Slot</Text>
          <Text style={styles.sectionSubtitle}>
            Slots for {formatDate(selectedDate)}
          </Text>
        </View>

        {bookingError ? (
          <View accessibilityRole="alert" style={styles.errorAlert}>
            <Text style={styles.errorAlertText}>⚠️ {bookingError}</Text>
          </View>
        ) : null}

        <ScreenState
          loading={isSlotsLoading}
          loadingMessage="Checking real-time slot availability..."
          error={isSlotsError ? extractErrorMessage(slotsError) : null}
          onRetry={refetchSlots}
          empty={!isSlotsLoading && (!slots || slots.length === 0)}
          emptyMessage="No available slots on this date. Please select another day."
        >
          <View style={styles.slotsGrid}>
            {slots?.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <TouchableOpacity
                  key={slot.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Slot from ${formatTimeRange(slot.startsAt, slot.endsAt)}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.slotChip,
                    isSelected && styles.slotChipSelected
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotChipText,
                      isSelected && styles.slotChipTextSelected
                    ]}
                  >
                    {formatTimeRange(slot.startsAt, slot.endsAt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScreenState>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Selected Slot:</Text>
          <Text style={styles.summaryValue}>
            {selectedSlot
              ? `${formatDate(selectedSlot.startsAt)}, ${formatTimeRange(selectedSlot.startsAt, selectedSlot.endsAt)}`
              : 'Please choose a slot above'}
          </Text>
        </View>

        <Button
          title={bookSlotMutation.isPending ? 'Confirming...' : 'Book Appointment'}
          onPress={promptConfirmationDialog}
          disabled={!selectedSlot || bookSlotMutation.isPending}
          loading={bookSlotMutation.isPending}
          accessibilityLabel="Proceed to book selected appointment slot"
          style={styles.bookButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110 // Space for sticky bottom bar
  },
  profileHeader: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  doctorSpecialty: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  deptBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    overflow: 'hidden'
  },
  bioText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  dateScroll: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg
  },
  dateCard: {
    minHeight: spacing.minTouchTarget, // 48dp minimum
    width: 72,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  dateDayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 2
  },
  dateMonth: {
    fontSize: 11,
    color: colors.textSecondary
  },
  dateTextSelected: {
    color: colors.surface
  },
  errorAlert: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  errorAlertText: {
    color: colors.errorText,
    fontSize: 13,
    fontWeight: '600'
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  slotChip: {
    minHeight: spacing.minTouchTarget, // 48dp minimum touch target
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '47%'
  },
  slotChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  slotChipTextSelected: {
    color: colors.primaryDark
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8
  },
  summaryContainer: {
    marginBottom: spacing.xs
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bookButton: {
    marginTop: spacing.xs
  }
});

