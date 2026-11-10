import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  rightElement,
  ...rest
}) => {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, hasError && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
        {rightElement}
      </View>
      {hasError && (
        <Text
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.xs + 2
  },
  inputBox: {
    minHeight: 52, // Exceeds 48dp minimum touch target
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    height: '100%',
    minHeight: 48,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight + '20'
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '500'
  }
});
