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
        <Feather name="wifi-off" size={16} color={colors.warningText} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>You are currently Offline</Text>
          <View style={styles.cachedChip}>
            <Text style={styles.cachedChipText}>CACHED</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Read-only cache mode. Booking and modifications are disabled.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningLight,
    borderBottomWidth: 1.5,
    borderBottomColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cachedChip: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1
  },
  cachedChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.warningText,
    letterSpacing: 0.5
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.warningText
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 1
  }
});
