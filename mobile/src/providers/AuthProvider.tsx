import type { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export type CrmRole = 'crm_officer' | 'manager';

type CrmProfile = {
  id: string;
  full_name: string | null;
  role: CrmRole;
};

type AuthContextValue = {
  session: Session | null;
  profile: CrmProfile | null;
  isLoading: boolean;
  isAuthorized: boolean;
  accessError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CrmProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const validateSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession?.user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', nextSession.user.id)
      .single();

    if (error || !data || (data.role !== 'crm_officer' && data.role !== 'manager')) {
      setProfile(null);
      setAccessError('This account is not authorized for Sunbliss CRM.');
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    setAccessError(null);
    setProfile(data as CrmProfile);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAccessError('Your saved session could not be restored. Please sign in again.');
        setIsLoading(false);
        return;
      }
      void validateSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      // Avoid running additional Supabase calls inside the auth callback itself.
      setTimeout(() => {
        if (active) void validateSession(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [validateSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAccessError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    isLoading,
    isAuthorized: Boolean(session && profile),
    accessError,
    signIn,
    signOut,
  }), [session, profile, isLoading, accessError, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
