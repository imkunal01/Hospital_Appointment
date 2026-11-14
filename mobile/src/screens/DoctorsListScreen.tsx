import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useDoctors } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { DoctorAvatar } from '../components/DoctorAvatar';
import { SkeletonCard } from '../components/SkeletonCard';
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
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const specialties = useMemo(() => {
    if (!doctors) return ['All'];
    const specSet = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) specSet.add(d.specialty);
    });
    return ['All', ...Array.from(specSet)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.departmentName.toLowerCase().includes(q);

      const matchesSpecialty =
        selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

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
        skeleton={
          <View style={styles.skeletonWrap}>
            <SkeletonCard type="doctor" />
            <SkeletonCard type="doctor" />
            <SkeletonCard type="doctor" />
          </View>
        }
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

              {/* Specialty Filter Chips */}
              {specialties.length > 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.specialtyChipsRow}
                >
                  {specialties.map((spec) => {
                    const isChipActive = selectedSpecialty === spec;
                    return (
                      <TouchableOpacity
                        key={spec}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${spec}`}
                        accessibilityState={{ selected: isChipActive }}
                        style={[
                          styles.specialtyChip,
                          isChipActive && styles.specialtyChipActive
                        ]}
                        onPress={() => setSelectedSpecialty(spec)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.specialtyChipText,
                            isChipActive && styles.specialtyChipTextActive
                          ]}
                        >
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const isSelected = currentSelectedDoctor?.id === item.id;
            const exp = getDoctorExperience(item.name);

            return (
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityLabel={`Select Dr. ${item.name}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.doctorCard,
                  isSelected ? styles.doctorCardActive : styles.doctorCardInactive
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
                  <View style={styles.doctorMetaRow}>
                    <Text style={styles.experienceText}>{exp}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Ionicons name="location-outline" size={12} color={colors.inkMuted} style={{ marginRight: 2 }} />
                    <Text style={styles.locationTagText}>Wing A</Text>
                  </View>
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
              <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: 6 }} />
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
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
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
  specialtyChipsRow: {
    paddingTop: 12,
    gap: 8,
    paddingRight: 10
  },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  specialtyChipActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  specialtyChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.inkMuted
  },
  specialtyChipTextActive: {
    color: '#FFFFFF'
  },
  skeletonWrap: {
    paddingHorizontal: 18,
    paddingTop: 16
  },

  // List & Cards
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120
  },
  doctorCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  doctorCardActive: {
    backgroundColor: colors.brandBlueLight,
    borderWidth: 2,
    borderColor: colors.brandBlue
  },
  doctorCardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border
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
    backgroundColor: colors.success,
    marginRight: 6
  },
  availText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.successText
  },
  doctorName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  },
  doctorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  experienceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.inkSubtle
  },
  metaDot: {
    marginHorizontal: 5,
    color: colors.inkSubtle,
    fontSize: 11
  },
  locationTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkMuted
  },

  // Radio button
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  radioCircleActive: {
    borderColor: colors.brandBlue,
    borderWidth: 2
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandBlue
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    zIndex: 100,
    elevation: 8
  },
  continueButton: {
    backgroundColor: colors.foundation,
    borderRadius: 18,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.foundation,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4
  },
  continueButtonText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginRight: 6
  }
});
