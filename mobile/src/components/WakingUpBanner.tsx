import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { subscribeToWakingUp } from '../api/client.js';
import { colors } from '../theme/colors.js';
import { spacing } from '../theme/spacing.js';

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
    borderBottomColor: colors.warning
  },
  spinner: {
    marginRight: spacing.sm
  },
  text: {
    fontSize: 13,
    color: colors.warningText,
    fontWeight: '600'
  }
});

