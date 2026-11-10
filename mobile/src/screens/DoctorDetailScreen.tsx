import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Doctor, Slot } from '../api/types';
import { useDoctorSlots } from '../hooks/useCatalog';
import { useBookSlot } from '../hooks/useBooking';
import { ScreenState } from '../components/ScreenState';
import { Button } from '../components/Button';
import { formatDate, formatTimeRange, toISODateString } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { getDepartmentTheme } from '../theme/departmentThemes';

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
  const deptTheme = getDepartmentTheme(doctor.departmentName);

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

  // Group slots into Morning and Afternoon/Evening (Practo slot organization)
  const { morningSlots, afternoonSlots } = useMemo(() => {
    if (!slots) return { morningSlots: [], afternoonSlots: [] };
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];

    slots.forEach((s) => {
      const hour = new Date(s.startsAt).getHours();
      if (hour < 12) {
        morning.push(s);
      } else {
        afternoon.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Profile Header Card */}
        <View style={styles.profileHeader}>
          {/* Subtle Top Accent */}
          <View style={[styles.profileAccentBar, { backgroundColor: deptTheme.textColor }]} />

          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[colors.gradientStart, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>
                {doctor.name
                  .replace('Dr. ', '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </LinearGradient>
            <View style={styles.verifiedIconWrap}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          </View>

          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.deptBadge, { backgroundColor: deptTheme.bg }]}>
              <Text style={[styles.deptBadgeText, { color: deptTheme.textColor }]}>
                {doctor.departmentName}
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <Ionicons name="shield-checkmark" size={13} color={colors.secondary} />
              <Text style={styles.verifiedTagText}>Hospital Verified</Text>
            </View>
          </View>

          {doctor.bio ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{doctor.bio}</Text>
            </View>
          ) : null}
        </View>

        {/* 1. Date Selector Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumberCircle}>
            <Text style={styles.sectionNumberText}>1</Text>
          </View>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Select Consultation Date</Text>
            <Text style={styles.sectionSubtitle}>Choose an upcoming day</Text>
          </View>
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
                onPress={() => {
                  setSelectedDate(dateStr);
                  setSelectedSlot(null);
                  setBookingError(null);
                }}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientMiddle]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.dateCard, styles.dateCardSelected]}
                  >
                    <Text style={styles.dateWeekdaySelected}>{weekday}</Text>
                    <Text style={styles.dateDayNumSelected}>{dayNum}</Text>
                    <Text style={styles.dateMonthSelected}>{monthStr}</Text>
                    <View style={styles.dateActiveIndicator} />
                  </LinearGradient>
                ) : (
                  <View style={styles.dateCard}>
                    <Text style={styles.dateWeekday}>{weekday}</Text>
                    <Text style={styles.dateDayNum}>{dayNum}</Text>
                    <Text style={styles.dateMonth}>{monthStr}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Slot Picker Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumberCircle}>
            <Text style={styles.sectionNumberText}>2</Text>
          </View>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Select Available Slot</Text>
            <Text style={styles.sectionSubtitle}>
              Slots for {formatDate(selectedDate)}
            </Text>
          </View>
        </View>

        {bookingError ? (
          <View accessibilityRole="alert" style={styles.errorAlert}>
            <Feather name="alert-circle" size={18} color={colors.errorText} style={{ marginRight: 8 }} />
            <Text style={styles.errorAlertText}>{bookingError}</Text>
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
          {/* Practo-Style Grouped Slots: Morning */}
          {morningSlots.length > 0 && (
            <View style={styles.slotGroupContainer}>
              <View style={styles.slotGroupHeader}>
                <Feather name="sun" size={15} color={colors.warning} />
                <Text style={styles.slotGroupTitle}>Morning Slots ({morningSlots.length})</Text>
              </View>
              <View style={styles.slotsGrid}>
                {morningSlots.map((slot) => {
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
                      activeOpacity={0.7}
                    >
                      <View style={styles.slotChipInner}>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            styles.slotChipText,
                            isSelected && styles.slotChipTextSelected
                          ]}
                        >
                          {formatTimeRange(slot.startsAt, slot.endsAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Practo-Style Grouped Slots: Afternoon & Evening */}
          {afternoonSlots.length > 0 && (
            <View style={styles.slotGroupContainer}>
              <View style={styles.slotGroupHeader}>
                <Feather name="sunset" size={15} color={colors.secondary} />
                <Text style={styles.slotGroupTitle}>Afternoon & Evening Slots ({afternoonSlots.length})</Text>
              </View>
              <View style={styles.slotsGrid}>
                {afternoonSlots.map((slot) => {
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
                      activeOpacity={0.7}
                    >
                      <View style={styles.slotChipInner}>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            styles.slotChipText,
                            isSelected && styles.slotChipTextSelected
                          ]}
                        >
                          {formatTimeRange(slot.startsAt, slot.endsAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScreenState>
      </ScrollView>

      {/* Persistent Frosted Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Feather
              name="calendar"
              size={14}
              color={selectedSlot ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.summaryLabel}>Selected Slot</Text>
          </View>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {selectedSlot
              ? `${formatDate(selectedSlot.startsAt)}, ${formatTimeRange(selectedSlot.startsAt, selectedSlot.endsAt)}`
              : 'Please choose an available slot above'}
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
    paddingBottom: 130 // Space for sticky bottom bar & clean clearance
  },
  profileHeader: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden'
  },
  profileAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
    marginTop: 4
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  verifiedIconWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 3
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  doctorSpecialty: {
    fontSize: 14.5,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs + 2
  },
  deptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm
  },
  verifiedTagText: {
    fontSize: 11,
    color: colors.secondaryDark,
    fontWeight: '700',
    marginLeft: 4
  },
  bioContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    width: '100%'
  },
  bioText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  sectionNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  sectionTitleWrap: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 1
  },
  dateScroll: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.md
  },
  dateCard: {
    minHeight: spacing.minTouchTarget,
    width: 74,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative'
  },
  dateCardSelected: {
    borderColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  dateWeekdaySelected: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase'
  },
  dateDayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 2
  },
  dateDayNumSelected: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 2
  },
  dateMonth: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  dateMonthSelected: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700'
  },
  dateActiveIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF'
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.error + '40',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  errorAlertText: {
    flex: 1,
    color: colors.errorText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  slotGroupContainer: {
    marginBottom: spacing.md
  },
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  slotGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    marginLeft: 6
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  slotChip: {
    minHeight: spacing.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  slotChipSelected: {
    backgroundColor: '#EEF5FF',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2
  },
  slotChipInner: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  slotChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10
  },
  summaryContainer: {
    marginBottom: spacing.xs
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2
  },
  bookButton: {
    marginTop: spacing.xs,
    height: 52,
    borderRadius: borderRadius.md
  }
});
