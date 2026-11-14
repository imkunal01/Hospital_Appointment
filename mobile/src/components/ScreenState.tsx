import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../theme/colors';

interface ScreenStateProps {
  loading?: boolean;
  loadingMessage?: string;
  skeleton?: React.ReactNode;
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
  skeleton,
  error = null,
  onRetry,
  empty = false,
  emptyMessage = 'No records found.',
  children,
  style
}) => {
  // 1. Loading State
  if (loading) {
    if (skeleton) {
      return (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={loadingMessage}
          style={style}
        >
          {skeleton}
        </View>
      );
    }
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={loadingMessage}
        style={[styles.centerContainer, style]}
      >
        <View style={styles.loadingCircle}>
          <ActivityIndicator size="large" color={colors.brandBlue} />
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
          <Feather name="alert-circle" size={30} color={colors.coralDark} />
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
          <MaterialCommunityIcons name="clipboard-text-search-outline" size={32} color={colors.brandBlue} />
        </View>
        <Text style={styles.emptyTitle}>No Records Available</Text>
        <Text style={styles.errorMessage}>{emptyMessage}</Text>
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkMuted,
    textAlign: 'center'
  },
  errorIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 300
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandBlueLight,
    borderWidth: 1.5,
    borderColor: colors.brandBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center'
  },
  retryButton: {
    minWidth: 160
  }
});
