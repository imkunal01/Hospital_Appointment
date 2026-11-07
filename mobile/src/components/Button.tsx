import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors } from '../theme/colors.js';
import { spacing, borderRadius } from '../theme/spacing.js';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle
}) => {
  const isInteractive = !disabled && !loading;

  const getContainerStyle = () => {
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

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive }}
      activeOpacity={0.75}
      disabled={!isInteractive}
      onPress={onPress}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        !isInteractive && styles.disabledContainer,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.surface}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            getTextStyle(),
            !isInteractive && styles.disabledText,
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    minHeight: spacing.minTouchTarget, // Enforces 48dp minimum touch target
    minWidth: spacing.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  primaryContainer: {
    backgroundColor: colors.primary
  },
  secondaryContainer: {
    backgroundColor: colors.borderLight
  },
  dangerContainer: {
    backgroundColor: colors.error
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  disabledContainer: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled
  },
  baseText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  primaryText: {
    color: colors.surface
  },
  secondaryText: {
    color: colors.textPrimary
  },
  outlineText: {
    color: colors.primary
  },
  disabledText: {
    color: colors.disabledText
  }
});
