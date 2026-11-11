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
import { useDoctors } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { DoctorAvatar } from '../components/DoctorAvatar';
import { Doctor } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useSafeInsets } from '../hooks/useSafeInsets';
import { getDoctorExperience } from '../utils/doctorImages';

interface DoctorsListScreenProps {
  route: {
    params?: {
      departmentId?: string;
      departmentName?: string;
    };
  };
  navigation: any;
}

export const DoctorsListScreen: React.FC<DoctorsListScreenProps> = ({ route, navigation }) => {
  const insets = useSafeInsets();
  const departmentId = route.params?.departmentId;
  const departmentName = route.params?.departmentName || 'General Medicine';

  const { data: doctors, isLoading, isError, error, refetch, isRefetching } = useDoctors(departmentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.departmentName.toLowerCase().includes(q)
    );
  }, [doctors, searchQuery]);

  // Set default selection to first doctor when loaded
  const currentSelectedDoctor = useMemo(() => {
    if (!filteredDoctors.length) return null;
    if (!selectedDoctorId) return filteredDoctors[0];
    return filteredDoctors.find((d) => d.id === selectedDoctorId) || filteredDoctors[0];
  }, [filteredDoctors, selectedDoctorId]);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
  };

  const handleContinue = () => {
    if (currentSelectedDoctor) {
      navigation.navigate('DoctorDetail', { doctor: currentSelectedDoctor });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Editorial Navigation Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 6 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('DoctorsTab', { screen: 'Departments' });
            }
          }}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Choose a doctor</Text>

        <View style={{ width: 44 }} />
      </View>

      {/* Stepper Progress Bar (Step 2 of 3) */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperLabelRow}>
          <Text style={styles.stepText}>STEP 2 OF 3</Text>
          <Text style={styles.stepName}>Doctor</Text>
        </View>
        <View style={styles.stepperTrack}>
          <View style={[styles.stepperFill, { width: '66%' }]} />
        </View>
      </View>

      <ScreenState
        loading={isLoading}
        loadingMessage={`Finding doctors in ${departmentName}...`}
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
        empty={!isLoading && (!doctors || doctors.length === 0)}
        emptyMessage={`No physicians found for ${departmentName}.`}
      >
        <FlatList
          data={filteredDoctors}
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
            <View style={styles.header}>
              <View style={styles.headingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.displayTitle}>Available doctors</Text>
                  <Text style={styles.subtitle}>
                    {departmentName} · Available today
                  </Text>
                </View>

                {/* Filter Pill */}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Filter specialists"
                  style={styles.filterButton}
                  onPress={() => {}}
                  activeOpacity={0.8}
                >
                  <Feather name="sliders" size={14} color={colors.ink} style={{ marginRight: 6 }} />
                  <Text style={styles.filterText}>Filter</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color={colors.ink} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search doctor by name or specialty..."
                  placeholderTextColor={colors.inkSubtle}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchBtn}
                  >
                    <Feather name="x" size={16} color={colors.ink} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isSelected = currentSelectedDoctor?.id === item.id;
            const exp = getDoctorExperience(item.name);
            // Alternate colors for editorial rhythm
            const unselectedBg = index % 2 === 0 ? colors.lilacLight : '#FFFFFF';

            return (
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityLabel={`Select Dr. ${item.name}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.doctorCard,
                  { backgroundColor: isSelected ? colors.chartreuse : unselectedBg }
                ]}
                onPress={() => handleSelectDoctor(item)}
                activeOpacity={0.88}
              >
                <DoctorAvatar name={item.name} size={68} style={styles.doctorAvatar} />

                <View style={styles.doctorDetails}>
                  <View style={styles.availabilityRow}>
                    <View style={styles.availDot} />
                    <Text style={styles.availText}>Available today</Text>
                  </View>
                  <Text style={styles.doctorName}>{item.name}</Text>
                  <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
                  <Text style={styles.experienceText}>{exp}</Text>
                </View>

                {/* Custom Radio Button */}
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={styles.trustBadgeRow}>
              <Ionicons name="checkmark-sharp" size={18} color={colors.foundation} style={{ marginRight: 6 }} />
              <Text style={styles.trustBadgeText}>All doctors are verified hospital staff.</Text>
            </View>
          }
        />
      </ScreenState>

      {/* Sticky Bottom Action Bar */}
      {currentSelectedDoctor && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue to date and time selection"
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.88}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Feather name="chevron-right" size={22} color={colors.chartreuse} />
          </TouchableOpacity>
        </View>
      )}
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

  // Header & Search
  header: {
    marginBottom: 14
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  displayTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 3
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chartreuse,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  filterText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink
  },
  clearSearchBtn: {
    padding: 6
  },

  // List & Cards
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120
  },
  doctorCard: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  doctorAvatar: {
    marginRight: 14
  },
  doctorDetails: {
    flex: 1
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.foundation,
    marginRight: 6
  },
  availText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.foundation
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  },
  experienceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.inkSubtle,
    marginTop: 2
  },

  // Radio button
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  radioCircleActive: {
    borderColor: colors.ink
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.ink
  },

  // Trust badge
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  trustBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.inkMuted
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
  continueButton: {
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
  continueButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.chartreuse,
    letterSpacing: -0.2,
    marginRight: 6
  }
});
