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
          color={variant === 'primary' ? '#FFFFFF' : colors.brandBlue}
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
            color={variant === 'primary' ? '#FFFFFF' : colors.brandBlue}
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
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
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

  // Primary: Deep midnight navy with crisp white text
  primaryContainer: {
    backgroundColor: colors.foundation,
    borderColor: colors.foundation,
    shadowColor: colors.foundation,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  // Secondary: Medical ice-blue with royal blue border & text
  secondaryContainer: {
    backgroundColor: colors.brandBlueLight,
    borderColor: colors.brandBlue,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  secondaryText: {
    color: colors.brandBlue,
    fontWeight: '800'
  },

  // Danger: Soft emergency red with alert text
  dangerContainer: {
    backgroundColor: colors.coralLight,
    borderColor: '#FCA5A5',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  dangerText: {
    color: colors.coralDark,
    fontWeight: '800'
  },

  // Outline: Crisp white with subtle border
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  outlineText: {
    color: colors.ink,
    fontWeight: '800'
  },

  // Disabled
  disabledContainer: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0
  },
  disabledText: {
    color: '#94A3B8',
    fontWeight: '700'
  }
});
