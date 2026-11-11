import { useState, useEffect } from 'react';
import { UserProfile, AuthSession } from '../api/types';
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
  userOrSession: UserProfile | AuthSession,
  accessToken?: string,
  refreshToken?: string
): Promise<void> {
  let user: UserProfile;
  let token: string;
  let refresh: string;

  if (
    userOrSession &&
    typeof userOrSession === 'object' &&
    'user' in userOrSession &&
    'accessToken' in userOrSession
  ) {
    const sessionObj = userOrSession as AuthSession;
    user = sessionObj.user;
    token = sessionObj.accessToken;
    refresh = sessionObj.refreshToken;
  } else {
    user = userOrSession as UserProfile;
    token = accessToken || '';
    refresh = refreshToken || '';
  }

  currentSession = {
    user,
    accessToken: token,
    isInitialized: true
  };
  if (refresh) {
    await saveRefreshToken(refresh);
  }
  notify();
}

export function updateSessionUser(updatedUser: UserProfile): void {
  if (currentSession.user) {
    currentSession.user = {
      ...currentSession.user,
      ...updatedUser
    };
    notify();
  }
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

