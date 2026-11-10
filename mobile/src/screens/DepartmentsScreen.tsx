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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDepartments } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { Department } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { getDepartmentTheme } from '../theme/departmentThemes';

interface DepartmentsScreenProps {
  navigation: any;
}

export const DepartmentsScreen: React.FC<DepartmentsScreenProps> = ({ navigation }) => {
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  const handleSelectDepartment = (dept?: Department) => {
    navigation.navigate('DoctorsList', {
      departmentId: dept?.id,
      departmentName: dept?.name || 'All Specialties'
    });
  };

  const renderDepartmentIcon = (deptName: string) => {
    const theme = getDepartmentTheme(deptName);
    if (theme.iconFamily === 'Ionicons') {
      return <Ionicons name={theme.iconName as any} size={26} color={theme.textColor} />;
    }
    return <MaterialCommunityIcons name={theme.iconName as any} size={26} color={theme.textColor} />;
  };

  return (
    <View style={styles.container}>
      <ScreenState
        loading={isLoading}
        loadingMessage="Loading hospital specialties..."
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
        empty={!isLoading && (!departments || departments.length === 0)}
        emptyMessage="No departments currently active."
      >
        <FlatList
          key="departments-grid-2"
          numColumns={2}
          data={filteredDepartments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Premium Gradient Hero Section */}
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}
              >
                {/* Decorative depth elements */}
                <View style={styles.heroCircleOuter} />
                <View style={styles.heroCircleInner} />

                {/* Hospital Accreditation Row */}
                <View style={styles.hospitalBrandPill}>
                  <MaterialCommunityIcons name="hospital-building" size={16} color="#FFFFFF" />
                  <Text style={styles.hospitalBrandText}>MediBook Multi-Specialty Hospital</Text>
                  <View style={styles.verifiedDot} />
                </View>

                <Text style={styles.heroTitle}>Find & Consult Expert Doctors</Text>
                <Text style={styles.heroSubtitle}>
                  Verified specialists, instant slot booking & hospital visit records
                </Text>

                {/* Practo-Style Elevated Search Bar */}
                <View style={styles.searchBar}>
                  <Feather name="search" size={18} color={colors.primary} style={styles.searchIcon} />
                  <TextInput
                    placeholder="Search specialties (e.g. Cardiology, Ortho)..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Clear specialty search"
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchBtn}
                    >
                      <Feather name="x" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>

              {/* Featured "Browse All Specialists" Banner Card */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Browse All Specialists"
                style={styles.allDoctorsCard}
                onPress={() => handleSelectDepartment(undefined)}
                activeOpacity={0.85}
              >
                <View style={styles.allDoctorsIconCircle}>
                  <MaterialCommunityIcons name="doctor" size={26} color={colors.primary} />
                </View>
                <View style={styles.allDoctorsInfo}>
                  <View style={styles.allDocTitleRow}>
                    <Text style={styles.allDoctorsTitle}>Browse All Specialists</Text>
                    <View style={styles.allDocPill}>
                      <Text style={styles.allDocPillText}>ALL CLINICS</Text>
                    </View>
                  </View>
                  <Text style={styles.allDoctorsSubtitle}>
                    Search across all active hospital physicians
                  </Text>
                </View>
                <View style={styles.allDocChevronCircle}>
                  <Feather name="arrow-right" size={18} color={colors.primary} />
                </View>
              </TouchableOpacity>

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionAccentBar} />
                <Text style={styles.sectionHeaderTitle}>
                  MEDICAL SPECIALTIES ({filteredDepartments.length})
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const theme = getDepartmentTheme(item.name);

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name} department`}
                style={[styles.departmentGridCard, { backgroundColor: theme.bg }]}
                onPress={() => handleSelectDepartment(item)}
                activeOpacity={0.8}
              >
                {/* Icon Badge */}
                <View style={styles.deptIconCircle}>
                  {renderDepartmentIcon(item.name)}
                </View>

                {/* Department Info */}
                <Text style={[styles.deptName, { color: theme.textColor }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.deptSubtext}>In-Hospital Visits</Text>

                {/* Bottom Action Pill */}
                <View style={styles.deptActionRow}>
                  <Text style={[styles.deptActionLabel, { color: theme.textColor }]}>
                    View Doctors
                  </Text>
                  <Feather name="arrow-right" size={13} color={theme.textColor} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptySearchContainer}>
                <Feather name="search" size={32} color={colors.textMuted} />
                <Text style={styles.emptySearchTitle}>No matching departments</Text>
                <Text style={styles.emptySearchSubtitle}>
                  No department matched "{searchQuery}". Try browsing all doctors.
                </Text>
              </View>
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
    backgroundColor: colors.background
  },
  listContent: {
    paddingBottom: 110
  },
  header: {
    marginBottom: spacing.sm
  },
  heroBanner: {
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  heroCircleOuter: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.10)'
  },
  heroCircleInner: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  hospitalBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: 12
  },
  hospitalBrandText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.3
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginLeft: 6
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 30
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
    fontWeight: '500'
  },
  clearSearchBtn: {
    padding: 6
  },
  allDoctorsCard: {
    minHeight: spacing.minTouchTarget,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#D7E5FA',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3
  },
  allDoctorsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  allDoctorsInfo: {
    flex: 1
  },
  allDocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  allDoctorsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  allDocPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6
  },
  allDocPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary
  },
  allDoctorsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  allDocChevronCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 8
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  departmentGridCard: {
    width: '48%',
    minHeight: 140,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  deptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  deptName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -0.2
  },
  deptSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: '500'
  },
  deptActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)'
  },
  deptActionLabel: {
    fontSize: 11,
    fontWeight: '800'
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.xl
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  emptySearchSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 19
  }
});
