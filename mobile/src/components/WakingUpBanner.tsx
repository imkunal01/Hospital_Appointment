import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { subscribeToWakingUp } from '../api/client';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

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
        <Feather name="cloud" size={14} color={colors.warningText} />
      </View>
      <ActivityIndicator size="small" color={colors.warningText} style={styles.spinner} />
      <Text style={styles.text}>
        Server is waking up (Render cold-start)... Please hold on.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '40'
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  spinner: {
    marginRight: spacing.sm
  },
  text: {
    fontSize: 12.5,
    color: colors.warningText,
    fontWeight: '700'
  }
});
