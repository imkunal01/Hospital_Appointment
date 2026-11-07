import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Button } from './Button';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenStateProps {
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenState: React.FC<ScreenStateProps> = ({
  loading = false,
  loadingMessage = 'Loading hospital records...',
  error = null,
  onRetry,
  empty = false,
  emptyMessage = 'No records found.',
  children,
  style
}) => {
  // 1. Loading State
  if (loading) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={loadingMessage}
        style={[styles.centerContainer, style]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  // 2. Error (+ Retry) State
  if (error) {
    return (
      <View
        accessibilityRole="alert"
        accessibilityLabel={`Error: ${error}`}
        style={[styles.centerContainer, style]}
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <Button
            title="Try Again"
            onPress={onRetry}
            variant="outline"
            accessibilityLabel="Retry loading data"
            style={styles.retryButton}
          />
        )}
      </View>
    );
  }

  // 3. Empty State
  if (empty) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={emptyMessage}
        style={[styles.centerContainer, style]}
      >
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Nothing to Display</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        {onRetry && (
          <Button
            title="Refresh"
            onPress={onRetry}
            variant="secondary"
            accessibilityLabel="Refresh list"
            style={styles.retryButton}
          />
        )}
      </View>
    );
  }

  // 4. Normal Content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.sm
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20
  },
  retryButton: {
    minWidth: 140
  }
});

