import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDoctors } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { Doctor } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { getDepartmentTheme } from '../theme/departmentThemes';

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
  const departmentId = route.params?.departmentId;
  const departmentName = route.params?.departmentName || 'All Doctors';

  const { data: doctors, isLoading, isError, error, refetch, isRefetching } = useDoctors(departmentId);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSelectDoctor = (doctor: Doctor) => {
    navigation.navigate('DoctorDetail', { doctor });
  };

  return (
    <View style={styles.container}>
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
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Department Overview Banner */}
              <View style={styles.deptBanner}>
                <View style={styles.deptBannerTextWrap}>
                  <Text style={styles.title}>{departmentName}</Text>
                  <Text style={styles.subtitle}>
                    {doctors?.length || 0} specialist{doctors?.length === 1 ? '' : 's'} available for consultation
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{doctors?.length || 0} ACTIVE</Text>
                </View>
              </View>

              {/* Practo-Style Doctor Search Field */}
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color={colors.primary} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search by doctor name or specialty..."
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
                    accessibilityLabel="Clear doctor search"
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchBtn}
                  >
                    <Feather name="x" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const deptTheme = getDepartmentTheme(item.departmentName);

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Select doctor ${item.name}, ${item.specialty}`}
                style={styles.doctorCard}
                onPress={() => handleSelectDoctor(item)}
                activeOpacity={0.8}
              >
                {/* Status / Specialty Left Accent Bar */}
                <View style={[styles.cardLeftAccent, { backgroundColor: deptTheme.textColor }]} />

                <View style={styles.cardInner}>
                  {/* Doctor Main Info Row */}
                  <View style={styles.topInfoRow}>
                    {/* Gradient Avatar with Verified Indicator */}
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradientCircle}
                      >
                        <Text style={styles.avatarText}>
                          {item.name
                            .replace('Dr. ', '')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </Text>
                      </LinearGradient>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      </View>
                    </View>

                    {/* Name, Specialty & Department */}
                    <View style={styles.doctorDetails}>
                      <View style={styles.nameRow}>
                        <Text style={styles.doctorName}>{item.name}</Text>
                      </View>
                      <Text style={styles.doctorSpecialty}>{item.specialty}</Text>

                      <View style={styles.badgeRow}>
                        <View style={[styles.deptBadge, { backgroundColor: deptTheme.bg }]}>
                          <Text style={[styles.deptBadgeText, { color: deptTheme.textColor }]}>
                            {item.departmentName}
                          </Text>
                        </View>
                        <View style={styles.experienceBadge}>
                          <MaterialCommunityIcons name="shield-check-outline" size={12} color={colors.secondary} />
                          <Text style={styles.experienceBadgeText}>Verified</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Bio Snippet */}
                  {item.bio ? (
                    <View style={styles.bioContainer}>
                      <Text style={styles.bioSnippet} numberOfLines={2}>
                        {item.bio}
                      </Text>
                    </View>
                  ) : null}

                  {/* Practo-Style Card Footer Action Bar */}
                  <View style={styles.cardFooter}>
                    <View style={styles.consultTypeWrap}>
                      <Feather name="clock" size={13} color={colors.secondary} />
                      <Text style={styles.consultTypeText}>In-Hospital Consult</Text>
                    </View>

                    {/* Gradient Action Button Pill */}
                    <LinearGradient
                      colors={[colors.gradientStart, colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bookActionPill}
                    >
                      <Text style={styles.bookActionText}>Book Consult</Text>
                      <Feather name="chevron-right" size={14} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptySearchContainer}>
                <Feather name="user-x" size={36} color={colors.textMuted} />
                <Text style={styles.emptySearchTitle}>No doctors found</Text>
                <Text style={styles.emptySearchSubtitle}>
                  No specialist matched "{searchQuery}". Try searching for another name or specialty.
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
    padding: spacing.md,
    paddingBottom: 110 // Safe clearance for floating pill nav
  },
  header: {
    marginBottom: spacing.md
  },
  deptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  deptBannerTextWrap: {
    flex: 1,
    marginRight: spacing.sm
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    height: 50,
    marginTop: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
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
  doctorCard: {
    minHeight: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  cardLeftAccent: {
    width: 5
  },
  cardInner: {
    flex: 1,
    padding: spacing.md
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14
  },
  avatarGradientCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    elevation: 3
  },
  doctorDetails: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  doctorSpecialty: {
    fontSize: 13.5,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 6
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.sm
  },
  experienceBadgeText: {
    fontSize: 11,
    color: colors.secondaryDark,
    fontWeight: '700',
    marginLeft: 3
  },
  bioContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  bioSnippet: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  consultTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  consultTypeText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '700',
    marginLeft: 5
  },
  bookActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2
  },
  bookActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 4
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
