import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { useDepartments } from '../hooks/useCatalog';
import { ScreenState } from '../components/ScreenState';
import { Department } from '../api/types';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface DepartmentsScreenProps {
  navigation: any;
}

export const DepartmentsScreen: React.FC<DepartmentsScreenProps> = ({ navigation }) => {
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useDepartments();

  const handleSelectDepartment = (dept?: Department) => {
    navigation.navigate('DoctorsList', {
      departmentId: dept?.id,
      departmentName: dept?.name || 'All Specialties'
    });
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
          data={departments}
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
              <Text style={styles.title}>Medical Specialties</Text>
              <Text style={styles.subtitle}>Select a department to view available physicians</Text>
              
              {/* Quick option to browse all doctors without filter */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Browse All Specialists"
                style={styles.allDoctorsCard}
                onPress={() => handleSelectDepartment(undefined)}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.deptIcon}>🩺</Text>
                </View>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>All Specialists</Text>
                  <Text style={styles.deptSubtitle}>Browse all hospital doctors</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.name} department`}
              style={styles.departmentCard}
              onPress={() => handleSelectDepartment(item)}
            >
              <View style={styles.deptInfo}>
                <Text style={styles.deptName}>{item.name}</Text>
                <Text style={styles.deptSubtitle}>Consultations & follow-ups</Text>
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
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  allDoctorsCard: {
    minHeight: spacing.minTouchTarget, // 48dp minimum touch target
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30'
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  deptIcon: {
    fontSize: 20
  },
  departmentCard: {
    minHeight: spacing.minTouchTarget, // 48dp minimum touch target
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  deptInfo: {
    flex: 1
  },
  deptName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  deptSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
    marginLeft: spacing.sm
  }
});

