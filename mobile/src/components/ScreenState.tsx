import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../theme/colors';

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
        <View style={styles.loadingCircle}>
          <ActivityIndicator size="large" color={colors.foundation} />
        </View>
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
        <View style={styles.errorIconBadge}>
          <Feather name="alert-circle" size={32} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <Button
            title="Try Again"
            onPress={onRetry}
            variant="primary"
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
        <View style={styles.emptyIconBadge}>
          <MaterialCommunityIcons name="clipboard-text-search-outline" size={36} color={colors.ink} />
        </View>
        <Text style={styles.emptyTitle}>No Records Available</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        {onRetry && (
          <Button
            title="Refresh"
            onPress={onRetry}
            variant="outline"
            accessibilityLabel="Refresh current view"
            style={styles.retryButton}
          />
        )}
      </View>
    );
  }

  // 4. Content State
  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 280
  },
  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.chartreuse,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  loadingText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center'
  },
  errorIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.coralLight,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.error,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 300
  },
  emptyIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.lilacLight,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center'
  },
  emptyMessage: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 300
  },
  retryButton: {
    minWidth: 160
  }
});
