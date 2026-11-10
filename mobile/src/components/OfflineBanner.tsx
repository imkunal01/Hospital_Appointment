import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
      <View style={styles.iconCircle}>
        <Feather name="wifi-off" size={16} color={colors.errorText} />
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.error + '40',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '30'
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.errorText
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.errorText,
    marginTop: 1,
    lineHeight: 15
  }
});
