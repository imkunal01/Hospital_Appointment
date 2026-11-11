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
          bg: colors.chartreuse,
          textColor: colors.ink,
          borderColor: colors.ink
        };
      case 'CANCELLED':
        return {
          iconName: 'close-circle' as const,
          label: 'CANCELLED',
          bg: colors.coralLight,
          textColor: colors.error,
          borderColor: colors.error
        };
      case 'COMPLETED':
        return {
          iconName: 'checkmark-done-circle' as const,
          label: 'COMPLETED',
          bg: colors.lilac,
          textColor: colors.ink,
          borderColor: colors.ink
        };
      default:
        return {
          iconName: 'ellipse' as const,
          label: status,
          bg: '#FFFFFF',
          textColor: colors.ink,
          borderColor: colors.ink
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
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1.5,
    alignSelf: 'flex-start'
  },
  icon: {
    marginRight: 5
  },
  text: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4
  }
});
