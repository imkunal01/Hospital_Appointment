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
import { spacing } from '../theme/spacing';

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
          placeholderTextColor={colors.inkSubtle}
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.2,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  inputBox: {
    minHeight: 54, // Exceeds 48dp minimum touch target
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  input: {
    flex: 1,
    height: '100%',
    minHeight: 48,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    paddingVertical: 0
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
    shadowColor: colors.error
  },
  errorText: {
    fontSize: 12.5,
    color: colors.error,
    marginTop: 5,
    fontWeight: '700'
  }
});
