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
        <Feather name="cloud" size={14} color={colors.ink} />
      </View>
      <ActivityIndicator size="small" color={colors.ink} style={styles.spinner} />
      <Text style={styles.text}>
        Server is waking up (Render cold-start)... Please hold on.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.chartreuse,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.ink
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.ink,
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
    color: colors.ink
  }
});
