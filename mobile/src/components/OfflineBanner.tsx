import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetwork } from '../hooks/useNetwork';
import { colors } from '../theme/colors';

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
        <Feather name="wifi-off" size={16} color={colors.ink} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>You are currently Offline</Text>
        <Text style={styles.subtitle}>
          Read-only cache mode. Booking and modifications are disabled.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.peach,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 1
  }
});
