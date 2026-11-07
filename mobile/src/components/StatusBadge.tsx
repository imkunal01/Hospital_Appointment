import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors.js';
import { spacing, borderRadius } from '../theme/spacing.js';

interface StatusBadgeProps {
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          icon: '✓',
          label: 'CONFIRMED',
          bg: colors.successLight,
          textColor: colors.successText,
          borderColor: colors.success
        };
      case 'CANCELLED':
        return {
          icon: '✕',
          label: 'CANCELLED',
          bg: colors.errorLight,
          textColor: colors.errorText,
          borderColor: colors.error
        };
      case 'COMPLETED':
        return {
          icon: '●',
          label: 'COMPLETED',
          bg: colors.primaryLight,
          textColor: colors.primaryDark,
          borderColor: colors.primary
        };
      default:
        return {
          icon: '•',
          label: status,
          bg: colors.borderLight,
          textColor: colors.textSecondary,
          borderColor: colors.border
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.borderColor },
        style
      ]}
    >
      <Text style={[styles.icon, { color: config.textColor }]}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  icon: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
