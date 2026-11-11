import React from 'react';
import { SafeAreaInsetsContext, EdgeInsets } from 'react-native-safe-area-context';

const DEFAULT_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * Safe insets hook that falls back to zero-insets if rendered outside SafeAreaProvider
 * (e.g. in isolated component tests).
 */
export function useSafeInsets(): EdgeInsets {
  const insets = React.useContext(SafeAreaInsetsContext);
  return insets ?? DEFAULT_INSETS;
}

