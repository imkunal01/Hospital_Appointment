import { useState, useEffect } from 'react';
import { UserProfile } from '../api/types';
import { saveRefreshToken, getRefreshToken, removeRefreshToken } from './secureStorage';

interface SessionState {
  user: UserProfile | null;
  accessToken: string | null;
  isInitialized: boolean;
}

// In-memory session state (NEVER persisted to unencrypted disk)
let currentSession: SessionState = {
  user: null,
  accessToken: null,
  isInitialized: false
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getInMemoryAccessToken(): string | null {
  return currentSession.accessToken;
}

export function setInMemoryAccessToken(token: string | null) {
  currentSession.accessToken = token;
  notify();
}

export async function setSession(
  user: UserProfile,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  currentSession = {
    user,
    accessToken,
    isInitialized: true
  };
  await saveRefreshToken(refreshToken);
  notify();
}

export async function clearSession(): Promise<void> {
  currentSession = {
    user: null,
    accessToken: null,
    isInitialized: true
  };
  await removeRefreshToken();
  notify();
}

export function setInitialized(initialized: boolean) {
  currentSession.isInitialized = initialized;
  notify();
}

/**
 * React hook to subscribe to session state changes.
 */
export function useSession() {
  const [session, setLocalSession] = useState<SessionState>(currentSession);

  useEffect(() => {
    const update = () => setLocalSession({ ...currentSession });
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    user: session.user,
    accessToken: session.accessToken,
    isAuthenticated: Boolean(session.accessToken && session.user),
    isInitialized: session.isInitialized,
    setSession,
    clearSession
  };
}

