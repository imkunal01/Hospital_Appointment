import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAppointmentDetail,
  useRescheduleAppointment,
  useCancelAppointment,
  useAppointmentReports
} from '../hooks/useAppointments';
import { useDoctorSlots } from '../hooks/useCatalog';
import { useNetwork } from '../hooks/useNetwork';
import { ScreenState } from '../components/ScreenState';
import { DoctorAvatar } from '../components/DoctorAvatar';
import { formatDate, formatTimeRange, toISODateString } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { showAlert } from '../utils/alert';
import { Slot } from '../api/types';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

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
  const insets = useSafeInsets();
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

    showAlert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${appointment.doctorName} on ${formatDate(appointment.startsAt)}? This slot will be released for other patients.`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            isCancellingRef.current = true;
            cancelMutation.mutate(appointment.id, {
              onSuccess: () => {
                isCancellingRef.current = false;
                showAlert(
                  'Appointment Cancelled',
                  'Your appointment has been cancelled and the slot released.',
                  [{ text: 'OK' }]
                );
              },
              onError: (err) => {
                isCancellingRef.current = false;
                showAlert('Cancellation Error', extractErrorMessage(err));
              }
            });
          }
        }
      ]
    );
  };

  const handleConfirmReschedule = () => {
    if (!selectedNewSlot || !appointment || isReschedulingRef.current) return;

    isReschedulingRef.current = true;
    setRescheduleError(null);

    rescheduleMutation.mutate(
      {
        appointmentId: appointment.id,
        newSlotId: selectedNewSlot.id
      },
      {
        onSuccess: () => {
          isReschedulingRef.current = false;
          setRescheduleModalVisible(false);
          setSelectedNewSlot(null);
          showAlert(
            'Rescheduled Successfully',
            `Your appointment has been moved to ${formatDate(selectedNewSlot.startsAt)} at ${formatTimeRange(selectedNewSlot.startsAt, selectedNewSlot.endsAt)}.`,
            [{ text: 'OK' }]
          );
        },
        onError: (err: any) => {
          isReschedulingRef.current = false;
          const isSlotTaken = err?.response?.data?.error?.code === 'SLOT_TAKEN';
          const msg = isSlotTaken
            ? 'That slot was just reserved by another patient. Please pick another available time.'
            : extractErrorMessage(err);
          setRescheduleError(msg);
          refetchNewSlots();
        }
      }
    );
  };

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

        <Text style={styles.topBarTitle}>Appointment Details</Text>

        <View style={{ width: 44 }} />
      </View>

      <ScreenState
        loading={isLoading}
        loadingMessage="Retrieving appointment records..."
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
        empty={!isLoading && !appointment}
        emptyMessage="Appointment record not found."
      >
        {appointment && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.foundation}
                colors={[colors.foundation]}
              />
            }
          >
            {/* Appointment Ticket Card */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View
                  style={[
                    styles.statusPill,
                    appointment.status === 'CANCELLED' && styles.statusCancelledPill
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      appointment.status === 'CANCELLED' && { backgroundColor: colors.error }
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      appointment.status === 'CANCELLED' && { color: colors.error }
                    ]}
                  >
                    {appointment.status}
                  </Text>
                </View>
                <Text style={styles.refText}>REF # <Text>{appointment.reference}</Text></Text>
              </View>

              {/* Doctor Row */}
              <View style={styles.doctorRow}>
                <DoctorAvatar name={appointment.doctorName} size={64} style={{ marginRight: 14 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                  <Text style={styles.doctorSpecialty}>
                    {appointment.specialty} · {appointment.departmentName}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Date & Time Rows */}
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

            {/* Offline Notification */}
            {isOffline && (
              <View style={styles.offlineBox}>
                <Feather name="wifi-off" size={18} color={colors.ink} style={{ marginRight: 10 }} />
                <Text style={styles.offlineText}>
                  You are currently offline. Rescheduling and cancellation are disabled.
                </Text>
              </View>
            )}

            {/* Action Buttons for Confirmed Appointments */}
            {isConfirmed && (
              <View style={styles.actionsWrap}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule this appointment to another date or time"
                  disabled={isActionDisabled}
                  style={[styles.rescheduleBtn, isActionDisabled && styles.btnDisabled]}
                  onPress={() => {
                    setRescheduleModalVisible(true);
                    setSelectedNewSlot(null);
                    setRescheduleError(null);
                  }}
                  activeOpacity={0.88}
                >
                  <Feather name="calendar" size={18} color={colors.ink} style={{ marginRight: 8 }} />
                  <Text style={styles.rescheduleBtnText}>Reschedule Appointment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Cancel this appointment and free the slot"
                  disabled={isActionDisabled}
                  style={[styles.cancelBtn, isActionDisabled && styles.btnDisabled]}
                  onPress={handleCancelPress}
                  activeOpacity={0.88}
                >
                  <Feather name="x-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={styles.cancelBtnText}>
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Visit Reports & File Metadata Section */}
            <View style={styles.reportsSection}>
              <View style={styles.reportsHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.ink} />
                <Text style={styles.reportsTitle}>Visit Records & File Metadata</Text>
              </View>
              <Text style={styles.reportsDisclaimer}>
                Strictly administrative and file metadata. No diagnoses or prescriptions are stored.
              </Text>

              {isReportsLoading ? (
                <Text style={styles.reportsLoadingText}>Loading report records...</Text>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <View style={styles.reportIconCircle}>
                      <Feather name="file-text" size={18} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportMeta}>
                        Type: {report.reportType} · Size: {report.fileSizeKb} KB
                      </Text>
                      <Text style={styles.reportDate}>Recorded on {report.reportDate}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.reportEmptyBox}>
                  <Text style={styles.reportEmptyText}>
                    No document metadata generated for this appointment.
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
        presentationStyle="pageSheet"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity
              onPress={() => setRescheduleModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {rescheduleError && (
              <View style={styles.modalErrorBanner}>
                <Feather name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.modalErrorText}>{rescheduleError}</Text>
              </View>
            )}

            <Text style={styles.modalSectionLabel}>1. SELECT NEW DATE</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
            >
              {availableDates.map((dateObj) => {
                const dateStr = toISODateString(dateObj);
                const isSelected = rescheduleDate === dateStr;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[styles.modalDateCard, isSelected && styles.modalDateCardActive]}
                    onPress={() => {
                      setRescheduleDate(dateStr);
                      setSelectedNewSlot(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modalDateDay, isSelected && { color: colors.ink }]}>
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.modalDateNum, isSelected && { color: colors.ink }]}>
                      {dateObj.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>
              2. SELECT NEW TIME ({formatDate(rescheduleDate)})
            </Text>

            {isNewSlotsLoading ? (
              <Text style={{ color: colors.inkMuted, marginVertical: 14 }}>Loading slots...</Text>
            ) : newSlots && newSlots.length > 0 ? (
              <View style={styles.modalSlotsGrid}>
                {newSlots.map((slot) => {
                  const isSelected = selectedNewSlot?.id === slot.id;
                  const timeText = new Date(slot.startsAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.modalSlotChip,
                        isSelected && styles.modalSlotChipActive
                      ]}
                      onPress={() => setSelectedNewSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.modalSlotText,
                          isSelected && { color: '#FFFFFF', fontWeight: '800' }
                        ]}
                      >
                        {timeText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color: colors.inkMuted, marginVertical: 14 }}>
                No open slots on this date. Please pick another day.
              </Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              disabled={!selectedNewSlot || rescheduleMutation.isPending}
              style={[
                styles.modalConfirmBtn,
                (!selectedNewSlot || rescheduleMutation.isPending) && styles.btnDisabled
              ]}
              onPress={handleConfirmReschedule}
              activeOpacity={0.88}
            >
              <Text style={styles.modalConfirmText}>
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 64
  },

  // Ticket Card
  ticketCard: {
    backgroundColor: colors.sky,
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
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusCancelledPill: {
    backgroundColor: colors.coralLight,
    borderColor: '#FCA5A5'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.successText
  },
  refText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlue,
    letterSpacing: 0.5
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  doctorName: {
    fontSize: 19,
    fontWeight: '800',
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
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  infoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
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

  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16
  },
  offlineText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.warningText
  },

  // Action Buttons
  actionsWrap: {
    gap: 12,
    marginBottom: 20
  },
  rescheduleBtn: {
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlue,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  rescheduleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandBlue
  },
  cancelBtn: {
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.coralDark
  },
  btnDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0
  },

  // Reports
  reportsSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20
  },
  reportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  reportsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginLeft: 8
  },
  reportsDisclaimer: {
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 14,
    lineHeight: 16
  },
  reportsLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1,
    borderColor: colors.brandBlueBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink
  },
  reportMeta: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2
  },
  reportDate: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSubtle,
    marginTop: 2
  },
  reportEmptyBox: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  reportEmptyText: {
    fontSize: 12.5,
    color: colors.inkMuted
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalScroll: {
    flex: 1
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: 8
  },
  modalDateCard: {
    width: 60,
    height: 74,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  modalDateCardActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  modalDateDay: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkMuted
  },
  modalDateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink
  },
  modalSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10
  },
  modalSlotChip: {
    width: '31%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  modalSlotChipActive: {
    backgroundColor: colors.foundation,
    borderColor: colors.foundation
  },
  modalSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12
  },
  modalErrorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.coralDark
  },
  modalFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalConfirmBtn: {
    backgroundColor: colors.foundation,
    borderRadius: 18,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.foundation,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
