import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister } from './src/storage/queryPersister';
import { RootNavigator } from './src/navigation/RootNavigator';
import { warmUpBackend } from './src/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000 // 24 hours cache retention for offline browsing
    }
  }
});

export default function App() {
  useEffect(() => {
    // Probe backend health to wake up Render free tier on app start
    warmUpBackend();
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 24 * 60 * 60 * 1000
        }}
      >
        <StatusBar style="dark" />
        <RootNavigator />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
