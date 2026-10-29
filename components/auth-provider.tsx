'use client';

import React, { createContext, useContext, useMemo } from 'react';
import {
  authClient,
  useSession as useBetterAuthSession,
  signOut as betterAuthSignOut,
} from '@/lib/auth-client';

export type UserType = {
  id: string;
  name?: string;
  username?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  emailVerified?: boolean;
};

export type SessionType = {
  user: UserType;
  session: {
    id: string;
    userId: string;
    expiresAt: string | Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
} | null;

export interface AuthContextType {
  session: SessionType;
  /** Alias for Better Auth compatibility (e.g. const { data: session } = useAuth()) */
  data: SessionType;
  user: UserType | null;
  isLoggedIn: boolean;
  isPending: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  refetch: () => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession = null,
  initialIsRoot = false,
}: {
  children: React.ReactNode;
  initialSession?: SessionType;
  initialIsRoot?: boolean;
}) {
  const { data: clientSession, isPending: clientPending, refetch } = useBetterAuthSession();

  // If client is still fetching and we have initialSession from SSR, use initialSession
  // Once client has finished loading, clientSession becomes the single source of truth
  const session = (
    clientPending && initialSession !== undefined
      ? initialSession
      : clientSession ?? null
  ) as SessionType;

  // We are only pending if initialSession was not provided AND client has not resolved
  const isPending = initialSession !== undefined ? false : clientPending;

  const user = session?.user || null;
  const isLoggedIn = !!user;

  // Determine root & admin synchronously
  const isDirectRoot =
    user?.role === 'root' ||
    user?.username?.toLowerCase() === 'root' ||
    user?.email?.toLowerCase() === 'root' ||
    user?.email?.toLowerCase() === 'root@buddyline.local' ||
    user?.email?.toLowerCase() === 'root@buddyline.com';

  const isRoot = Boolean(initialIsRoot || isDirectRoot);
  const isAdmin = Boolean(isRoot || user?.role === 'admin');

  const handleSignOut = async () => {
    await betterAuthSignOut();
  };

  const value: AuthContextType = useMemo(
    () => ({
      session,
      data: session,
      user,
      isLoggedIn,
      isPending,
      isAdmin,
      isRoot,
      refetch,
      signOut: handleSignOut,
    }),
    [session, user, isLoggedIn, isPending, isAdmin, isRoot, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful fallback if invoked outside AuthProvider
    return {
      session: null,
      data: null,
      user: null,
      isLoggedIn: false,
      isPending: false,
      isAdmin: false,
      isRoot: false,
      refetch: async () => {},
      signOut: async () => {
        await betterAuthSignOut();
      },
    };
  }
  return context;
}
