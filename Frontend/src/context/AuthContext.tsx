import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { authApi, guestApi } from '@/api/authApi';
import {
  setAuthToken,
  setGuestToken as setClientGuestToken,
  setGuestUnauthorizedHandler,
  setUnauthorizedHandler,
} from '@/api/axiosClient';
import {
  clearStoredTokens,
  getStoredAuthToken,
  getStoredGuestToken,
  setStoredAuthToken,
  setStoredGuestToken,
} from '@/api/storage';
import type {
  GuestSessionInfo,
  MigrationResult,
  ProfilePayload,
  RegisterPayload,
  RegisterResponse,
  User,
} from '@/types/api';

interface AuthContextValue {
  isLoading: boolean;
  user: User | null;
  guest: GuestSessionInfo | null;
  guestToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  hasSession: boolean;
  lastMigration: MigrationResult | null;
  clearLastMigration: () => void;
  signIn: (email: string, password: string) => Promise<{ migration: MigrationResult | null }>;
  signUp: (payload: RegisterPayload) => Promise<RegisterResponse>;
  startGuest: () => Promise<GuestSessionInfo>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshGuest: () => Promise<GuestSessionInfo>;
  updateGuestInfo: (info: GuestSessionInfo) => void;
  updateProfile: (payload: ProfilePayload) => Promise<User>;
  migrateGuest: () => Promise<MigrationResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState<GuestSessionInfo | null>(null);
  const [guestToken, setGuestTokenState] = useState<string | null>(null);
  const [lastMigration, setLastMigration] = useState<MigrationResult | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearGuestState = useCallback(async () => {
    setClientGuestToken(null);
    setGuestTokenState(null);
    setGuest(null);
    await setStoredGuestToken(null);
  }, []);

  const expireSession = useCallback(async () => {
    setAuthToken(null);
    setClientGuestToken(null);
    await clearStoredTokens();
    if (mounted.current) {
      setUser(null);
      setGuest(null);
      setGuestTokenState(null);
    }
  }, []);

  const expireGuest = useCallback(async () => {
    setClientGuestToken(null);
    await setStoredGuestToken(null);
    if (mounted.current) {
      setGuest(null);
      setGuestTokenState(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void expireSession();
    });
    setGuestUnauthorizedHandler(() => {
      void expireGuest();
    });
    return () => {
      setUnauthorizedHandler(null);
      setGuestUnauthorizedHandler(null);
    };
  }, [expireGuest, expireSession]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const [storedAuth, storedGuest] = await Promise.all([
        getStoredAuthToken(),
        getStoredGuestToken(),
      ]);

      if (storedAuth) {
        setAuthToken(storedAuth);
        try {
          const profile = await authApi.me();
          if (!active) return;
          setUser(profile);
          setGuest(null);
          setGuestTokenState(null);
          setClientGuestToken(null);
          if (storedGuest) await setStoredGuestToken(null);
          setIsLoading(false);
          return;
        } catch {
          setAuthToken(null);
          await setStoredAuthToken(null);
        }
      }

      if (storedGuest) {
        setClientGuestToken(storedGuest);
        try {
          const session = await guestApi.getSession();
          if (!active) return;
          setGuestTokenState(storedGuest);
          setGuest(session);
          setIsLoading(false);
          return;
        } catch {
          setClientGuestToken(null);
          await setStoredGuestToken(null);
        }
      }

      if (active) {
        setUser(null);
        setGuest(null);
        setGuestTokenState(null);
        setIsLoading(false);
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const pendingGuestToken = guestToken;
    const response = await authApi.login(email, password);

    setAuthToken(response.token);
    setClientGuestToken(null);
    await setStoredAuthToken(response.token);
    await setStoredGuestToken(null);

    let profile = response.user;
    try {
      profile = await authApi.me();
    } catch {}

    let migration: MigrationResult | null = null;
    if (pendingGuestToken) {
      try {
        migration = await guestApi.migrate(pendingGuestToken);
      } catch {}
    }

    if (mounted.current) {
      setUser(profile);
      setGuest(null);
      setGuestTokenState(null);
      setLastMigration(migration);
    }
    return { migration };
  }, [guestToken]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload, guestToken);
    await setStoredGuestToken(null);
    setClientGuestToken(null);
    setGuestTokenState(null);
    setGuest(null);

    const login = await authApi.login(payload.email, payload.password);
    setAuthToken(login.token);
    await setStoredAuthToken(login.token);
    let profile = login.user;
    try {
      profile = await authApi.me();
    } catch {}
    if (mounted.current) {
      setUser(profile);
      setLastMigration(response.migration ?? null);
    }
    return response;
  }, [guestToken]);

  const startGuest = useCallback(async () => {
    const session = await guestApi.createSession();
    if (!session.token) throw new Error('El servidor no devolvió un token de invitado.');
    setAuthToken(null);
    setClientGuestToken(session.token);
    await setStoredGuestToken(session.token);
    await setStoredAuthToken(null);
    if (mounted.current) {
      setUser(null);
      setGuestTokenState(session.token);
      setGuest(session);
    }
    return session;
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setClientGuestToken(null);
    await clearStoredTokens();
    if (mounted.current) {
      setUser(null);
      setGuest(null);
      setGuestTokenState(null);
      setLastMigration(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (user) {
      const profile = await authApi.me();
      if (mounted.current) setUser(profile);
      return;
    }
    if (guestToken) {
      const session = await guestApi.getSession();
      if (mounted.current) setGuest(session);
    }
  }, [guestToken, user]);

  const refreshGuest = useCallback(async () => {
    const session = await guestApi.getSession();
    if (mounted.current) setGuest(session);
    return session;
  }, []);

  const updateGuestInfo = useCallback((info: GuestSessionInfo) => {
    setGuest(info);
  }, []);

  const updateProfile = useCallback(async (payload: ProfilePayload) => {
    const profile = await authApi.updateMe(payload);
    if (mounted.current) setUser(profile);
    return profile;
  }, []);

  const migrateGuest = useCallback(async () => {
    if (!guestToken) throw new Error('No hay una sesión de invitado activa.');
    const migration = await guestApi.migrate(guestToken);
    await clearGuestState();
    setLastMigration(migration);
    return migration;
  }, [clearGuestState, guestToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      guest,
      guestToken,
      isAuthenticated: Boolean(user),
      isGuest: Boolean(guest) && !user,
      isAdmin: user?.role?.name === 'Admin',
      hasSession: Boolean(user || guest),
      lastMigration,
      clearLastMigration: () => setLastMigration(null),
      signIn,
      signUp,
      startGuest,
      signOut,
      refreshSession,
      refreshGuest,
      updateGuestInfo,
      updateProfile,
      migrateGuest,
    }),
    [
      guest,
      guestToken,
      isLoading,
      lastMigration,
      migrateGuest,
      refreshGuest,
      refreshSession,
      signIn,
      signOut,
      signUp,
      startGuest,
      updateGuestInfo,
      updateProfile,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
