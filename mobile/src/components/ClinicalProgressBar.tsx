import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface ClinicalProgressBarProps {
  /**
   * Whether the connection or operation is in-flight.
   * When true, progress steadily advances toward 94% over ~16-18s (matching cold-start timing).
   * When false (completed), progress smoothly surges from current % to 100% in 280ms.
   */
  active?: boolean;
  /**
   * Explicit completion flag. Overrides active to trigger 100% surge.
   */
  completed?: boolean;
  /**
   * Callback fired once the bar reaches 100% and finishes its completion animation.
   */
  onComplete?: () => void;
  /**
   * Custom headline for card variant. Defaults to "Connecting to Clinical Network".
   */
  title?: string;
  /**
   * Custom subtitle / step label overriding the automatic clinical phase text.
   */
  subtitle?: string;
  /**
   * Visual layout variant:
   * - 'inline': Compact bar + status row for embedding directly into cards/forms
   * - 'card': Elevated clinical card with shield badge, dynamic phase text, and percentage
   * - 'banner': Slim top banner with progress line and status pill
   */
  variant?: 'inline' | 'card' | 'banner';
  style?: ViewStyle;
}

export const ClinicalProgressBar: React.FC<ClinicalProgressBarProps> = ({
  active = true,
  completed = false,
  onComplete,
  title = 'Connecting to Clinical Portal',
  subtitle,
  variant = 'card',
  style
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const sequenceAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const isFinishedRef = useRef(false);

  // Sync listener to track numerical percent from Animated.Value
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      const rounded = Math.min(100, Math.max(0, Math.round(value)));
      setPercent(rounded);
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  // Handle active vs completed animations
  useEffect(() => {
    if (completed || (!active && percent > 0 && !isFinishedRef.current)) {
      // Server responded! Stop incremental sequence and whoosh to 100%
      if (sequenceAnimRef.current) {
        sequenceAnimRef.current.stop();
      }
      isFinishedRef.current = true;

      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }).start(() => {
        if (onComplete) {
          setTimeout(onComplete, 220);
        }
      });
      return;
    }

    if (active && !isFinishedRef.current) {
      // Operation started / in-flight: steadily fill across 16-18s (matching cold-start window)
      // If server is active and responds in < 1s, it interrupts here and whooshes to 100%
      const step1 = Animated.timing(progressAnim, {
        toValue: 28,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      });
      const step2 = Animated.timing(progressAnim, {
        toValue: 56,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: false
      });
      const step3 = Animated.timing(progressAnim, {
        toValue: 76,
        duration: 4400,
        easing: Easing.linear,
        useNativeDriver: false
      });
      const step4 = Animated.timing(progressAnim, {
        toValue: 92,
        duration: 5200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false
      });
      const step5 = Animated.timing(progressAnim, {
        toValue: 97,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false
      });

      const sequence = Animated.sequence([step1, step2, step3, step4, step5]);
      sequenceAnimRef.current = sequence;
      sequence.start();

      return () => {
        sequence.stop();
      };
    }
  }, [active, completed]);

  // Dynamic clinical status step text
  const currentStatusText = useMemo(() => {
    if (subtitle) return subtitle;
    if (percent >= 100) return 'Secure connection established';
    if (percent >= 88) return 'Finalizing encrypted handshake...';
    if (percent >= 72) return 'Synchronizing specialist schedules...';
    if (percent >= 52) return 'Verifying clinical certificates...';
    if (percent >= 24) return 'Connecting to hospital care network...';
    return 'Initializing secure clinical session...';
  }, [percent, subtitle]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  // Variant: Top Banner
  if (variant === 'banner') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Connecting to portal: ${percent}%`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={[styles.bannerContainer, style]}
      >
        {/* Progress track line */}
        <View style={styles.bannerTrack}>
          <Animated.View style={[styles.bannerFill, { width: widthInterpolation }]} />
        </View>

        {/* Status text pill */}
        <View style={styles.bannerContentRow}>
          <View style={styles.bannerIconDot}>
            {percent >= 100 ? (
              <Feather name="check" size={12} color="#16A34A" />
            ) : (
              <Ionicons name="pulse" size={13} color={colors.brandBlue} />
            )}
          </View>
          <Text style={styles.bannerStatusText} numberOfLines={1}>
            {currentStatusText}
          </Text>
          <View style={styles.bannerPercentBadge}>
            <Text style={styles.bannerPercentText}>{percent}%</Text>
          </View>
        </View>
      </View>
    );
  }

  // Variant: Inline
  if (variant === 'inline') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Loading: ${percent}%`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={[styles.inlineContainer, style]}
      >
        <View style={styles.inlineHeaderRow}>
          <Text style={styles.inlineStatusText}>{currentStatusText}</Text>
          <Text style={styles.inlinePercentText}>{percent}%</Text>
        </View>
        <View style={styles.inlineTrack}>
          <Animated.View style={[styles.inlineFill, { width: widthInterpolation }]} />
        </View>
      </View>
    );
  }

  // Variant: Card (Default)
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${title}: ${percent}%`}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.cardContainer, style]}
    >
      {/* Top Card Header */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.shieldIconWrap}>
          {percent >= 100 ? (
            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
          ) : (
            <Ionicons name="shield-outline" size={20} color={colors.brandBlue} />
          )}
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {currentStatusText}
          </Text>
        </View>
        <View style={styles.cardPercentBox}>
          <Text style={styles.cardPercentText}>{percent}%</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthInterpolation }]} />
      </View>

      {/* Trust Footer */}
      <View style={styles.trustFooterRow}>
        <Feather name="lock" size={11} color="#64748B" style={{ marginRight: 4 }} />
        <Text style={styles.trustFooterText}>End-to-End Encrypted Clinical Gateway</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Card Variant
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  shieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.2
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },
  cardPercentBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  cardPercentText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.brandBlue
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brandBlue,
    borderRadius: 4
  },
  trustFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  trustFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8'
  },

  // Banner Variant
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#DBEAFE',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3
  },
  bannerTrack: {
    height: 3.5,
    backgroundColor: '#EFF6FF',
    width: '100%',
    overflow: 'hidden'
  },
  bannerFill: {
    height: '100%',
    backgroundColor: colors.brandBlue
  },
  bannerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  bannerIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  bannerStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0A2540'
  },
  bannerPercentBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginLeft: 8
  },
  bannerPercentText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.brandBlue
  },

  // Inline Variant
  inlineContainer: {
    width: '100%',
    paddingVertical: 4
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  inlineStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  inlinePercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandBlue
  },
  inlineTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden'
  },
  inlineFill: {
    height: '100%',
    backgroundColor: colors.brandBlue,
    borderRadius: 3
  }
});
