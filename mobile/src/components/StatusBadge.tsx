import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface StatusBadgeProps {
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          iconName: 'checkmark-circle' as const,
          label: 'CONFIRMED',
          bg: colors.successLight,
          textColor: colors.successText,
          borderColor: colors.success + '40'
        };
      case 'CANCELLED':
        return {
          iconName: 'close-circle' as const,
          label: 'CANCELLED',
          bg: colors.errorLight,
          textColor: colors.errorText,
          borderColor: colors.error + '40'
        };
      case 'COMPLETED':
        return {
          iconName: 'checkmark-done-circle' as const,
          label: 'COMPLETED',
          bg: colors.primaryLight,
          textColor: colors.primaryDark,
          borderColor: colors.primary + '40'
        };
      default:
        return {
          iconName: 'ellipse' as const,
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
      <Ionicons name={config.iconName} size={13} color={config.textColor} style={styles.icon} />
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  icon: {
    marginRight: 4
  },
  text: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6
  }
});
