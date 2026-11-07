import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';
import { spacing } from '../theme/spacing.js';

export const AppointmentsTabPlaceholder: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📅</Text>
      <Text style={styles.title}>My Appointments</Text>
      <Text style={styles.subtitle}>
        Full appointments management (Upcoming/Past tabs, pull-to-refresh, reschedule, cancel, and report metadata) will be loaded here.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  }
});
