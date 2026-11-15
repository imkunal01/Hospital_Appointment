import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { subscribeToWakingUp } from '../api/client';
import { ClinicalProgressBar } from './ClinicalProgressBar';

export const WakingUpBanner: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToWakingUp((connecting) => {
      if (connecting) {
        setVisible(true);
        setIsConnecting(true);
      } else {
        setIsConnecting(false);
      }
    });
    return unsubscribe;
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.bannerWrapper}>
      <ClinicalProgressBar
        active={isConnecting}
        completed={!isConnecting}
        onComplete={() => setVisible(false)}
        variant="banner"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    width: '100%',
    zIndex: 999
  }
});
