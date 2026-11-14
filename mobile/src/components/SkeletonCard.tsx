import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonCardProps {
  type?: 'doctor' | 'appointment' | 'generic';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ type = 'doctor' }) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true
        })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  if (type === 'appointment') {
    return (
      <View
        style={styles.cardContainer}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading appointment details..."
      >
        <View style={styles.leftAccentStripe} />
        <Animated.View style={[styles.skeletonDateBox, { opacity: pulseAnim }]} />
        <View style={styles.contentWrap}>
          <Animated.View style={[styles.skeletonPill, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonLineLong, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonLineShort, { opacity: pulseAnim }]} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.cardContainer}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading specialist details..."
    >
      <Animated.View style={[styles.skeletonAvatar, { opacity: pulseAnim }]} />
      <View style={styles.contentWrap}>
        <Animated.View style={[styles.skeletonPill, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonLineLong, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonLineShort, { opacity: pulseAnim }]} />
      </View>
      <Animated.View style={[styles.skeletonRadio, { opacity: pulseAnim }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#DBEAFE',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20
  },
  skeletonAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    marginRight: 14
  },
  skeletonDateBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginLeft: 6,
    marginRight: 14
  },
  contentWrap: {
    flex: 1,
    gap: 8
  },
  skeletonPill: {
    width: 80,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0'
  },
  skeletonLineLong: {
    width: '75%',
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0'
  },
  skeletonLineShort: {
    width: '45%',
    height: 13,
    borderRadius: 5,
    backgroundColor: '#E2E8F0'
  },
  skeletonRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginLeft: 10
  }
});

