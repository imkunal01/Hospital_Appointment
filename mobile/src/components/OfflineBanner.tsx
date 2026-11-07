import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../hooks/useNetwork';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetwork();

  if (!isOffline) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="You are currently offline. Viewing cached data only. All bookings and modifications are disabled."
      style={styles.banner}
    >
      <Text style={styles.icon}>📡</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>You are currently Offline</Text>
        <Text style={styles.subtitle}>
          Read-only cache mode. Booking, rescheduling, and cancellations are disabled until reconnected.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.errorLight,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.errorText
  },
  subtitle: {
    fontSize: 11,
    color: colors.errorText,
    marginTop: 1,
    lineHeight: 14
  }
});

