import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { useDoctors } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { Doctor } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

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
          data={doctors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>{departmentName}</Text>
              <Text style={styles.subtitle}>
                {doctors?.length || 0} specialist{doctors?.length === 1 ? '' : 's'} available
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Select doctor ${item.name}, ${item.specialty}`}
              style={styles.doctorCard}
              onPress={() => handleSelectDoctor(item)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.name
                    .replace('Dr. ', '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>

              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>{item.name}</Text>
                <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.deptBadge}>{item.departmentName}</Text>
                </View>
                {item.bio ? (
                  <Text style={styles.bioSnippet} numberOfLines={2}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
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
    padding: spacing.md
  },
  header: {
    marginBottom: spacing.md
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  doctorCard: {
    minHeight: spacing.minTouchTarget, // 48dp touch target
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark
  },
  doctorDetails: {
    flex: 1
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.xs
  },
  deptBadge: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden'
  },
  bioSnippet: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 16
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
    marginLeft: spacing.sm
  }
});

