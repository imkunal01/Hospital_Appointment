import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  subscribeNotifications,
  markAsRead,
  markAllAsRead,
  triggerRandomHealthTip,
  AppNotification,
  NotificationType
} from '../notifications/notificationStore';
import { colors } from '../theme/colors';

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
  onNavigateTab
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | NotificationType>('ALL');

  useEffect(() => {
    const unsubscribe = subscribeNotifications(setNotifications);
    return unsubscribe;
  }, []);

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemPress = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab);
      onClose();
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Feather name="check-circle" size={18} color="#16A34A" />;
      case 'REMINDER':
        return <Feather name="clock" size={18} color="#D97706" />;
      case 'HEALTH_TIP':
        return <Ionicons name="heart" size={18} color="#E11D48" />;
      case 'DOCTOR_TIP':
        return <MaterialCommunityIcons name="stethoscope" size={18} color={colors.brandBlue} />;
      default:
        return <Feather name="bell" size={18} color={colors.brandBlue} />;
    }
  };

  const getBadgeBg = (type: NotificationType) => {
    switch (type) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.eyebrowRow}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.modalLogoImg}
                  resizeMode="contain"
                  accessibilityLabel="MediBook Logo"
                />
                <Text style={styles.eyebrow}>NOTIFICATION INBOX</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>Updates & Health Tips</Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close notification center"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Send me a clinical health tip"
              style={styles.randomTipBtn}
              onPress={() => triggerRandomHealthTip()}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color={colors.brandBlue} style={{ marginRight: 6 }} />
              <Text style={styles.randomTipBtnText}>Get New Health Tip</Text>
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
                style={styles.markAllBtn}
                onPress={markAllAsRead}
              >
                <Feather name="check" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.markAllBtnText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsRow}
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'REMINDER', label: 'Reminders' },
              { id: 'HEALTH_TIP', label: 'Happy Health' },
              { id: 'DOCTOR_TIP', label: 'Doctor Choice' },
              { id: 'APPOINTMENT', label: 'Visits' }
            ].map((tab) => {
              const isSelected = activeFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityLabel={`Filter ${tab.label}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.filterPill, isSelected && styles.filterPillActive]}
                  onPress={() => setActiveFilter(tab.id as any)}
                >
                  <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Notification List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySub}>You are completely up to date with care alerts.</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.message}`}
                  style={[styles.itemCard, !item.read && styles.itemCardUnread]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.itemIconCircle, { backgroundColor: getBadgeBg(item.type) }]}>
                    {getIcon(item.type)}
                  </View>

                  <View style={styles.itemTextCol}>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemCategory}>{item.type.replace('_', ' ')}</Text>
                      <Text style={styles.itemTime}>{formatTimeAgo(item.timestamp)}</Text>
                    </View>

                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMessage}>{item.message}</Text>

                    {item.actionLabel && (
                      <View style={styles.itemActionPill}>
                        <Text style={styles.itemActionText}>{item.actionLabel}</Text>
                        <Feather name="arrow-right" size={12} color={colors.brandBlue} style={{ marginLeft: 4 }} />
                      </View>
                    )}
                  </View>

                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.55)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  modalLogoImg: {
    width: 18,
    height: 18
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  unreadBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandBlue
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.4
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },

  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  randomTipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  randomTipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandBlue
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },

  filterTabsRow: {
    gap: 8,
    paddingBottom: 12
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  filterPillActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  listContent: {
    paddingBottom: 16,
    gap: 10
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540',
    marginTop: 8
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative'
  },
  itemCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE'
  },
  itemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2
  },
  itemTextCol: {
    flex: 1
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  itemTime: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600'
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.2
  },
  itemMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginTop: 3
  },
  itemActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8
  },
  itemActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brandBlue
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandBlue,
    position: 'absolute',
    top: 14,
    right: 14
  }
});
