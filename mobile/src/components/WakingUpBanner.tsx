import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { subscribeToWakingUp } from '../api/client';
import { colors } from '../theme/colors';

export const WakingUpBanner: React.FC = () => {
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToWakingUp(setIsWakingUp);
    return unsubscribe;
  }, []);

  if (!isWakingUp) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="Server is waking up. Please hold on."
      style={styles.banner}
    >
      <View style={styles.iconCircle}>
        <Feather name="cloud" size={14} color={colors.brandBlue} />
      </View>
      <ActivityIndicator size="small" color={colors.brandBlue} style={styles.spinner} />
      <Text style={styles.text}>
        Connecting to care servers... Please hold on.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brandBlueLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.brandBlueBorder
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  spinner: {
    marginRight: 8
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlueDark
  }
});
