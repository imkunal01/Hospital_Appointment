import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  subscribeActiveToast,
  dismissToast,
  AppNotification
} from '../notifications/notificationStore';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface InAppNotificationBannerProps {
  onNavigateTab?: (tabName: string) => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  onNavigateTab
}) => {
  const insets = useSafeInsets();
  const [toast, setToast] = useState<AppNotification | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const dismissTimerRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeActiveToast((active) => {
      if (active) {
        setToast(active);
        // Clear any previous timer
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

        // Slide down
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9
        }).start();

        // Auto dismiss after 5.5 seconds
        dismissTimerRef.current = setTimeout(() => {
          handleDismiss();
        }, 5500);
      } else {
        handleDismiss();
      }
    });

    return () => {
      unsubscribe();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      setToast(null);
      dismissToast();
    });
  };

  const handlePress = () => {
    if (toast?.actionTab && onNavigateTab) {
      onNavigateTab(toast.actionTab);
    }
    handleDismiss();
  };

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'APPOINTMENT':
        return <Feather name="check-circle" size={20} color="#16A34A" />;
      case 'REMINDER':
        return <Feather name="clock" size={20} color="#D97706" />;
      case 'HEALTH_TIP':
        return <Ionicons name="heart-circle" size={24} color="#E11D48" />;
      case 'DOCTOR_TIP':
        return <MaterialCommunityIcons name="stethoscope" size={22} color={colors.brandBlue} />;
      default:
        return <Feather name="bell" size={20} color={colors.brandBlue} />;
    }
  };

  const getBadgeBg = () => {
    switch (toast.type) {
      case 'APPOINTMENT':
        return '#DCFCE7';
      case 'REMINDER':
        return '#FEF3C7';
      case 'HEALTH_TIP':
        return '#FFE4E6';
      case 'DOCTOR_TIP':
        return '#EFF6FF';
      default:
        return '#EFF6FF';
    }
  };

  const topOffset = Math.max(insets.top, Platform.OS === 'ios' ? 24 : 16) + 6;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Notification: ${toast.title}. ${toast.message}`}
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        <View style={[styles.iconWrap, { backgroundColor: getBadgeBg() }]}>
          {getIcon()}
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryEyebrow}>
              {toast.type.replace('_', ' ')}
            </Text>
            <Text style={styles.timeText}>Just now</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={styles.closeBtn}
          onPress={handleDismiss}
        >
          <Feather name="x" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 10
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  textWrap: {
    flex: 1,
    marginRight: 8
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  categoryEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8'
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.2
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
