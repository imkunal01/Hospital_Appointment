import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
  iconName
}) => {
  const isInteractive = !disabled && !loading;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.chartreuse : colors.ink}
        />
      );
    }

    const getTextColorStyle = () => {
      if (!isInteractive) return styles.disabledText;
      switch (variant) {
        case 'secondary':
          return styles.secondaryText;
        case 'danger':
          return styles.dangerText;
        case 'outline':
          return styles.outlineText;
        case 'primary':
        default:
          return styles.primaryText;
      }
    };

    return (
      <View style={styles.contentRow}>
        <Text style={[styles.baseText, getTextColorStyle(), textStyle]}>
          {title}
        </Text>
        {iconName ? (
          <Feather
            name={iconName as any}
            size={18}
            color={variant === 'primary' ? colors.chartreuse : colors.ink}
            style={styles.icon}
          />
        ) : null}
      </View>
    );
  };

  const getContainerStyle = () => {
    if (!isInteractive) return styles.disabledContainer;

    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive }}
      activeOpacity={0.85}
      disabled={!isInteractive}
      onPress={onPress}
      style={[styles.baseContainer, getContainerStyle(), style]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    minHeight: spacing.minTouchTarget,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  baseText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  icon: {
    marginLeft: 8
  },

  // Primary: Deep ink-green with coral tactile offset shadow
  primaryContainer: {
    backgroundColor: colors.foundation,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  primaryText: {
    color: colors.chartreuse,
    fontWeight: '900'
  },

  // Secondary: Chartreuse lime with dark tactile offset shadow
  secondaryContainer: {
    backgroundColor: colors.chartreuse,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: '900'
  },

  // Danger: Pastel coral with dark tactile shadow
  dangerContainer: {
    backgroundColor: colors.coralLight,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  dangerText: {
    color: colors.ink,
    fontWeight: '900'
  },

  // Outline: Off-white canvas with dark shadow
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  outlineText: {
    color: colors.ink,
    fontWeight: '800'
  },

  // Disabled
  disabledContainer: {
    backgroundColor: '#E2DDD2',
    borderColor: '#B8B2A6',
    shadowOpacity: 0,
    elevation: 0
  },
  disabledText: {
    color: '#8A9E97',
    fontWeight: '700'
  }
});
