import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Universal cross-platform alert helper that works seamlessly
 * on both React Native mobile (Android / iOS) and React Native Web.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;

    if (!buttons || buttons.length <= 1) {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      // Find confirm button vs cancel button
      const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const confirmed = window.confirm(`${title}${message ? '\n\n' + message : ''}`);
      if (confirmed && confirmBtn?.onPress) {
        confirmBtn.onPress();
      } else if (!confirmed && cancelBtn?.onPress) {
        cancelBtn.onPress();
      }
    }
    return;
  }

  Alert.alert(title, message, buttons);
}

