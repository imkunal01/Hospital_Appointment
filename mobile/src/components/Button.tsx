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
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

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

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : '#FFFFFF'}
        />
      );
    }

    const getTextColorStyle = () => {
      if (!isInteractive) return styles.disabledText;
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
      <Text style={[styles.baseText, getTextColorStyle(), textStyle]}>
        {title}
      </Text>
    );
  };

  // If primary and interactive, render with rich clinical gradient fill
  if (variant === 'primary' && isInteractive) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: !isInteractive }}
        activeOpacity={0.82}
        disabled={!isInteractive}
        onPress={onPress}
        style={[styles.gradientTouchableWrapper, style]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Non-gradient or disabled primary
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
        return styles.primaryFallbackContainer;
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
        style
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientTouchableWrapper: {
    minHeight: spacing.minTouchTarget,
    minWidth: spacing.minTouchTarget,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4
  },
  gradientContainer: {
    flex: 1,
    minHeight: spacing.minTouchTarget,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  baseContainer: {
    minHeight: spacing.minTouchTarget,
    minWidth: spacing.minTouchTarget,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  primaryFallbackContainer: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3
  },
  secondaryContainer: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border
  },
  dangerContainer: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
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
    fontSize: 15.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2
  },
  primaryText: {
    color: '#FFFFFF'
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
