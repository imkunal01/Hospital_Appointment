import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

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
          borderColor: colors.success
        };
      case 'CANCELLED':
        return {
          iconName: 'close-circle' as const,
          label: 'CANCELLED',
          bg: colors.coralLight,
          textColor: colors.coralDark,
          borderColor: '#FCA5A5'
        };
      case 'COMPLETED':
        return {
          iconName: 'checkmark-done-circle' as const,
          label: 'COMPLETED',
          bg: colors.brandBlueLight,
          textColor: colors.brandBlueDark,
          borderColor: colors.brandBlueBorder
        };
      default:
        return {
          iconName: 'ellipse' as const,
          label: status,
          bg: '#F8FAFC',
          textColor: colors.ink,
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
      <Ionicons
        name={config.iconName}
        size={13}
        color={config.textColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  icon: {
    marginRight: 4
  },
  text: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4
  }
});
