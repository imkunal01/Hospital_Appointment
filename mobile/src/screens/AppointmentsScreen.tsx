import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeInsets } from '../hooks/useSafeInsets';
import { useAppointments } from '../hooks/useAppointments';
import { ScreenState } from '../components/ScreenState';
import { SkeletonCard } from '../components/SkeletonCard';
import { Appointment } from '../api/types';
import { formatTimeRange } from '../utils/dates';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';

interface AppointmentsScreenProps {
  navigation: any;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ navigation }) => {
  const insets = useSafeInsets();
  const [activeScope, setActiveScope] = useState<'upcoming' | 'past'>('upcoming');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useAppointments(activeScope);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter(
      (a) =>
        a.doctorName.toLowerCase().includes(q) ||
        a.specialty.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  const handleSelectAppointment = (appointment: Appointment) => {
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.id });
  };

  const getCalendarDateParts = (isoDate: string) => {
    const d = new Date(isoDate);
    const month = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const day = d.getDate();
    return { month, day: String(day) };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Editorial Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 6 }]}>
        <View style={styles.plusWrapper}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Quick book appointment"
            style={styles.plusButton}
            onPress={() => navigation.navigate('BookTab')}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color={colors.brandBlue} />
          </TouchableOpacity>
        </View>

        <Text style={styles.topBarTitle}>Appointments</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Search appointments"
          style={styles.searchIconButton}
          onPress={() => setShowSearch(!showSearch)}
          activeOpacity={0.8}
        >
          <Feather name="search" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar (when toggled) */}
      {showSearch && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={colors.ink} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search by doctor, specialty, or reference..."
              placeholderTextColor={colors.inkSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoCapitalize="none"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Feather name="x" size={16} color={colors.ink} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Segmented Control Pill (Upcoming / Past) */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentTrack}>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityLabel="Show Upcoming Appointments"
            accessibilityState={{ selected: activeScope === 'upcoming' }}
            style={[
              styles.segmentPill,
              activeScope === 'upcoming' && styles.segmentPillActive
            ]}
            onPress={() => setActiveScope('upcoming')}
            activeOpacity={0.88}
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
              styles.segmentPill,
              activeScope === 'past' && styles.segmentPillActive
            ]}
            onPress={() => setActiveScope('past')}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.segmentText,
                activeScope === 'past' && styles.segmentTextActive
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointments List */}
      <ScreenState
        loading={isLoading}
        loadingMessage={`Loading ${activeScope} appointments...`}
        skeleton={
          <View style={styles.skeletonWrap}>
            <SkeletonCard type="appointment" />
            <SkeletonCard type="appointment" />
          </View>
        }
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
        empty={!isLoading && (!filteredAppointments || filteredAppointments.length === 0)}
        emptyMessage={
          activeScope === 'upcoming'
            ? 'You have no upcoming appointments scheduled.'
            : 'No past appointment history found.'
        }
      >
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.foundation}
              colors={[colors.foundation]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.countEyebrow}>
                {filteredAppointments.length} {activeScope.toUpperCase()}{' '}
                {filteredAppointments.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const { day, month } = getCalendarDateParts(item.startsAt);
            const isConfirmed = item.status === 'CONFIRMED';
            const isCancelled = item.status === 'CANCELLED';

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Appointment with ${item.doctorName} on ${item.startsAt}`}
                style={styles.appointmentCard}
                onPress={() => handleSelectAppointment(item)}
                activeOpacity={0.88}
              >
                {/* Left Date Block */}
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>{day}</Text>
                  <Text style={styles.dateMonth}>{month}</Text>
                </View>

                {/* Main Details */}
                <View style={styles.detailsCol}>
                  <View
                    style={[
                      styles.statusPill,
                      isCancelled && styles.statusCancelledPill,
                      !isConfirmed && !isCancelled && styles.statusNeutralPill
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isCancelled && styles.statusCancelledDot
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        isCancelled && styles.statusCancelledText
                      ]}
                    >
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </Text>
                  </View>

                  <Text style={styles.doctorName}>{item.doctorName}</Text>
                  <Text style={styles.specialtyText}>
                    {item.specialty || item.departmentName}
                  </Text>

                  <View style={styles.timeLocationRow}>
                    <Feather name="clock" size={13} color={colors.inkMuted} style={{ marginRight: 5 }} />
                    <Text style={styles.timeLocationText}>
                      {formatTimeRange(item.startsAt, item.endsAt)} · North Wing
                    </Text>
                  </View>
                </View>

                <Feather name="chevron-right" size={22} color={colors.ink} />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            activeScope === 'upcoming' ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Book another appointment"
                style={styles.actionCard}
                onPress={() => navigation.navigate('BookTab')}
                activeOpacity={0.88}
              >
                <View style={styles.actionIconCircle}>
                  <Feather name="plus" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Book another appointment</Text>
                  <Text style={styles.actionSubtitle}>Find a doctor and available time</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.brandBlue} />
              </TouchableOpacity>
            ) : null
          }
        />
      </ScreenState>
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
    paddingBottom: 14
  },
  plusWrapper: {
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4
  },
  searchIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },

  searchBarWrapper: {
    paddingHorizontal: 18,
    marginBottom: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink
  },

  // Segmented Pill
  segmentContainer: {
    paddingHorizontal: 18,
    marginBottom: 16
  },
  segmentTrack: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A2540',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    flexDirection: 'row',
    padding: 4
  },
  segmentPill: {
    flex: 1,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  segmentPillActive: {
    backgroundColor: colors.brandBlue
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8'
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  // List
  skeletonWrap: {
    paddingHorizontal: 18,
    paddingTop: 8
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 110 // Clearance for floating navigation dock
  },
  listHeader: {
    marginBottom: 12
  },
  countEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2
  },

  // Appointment Card: Pure White with Refined Border
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12
  },
  dateBlock: {
    width: 64,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brandBlueDark,
    lineHeight: 24
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandBlue,
    letterSpacing: 0.5
  },
  detailsCol: {
    flex: 1
  },
  statusPill: {
    backgroundColor: colors.chartreuse,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  statusCancelledPill: {
    backgroundColor: colors.coralLight
  },
  statusNeutralPill: {
    backgroundColor: colors.canvas
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginRight: 5
  },
  statusCancelledDot: {
    backgroundColor: colors.error
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink
  },
  statusCancelledText: {
    color: colors.error
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },
  specialtyText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  },
  timeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  timeLocationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.inkMuted
  },

  // Action Card (Soft Medical Blue)
  actionCard: {
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 6,
    marginBottom: 20
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  actionTextWrap: {
    flex: 1
  },
  actionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.foundation,
    letterSpacing: -0.2
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 2
  }
});
