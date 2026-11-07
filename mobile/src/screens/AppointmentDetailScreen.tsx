import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import {
  useAppointmentDetail,
  useRescheduleAppointment,
  useCancelAppointment,
  useAppointmentReports
} from '../hooks/useAppointments';
import { useDoctorSlots } from '../hooks/useCatalog';
import { useNetwork } from '../hooks/useNetwork';
import { ScreenState } from '../components/ScreenState';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { formatDate, formatTimeRange, toISODateString } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { Slot } from '../api/types';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface AppointmentDetailScreenProps {
  route: {
    params: {
      appointmentId: string;
    };
  };
  navigation: any;
}

export const AppointmentDetailScreen: React.FC<AppointmentDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { appointmentId } = route.params;
  const { isOffline } = useNetwork();

  const {
    data: appointment,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useAppointmentDetail(appointmentId);

  const { data: reports, isLoading: isReportsLoading } = useAppointmentReports(appointmentId);

  const rescheduleMutation = useRescheduleAppointment();
  const cancelMutation = useCancelAppointment();

  // Reschedule Modal State
  const [isRescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>(toISODateString(new Date()));
  const [selectedNewSlot, setSelectedNewSlot] = useState<Slot | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Available dates for rescheduling (next 14 days)
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

  // Fetch slots for reschedule target doctor & date
  const {
    data: newSlots,
    isLoading: isNewSlotsLoading,
    refetch: refetchNewSlots
  } = useDoctorSlots(appointment?.doctorId || '', rescheduleDate);

  const isCancellingRef = useRef(false);
  const isReschedulingRef = useRef(false);

  const isConfirmed = appointment?.status === 'CONFIRMED';
  const isActionDisabled = isOffline || !isConfirmed || rescheduleMutation.isPending || cancelMutation.isPending;

  const handleCancelPress = () => {
    if (isActionDisabled || !appointment || isCancellingRef.current) return;

    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${appointment.doctorName} on ${formatDate(appointment.startsAt)}? This slot will be released for other patients.`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            if (isCancellingRef.current) return;
            isCancellingRef.current = true;

            cancelMutation.mutate(
              { appointmentId: appointment.id },
              {
                onSuccess: () => {
                  isCancellingRef.current = false;
                  Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled and the slot released.');
                },
                onError: (err) => {
                  isCancellingRef.current = false;
                  Alert.alert('Cancellation Error', extractErrorMessage(err));
                }
              }
            );
          }
        }
      ]
    );
  };

  const handleConfirmReschedule = () => {
    if (!selectedNewSlot || !appointment || isActionDisabled || isReschedulingRef.current) return;

    isReschedulingRef.current = true;
    setRescheduleError(null);

    rescheduleMutation.mutate(
      {
        appointmentId: appointment.id,
        newSlotId: selectedNewSlot.id,
        doctorId: appointment.doctorId,
        date: rescheduleDate
      },
      {
        onSuccess: () => {
          isReschedulingRef.current = false;
          setRescheduleModalVisible(false);
          setSelectedNewSlot(null);
          Alert.alert('Success', 'Your appointment has been rescheduled.');
        },
        onError: (err: any) => {
          isReschedulingRef.current = false;
          const isTaken = err?.response?.data?.error?.code === 'SLOT_TAKEN';
          const msg = isTaken
            ? 'That slot was just reserved by someone else. Please choose another time.'
            : extractErrorMessage(err);

          setRescheduleError(msg);
          setSelectedNewSlot(null);
          refetchNewSlots();
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <ScreenState
        loading={isLoading}
        loadingMessage="Loading appointment details..."
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
      >
        {appointment && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
              />
            }
          >
            {/* Status & Reference Header */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.referenceLabel}>Booking Reference</Text>
                  <Text style={styles.referenceText}>{appointment.reference}</Text>
                </View>
                <StatusBadge status={appointment.status} />
              </View>

              <View style={styles.divider} />

              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.specialtyText}>
                {appointment.specialty} • {appointment.departmentName}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scheduled Date</Text>
                <Text style={styles.detailValue}>{formatDate(appointment.startsAt)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Window</Text>
                <Text style={styles.detailValue}>
                  {formatTimeRange(appointment.startsAt, appointment.endsAt)}
                </Text>
              </View>
            </View>

            {/* Offline Notification Box */}
            {isOffline && (
              <View style={styles.offlineWarningBox}>
                <Text style={styles.offlineWarningText}>
                  ⚠️ You are currently offline. Rescheduling and cancellation are disabled.
                </Text>
              </View>
            )}

            {/* Action Buttons for Confirmed Appointments */}
            {isConfirmed && (
              <View style={styles.actionsContainer}>
                <Button
                  title="Reschedule Appointment"
                  onPress={() => {
                    setRescheduleModalVisible(true);
                    setSelectedNewSlot(null);
                    setRescheduleError(null);
                  }}
                  variant="outline"
                  disabled={isActionDisabled}
                  accessibilityLabel="Reschedule this appointment to another date or time"
                  style={styles.actionButton}
                />
                <Button
                  title={cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                  onPress={handleCancelPress}
                  variant="danger"
                  disabled={isActionDisabled}
                  loading={cancelMutation.isPending}
                  accessibilityLabel="Cancel this appointment and free the slot"
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* Visit Reports & Metadata Section (Strictly Non-Diagnostic) */}
            <View style={styles.reportsSection}>
              <Text style={styles.sectionTitle}>Visit Records & File Metadata</Text>
              <Text style={styles.metadataDisclaimer}>
                Strictly administrative and file metadata. No medical diagnoses, prescriptions, or clinical recommendations are displayed.
              </Text>

              {isReportsLoading ? (
                <Text style={styles.loadingReportsText}>Loading report records...</Text>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <View style={styles.reportIconCircle}>
                      <Text style={styles.reportIcon}>📄</Text>
                    </View>
                    <View style={styles.reportDetails}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportMeta}>
                        Type: {report.reportType} • Size: {report.fileSizeKb} KB
                      </Text>
                      <Text style={styles.reportDate}>Recorded on {report.reportDate}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyReportsBox}>
                  <Text style={styles.emptyReportsText}>
                    No visit report files or administrative records attached to this visit.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </ScreenState>

      {/* Reschedule Modal */}
      <Modal
        visible={isRescheduleModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close reschedule dialog"
              onPress={() => setRescheduleModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Select a new date and available time slot with {appointment?.doctorName}:
            </Text>

            {rescheduleError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>⚠️ {rescheduleError}</Text>
              </View>
            )}

            {/* Date Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroll}
            >
              {availableDates.map((dateObj) => {
                const dateStr = toISODateString(dateObj);
                const isSelected = rescheduleDate === dateStr;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    accessibilityRole="button"
                    accessibilityLabel={`Date ${dateObj.toLocaleDateString()}`}
                    style={[
                      styles.modalDateCard,
                      isSelected && styles.modalDateCardSelected
                    ]}
                    onPress={() => {
                      setRescheduleDate(dateStr);
                      setSelectedNewSlot(null);
                      setRescheduleError(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalDateWeekday,
                        isSelected && styles.modalDateTextSelected
                      ]}
                    >
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[
                        styles.modalDateDayNum,
                        isSelected && styles.modalDateTextSelected
                      ]}
                    >
                      {dateObj.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Slot Picker */}
            <Text style={styles.pickerHeading}>Available Slots for {formatDate(rescheduleDate)}</Text>

            {isNewSlotsLoading ? (
              <Text style={styles.loadingReportsText}>Loading available slots...</Text>
            ) : newSlots && newSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {newSlots.map((slot) => {
                  const isSelected = selectedNewSlot?.id === slot.id;

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Slot ${formatTimeRange(slot.startsAt, slot.endsAt)}`}
                      style={[
                        styles.slotChip,
                        isSelected && styles.slotChipSelected
                      ]}
                      onPress={() => setSelectedNewSlot(slot)}
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
            ) : (
              <Text style={styles.noSlotsText}>No open slots on this date. Please pick another day.</Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title={rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              onPress={handleConfirmReschedule}
              disabled={!selectedNewSlot || rescheduleMutation.isPending || isOffline}
              loading={rescheduleMutation.isPending}
              accessibilityLabel="Confirm moving appointment to selected slot"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  referenceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  referenceText: {
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
  doctorName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  specialtyText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: spacing.sm
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  offlineWarningBox: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: spacing.md
  },
  offlineWarningText: {
    fontSize: 13,
    color: colors.errorText,
    fontWeight: '600'
  },
  actionsContainer: {
    marginBottom: spacing.lg,
    gap: spacing.sm
  },
  actionButton: {
    width: '100%'
  },
  reportsSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metadataDisclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 16
  },
  loadingReportsText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: spacing.sm
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  reportIcon: {
    fontSize: 16
  },
  reportDetails: {
    flex: 1
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  reportMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  reportDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  emptyReportsBox: {
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  emptyReportsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary
  },
  modalContent: {
    padding: spacing.md
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  modalErrorBox: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error
  },
  modalErrorText: {
    color: colors.errorText,
    fontSize: 13,
    fontWeight: '600'
  },
  dateScroll: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.md
  },
  modalDateCard: {
    minHeight: spacing.minTouchTarget,
    width: 64,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalDateCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  modalDateWeekday: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  modalDateDayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  modalDateTextSelected: {
    color: colors.surface
  },
  pickerHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  slotChip: {
    minHeight: spacing.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
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
  noSlotsText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm
  },
  modalFooter: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  }
});
