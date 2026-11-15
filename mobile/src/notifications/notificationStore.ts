import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'APPOINTMENT' | 'REMINDER' | 'HEALTH_TIP' | 'DOCTOR_TIP';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority?: 'high' | 'normal';
  actionLabel?: string;
  actionTab?: string;
}

const STORAGE_KEY = '@medibook_notifications_v1';

const HEALTH_TIPS_POOL = [
  {
    type: 'HEALTH_TIP' as const,
    title: 'Hydration & Vitals Check',
    message: 'Staying well-hydrated stabilizes resting blood pressure and ensures accurate clinical readings.'
  },
  {
    type: 'DOCTOR_TIP' as const,
    title: 'Doctor Selection Guide',
    message: 'Review specialist credentials and verified hospital clinic wings to find the ideal match for your care.'
  },
  {
    type: 'REMINDER' as const,
    title: 'Timely Check-In Advisory',
    message: 'Arriving 15 minutes before your consultation allows smooth digital triage at North Wing reception.'
  },
  {
    type: 'HEALTH_TIP' as const,
    title: 'Cardiovascular Wellness',
    message: '30 minutes of moderate aerobic activity daily significantly improves cardiac output and arterial elasticity.'
  },
  {
    type: 'DOCTOR_TIP' as const,
    title: 'Pre-Visit Preparation',
    message: 'Bring digital health records and write down your key symptoms to maximize consultation effectiveness.'
  },
  {
    type: 'HEALTH_TIP' as const,
    title: 'Restorative Sleep Cycle',
    message: '7 to 8 hours of uninterrupted sleep supports cellular tissue repair and immune defense.'
  },
  {
    type: 'DOCTOR_TIP' as const,
    title: 'Specialty Matching',
    message: 'For skin or rash flare-ups, consult Dermatology early rather than self-treating with over-the-counter creams.'
  }
];

const INITIAL_SEEDS: AppNotification[] = [
  {
    id: 'seed-notif-1',
    type: 'REMINDER',
    title: 'Arrival Check-In Advisory',
    message: 'Please arrive 15 minutes prior to your visit to complete digital pass validation at North Wing Floor 2.',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    read: false,
    priority: 'high',
    actionLabel: 'View Visits',
    actionTab: 'AppointmentsTab'
  },
  {
    id: 'seed-notif-2',
    type: 'HEALTH_TIP',
    title: 'Hydration & Blood Pressure',
    message: 'Drinking 2 liters of water daily helps maintain vascular equilibrium and supports renal filtration.',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    read: false,
    priority: 'normal'
  },
  {
    id: 'seed-notif-3',
    type: 'DOCTOR_TIP',
    title: 'How to Choose Your Specialist',
    message: 'Check doctor department profiles, consultation slots, and hospital certifications before booking.',
    timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
    read: true,
    priority: 'normal',
    actionLabel: 'Browse Doctors',
    actionTab: 'BookTab'
  }
];

let inMemoryNotifications: AppNotification[] = [...INITIAL_SEEDS];
let activeToast: AppNotification | null = null;

type NotificationListener = (notifications: AppNotification[]) => void;
type ToastListener = (toast: AppNotification | null) => void;

const notificationListeners = new Set<NotificationListener>();
const toastListeners = new Set<ToastListener>();

// Load from AsyncStorage if available
AsyncStorage.getItem(STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryNotifications = parsed;
        notifyListeners();
      }
    } catch {
      // Keep initial seeds
    }
  }
}).catch(() => {});

function notifyListeners() {
  notificationListeners.forEach((l) => l([...inMemoryNotifications]));
  try {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryNotifications)).catch(() => {});
  } catch {}
}

function notifyToast() {
  toastListeners.forEach((l) => l(activeToast));
}

export function subscribeNotifications(listener: NotificationListener) {
  notificationListeners.add(listener);
  listener([...inMemoryNotifications]);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function subscribeActiveToast(listener: ToastListener) {
  toastListeners.add(listener);
  listener(activeToast);
  return () => {
    toastListeners.delete(listener);
  };
}

export function getNotifications(): AppNotification[] {
  return [...inMemoryNotifications];
}

export function getUnreadCount(): number {
  return inMemoryNotifications.filter((n) => !n.read).length;
}

export function showToast(notification: AppNotification) {
  activeToast = notification;
  notifyToast();
}

export function dismissToast() {
  activeToast = null;
  notifyToast();
}

export function addNotification(
  data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): AppNotification {
  const newNotif: AppNotification = {
    ...data,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    read: false
  };

  inMemoryNotifications = [newNotif, ...inMemoryNotifications];
  notifyListeners();

  // Immediately display as floating in-app toast
  showToast(newNotif);

  return newNotif;
}

export function markAsRead(id: string) {
  inMemoryNotifications = inMemoryNotifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  notifyListeners();
}

export function markAllAsRead() {
  inMemoryNotifications = inMemoryNotifications.map((n) => ({ ...n, read: true }));
  notifyListeners();
}

export function clearNotifications() {
  inMemoryNotifications = [];
  notifyListeners();
}

/**
 * Dispatches a random verified clinical health or doctor choice tip
 * and triggers the interactive floating toast banner.
 */
let lastTipIndex = -1;
export function triggerRandomHealthTip(): AppNotification {
  let nextIdx = Math.floor(Math.random() * HEALTH_TIPS_POOL.length);
  if (nextIdx === lastTipIndex) {
    nextIdx = (nextIdx + 1) % HEALTH_TIPS_POOL.length;
  }
  lastTipIndex = nextIdx;
  const tip = HEALTH_TIPS_POOL[nextIdx];

  return addNotification({
    type: tip.type,
    title: tip.title,
    message: tip.message,
    priority: 'normal',
    actionLabel: tip.type === 'DOCTOR_TIP' ? 'Browse Specialists' : undefined,
    actionTab: tip.type === 'DOCTOR_TIP' ? 'BookTab' : undefined
  });
}
