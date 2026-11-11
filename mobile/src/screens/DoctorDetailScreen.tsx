import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Doctor, Slot } from '../api/types';
import { useDoctorSlots } from '../hooks/useCatalog';
import { useBookSlot } from '../hooks/useBooking';
import { ScreenState } from '../components/ScreenState';
import { DoctorAvatar } from '../components/DoctorAvatar';
import { formatDate, formatTimeRange, toISODateString } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useSafeInsets } from '../hooks/useSafeInsets';

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
  const insets = useSafeInsets();
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
      `Book consultation with ${doctor.name} on ${formatDate(selectedSlot.startsAt)} at ${new Date(selectedSlot.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: handleConfirmBooking }
      ]
    );
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const monthYearLabel = selectedDateObj.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Editorial Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 6 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Date & time</Text>

        <View style={{ width: 44 }} />
      </View>

      {/* Stepper Progress Bar (Step 3 of 3) */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperLabelRow}>
          <Text style={styles.stepText}>STEP 3 OF 3</Text>
          <Text style={styles.stepName}>Schedule</Text>
        </View>
        <View style={styles.stepperTrack}>
          <View style={[styles.stepperFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Selected Doctor Summary Card */}
        <View style={styles.doctorBanner}>
          <DoctorAvatar name={doctor.name} size={64} style={styles.avatarBorder} />
          <View style={styles.doctorBannerInfo}>
            <Text style={styles.bannerEyebrow}>APPOINTMENT WITH</Text>
            <Text style={styles.bannerDoctorName}>{doctor.name}</Text>
            <Text style={styles.bannerSpecialty}>
              {doctor.specialty} · {doctor.departmentName}
            </Text>
          </View>
        </View>

        {/* 1. Date Selector Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Choose a date</Text>
        </View>

        {/* Month Navigation Row */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={styles.monthNavBtn}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>

          <Text style={styles.monthYearText}>{monthYearLabel}</Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={styles.monthNavBtn}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Feather name="chevron-right" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Horizontal Calendar Date Strips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesList}
        >
          {availableDates.map((dateItem) => {
            const iso = toISODateString(dateItem);
            const isSelected = iso === selectedDate;
            const weekday = dateItem.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = dateItem.getDate();

            return (
              <TouchableOpacity
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={`${weekday}, ${dayNum}`}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected
                ]}
                onPress={() => {
                  setSelectedDate(iso);
                  setSelectedSlot(null);
                  setBookingError(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dateWeekday, isSelected && styles.dateTextSelected]}>
                  {weekday}
                </Text>
                <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>
                  {dayNum}
                </Text>
                {isSelected && <View style={styles.dateDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Available Times Section */}
        <View style={styles.timesHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Available times</Text>
            <Text style={styles.sectionSubtitle}>Times shown in your local timezone</Text>
          </View>
        </View>

        <ScreenState
          loading={isSlotsLoading}
          loadingMessage="Loading open consultation hours..."
          error={isSlotsError ? extractErrorMessage(slotsError) : null}
          onRetry={refetchSlots}
          empty={!isSlotsLoading && (!slots || slots.length === 0)}
          emptyMessage="No available consultation slots for this date. Please pick another day."
        >
          {/* 3-Column Slot Grid */}
          <View style={styles.slotsGrid}>
            {slots?.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isAvailable = slot.status === 'AVAILABLE';
              const timeString = new Date(slot.startsAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!isAvailable || bookSlotMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Slot from ${formatTimeRange(slot.startsAt, slot.endsAt)}`}
                  style={[
                    styles.slotChip,
                    isSelected && styles.slotChipSelected,
                    !isAvailable && styles.slotChipDisabled
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.slotTimeText,
                      isSelected && styles.slotTimeTextSelected,
                      !isAvailable && styles.slotTimeTextDisabled
                    ]}
                  >
                    {timeString}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScreenState>

        {bookingError && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{bookingError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Proceed to book selected appointment slot"
          disabled={!selectedSlot || bookSlotMutation.isPending}
          style={[
            styles.confirmButton,
            (!selectedSlot || bookSlotMutation.isPending) && styles.confirmButtonDisabled
          ]}
          onPress={promptConfirmationDialog}
          activeOpacity={0.88}
        >
          <Text style={styles.confirmButtonText}>
            {bookSlotMutation.isPending ? 'Securing Slot...' : 'Confirm appointment'}
          </Text>
          <Feather name="chevron-right" size={22} color={colors.chartreuse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },

  // Stepper
  stepperContainer: {
    paddingHorizontal: 18,
    marginBottom: 16
  },
  stepperLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  stepText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1
  },
  stepName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink
  },
  stepperTrack: {
    height: 7,
    backgroundColor: '#E4DFD5',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden'
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.chartreuse,
    borderRadius: 3
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130
  },

  // Selected Doctor Banner
  doctorBanner: {
    backgroundColor: colors.lilac,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  avatarBorder: {
    marginRight: 14
  },
  doctorBannerInfo: {
    flex: 1
  },
  bannerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 2
  },
  bannerDoctorName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },
  bannerSpecialty: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  },

  // Date Section
  sectionTitleRow: {
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  monthYearText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.2
  },

  datesList: {
    gap: 10,
    paddingRight: 20,
    marginBottom: 24
  },
  dateCard: {
    width: 64,
    height: 84,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  dateCardSelected: {
    backgroundColor: colors.chartreuse
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
    marginBottom: 2
  },
  dateDayNum: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink
  },
  dateTextSelected: {
    color: colors.ink
  },
  dateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.ink,
    marginTop: 3
  },

  // Times Section
  timesHeaderRow: {
    marginBottom: 14
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 2
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  slotChip: {
    width: '31%',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  slotChipSelected: {
    backgroundColor: colors.foundation,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  slotChipDisabled: {
    backgroundColor: '#E8E4DA',
    borderColor: '#C7C2B6',
    shadowOpacity: 0,
    elevation: 0
  },
  slotTimeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.ink
  },
  slotTimeTextSelected: {
    color: colors.chartreuse,
    fontWeight: '900'
  },
  slotTimeTextDisabled: {
    color: '#9E988A'
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coralLight,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: 14,
    padding: 12,
    marginTop: 16
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.error
  },

  // Bottom Sticky CTA
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.canvas,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    paddingHorizontal: 18,
    paddingTop: 12,
    zIndex: 100,
    elevation: 10
  },
  confirmButton: {
    backgroundColor: colors.foundation,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  confirmButtonDisabled: {
    backgroundColor: '#E2DDD2',
    borderColor: '#B8B2A6',
    shadowOpacity: 0,
    elevation: 0
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.chartreuse,
    letterSpacing: -0.2,
    marginRight: 6
  }
});
