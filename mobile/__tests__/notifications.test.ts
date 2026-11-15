import {
  getNotifications,
  getUnreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  showToast,
  dismissToast,
  subscribeNotifications,
  subscribeActiveToast,
  triggerRandomHealthTip
} from '../src/notifications/notificationStore';

describe('In-App Notification & Clinical Health Tips Store', () => {
  it('loads seeded clinical notifications with unread count', () => {
    const notifs = getNotifications();
    expect(notifs.length).toBeGreaterThanOrEqual(3);
    const unread = getUnreadCount();
    expect(unread).toBeGreaterThan(0);
  });

  it('adds a new appointment notification and updates subscribers', () => {
    let notifiedCount = 0;
    const unsubscribe = subscribeNotifications((list) => {
      notifiedCount = list.length;
    });

    const newNotif = addNotification({
      type: 'APPOINTMENT',
      title: 'Appointment Confirmed',
      message: 'Consultation with Dr. Sarah Jenkins is scheduled.',
      priority: 'high',
      actionLabel: 'View Visits',
      actionTab: 'AppointmentsTab'
    });

    expect(newNotif.id).toBeDefined();
    expect(newNotif.title).toBe('Appointment Confirmed');
    expect(notifiedCount).toBeGreaterThanOrEqual(1);

    unsubscribe();
  });

  it('marks a single notification as read and decrements unread count', () => {
    const notifs = getNotifications();
    const unreadBefore = getUnreadCount();
    const target = notifs.find((n) => !n.read);

    if (target) {
      markAsRead(target.id);
      expect(getUnreadCount()).toBe(unreadBefore - 1);
    }
  });

  it('marks all notifications as read', () => {
    markAllAsRead();
    expect(getUnreadCount()).toBe(0);
    const notifs = getNotifications();
    expect(notifs.every((n) => n.read)).toBe(true);
  });

  it('triggers a random clinical health or doctor selection tip', () => {
    const initialCount = getNotifications().length;
    const tip = triggerRandomHealthTip();

    expect(tip).toBeDefined();
    expect(tip.title).toBeDefined();
    expect(tip.message).toBeDefined();
    expect(getNotifications().length).toBe(initialCount + 1);
  });

  it('shows and dismisses active toast notification', () => {
    let currentToast: any = null;
    const unsubscribe = subscribeActiveToast((toast) => {
      currentToast = toast;
    });

    const testNotif = {
      id: 'test-toast',
      type: 'HEALTH_TIP' as const,
      title: 'Hydration Advisory',
      message: 'Drink 2.5L water daily.',
      timestamp: Date.now(),
      read: false
    };

    showToast(testNotif);
    expect(currentToast).not.toBeNull();
    expect(currentToast?.title).toBe('Hydration Advisory');

    dismissToast();
    expect(currentToast).toBeNull();

    unsubscribe();
  });
});
