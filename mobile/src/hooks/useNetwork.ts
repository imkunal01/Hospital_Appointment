import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetwork() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });

    // Subscribe to connectivity changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return unsubscribe;
  }, []);

  return {
    isOffline,
    isOnline: !isOffline
  };
}

