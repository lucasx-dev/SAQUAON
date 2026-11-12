import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authRedirect, isSupabaseConfigured, supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { translateAuthError } from '../lib/validation';
import type { Profile, SignupType } from '../types';

export type AuthView = 'login' | 'cadastro' | 'esqueci' | 'recuperar' | 'confirmacao';

interface AuthModalState {
  open: boolean;
  view: AuthView;
  tipo: SignupType;
  notice?: string;
}

const EXPIRED_LINK_NOTICE =
  'O link do e-mail expirou ou já foi usado. Entre com a sua senha ou use “Esqueci minha senha” para receber um link novo.';


export interface OpenAuthOptions {
  view?: AuthView;
  tipo?: SignupType;
}

export interface SignUpInput {
  nome: string;
  email: string;
  senha: string;
  tipo: SignupType;
  captchaToken?: string;
}

type Result = { error?: string };

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  modal: AuthModalState;
  openAuthModal: (options?: OpenAuthOptions) => void;
  closeAuthModal: () => void;
  setAuthView: (view: AuthView) => void;
  /** Roda a ação se a pessoa estiver logada; senão abre o login e roda a ação depois do acesso. */
  requireAuth: (action: () => void, options?: OpenAuthOptions) => void;
  signUp: (input: SignUpInput) => Promise<Result & { needsConfirmation?: boolean }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<Result>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string, captchaToken?: string) => Promise<Result>;
  updatePassword: (newPassword: string) => Promise<Result>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED = 'O Supabase ainda não foi configurado neste ambiente (veja o arquivo .env).';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [modal, setModal] = useState<AuthModalState>(() => {
    if (authRedirect.recovery) return { open: true, view: 'recuperar', tipo: 'turista' };
    if (authRedirect.error) return { open: true, view: 'login', tipo: 'turista', notice: EXPIRED_LINK_NOTICE };
    return { open: false, view: 'login', tipo: 'turista' };
  });
  const pendingAction = useRef<(() => void) | null>(null);

  // Link de e-mail com erro: limpa a URL para o aviso não reaparecer ao recarregar a página
  useEffect(() => {
    if (authRedirect.error) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        // a pessoa clicou no link do e-mail: pede a nova senha
        setModal((m) => ({ ...m, open: true, view: 'recuperar' }));
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await api.fetchPerfil(userId));
    } catch {
      setProfile(null);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // ---------------------------------------------------------- modal
  const openAuthModal = useCallback((options?: OpenAuthOptions) => {
    setModal({ open: true, view: options?.view ?? 'login', tipo: options?.tipo ?? 'turista', notice: undefined });
  }, []);

  const closeAuthModal = useCallback(() => {
    pendingAction.current = null;
    setModal((m) => ({ ...m, open: false }));
  }, []);

  const setAuthView = useCallback((view: AuthView) => setModal((m) => ({ ...m, view, notice: undefined })), []);

  const finishLogin = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setModal((m) => ({ ...m, open: false }));
    if (action) setTimeout(action, 0);
  }, []);

  const requireAuth = useCallback(
    (action: () => void, options?: OpenAuthOptions) => {
      if (session?.user) {
        action();
        return;
      }
      pendingAction.current = action;
      openAuthModal(options);
    },
    [session, openAuthModal]
  );

  // ----------------------------------------------------- ações de conta
  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ nome, email, senha, tipo, captchaToken }) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, tipo }, emailRedirectTo: window.location.origin, captchaToken },
      });
      if (error) return { error: translateAuthError(error) };

      if (data.session) {
        finishLogin();
        return {};
      }
      return { needsConfirmation: true };
    },
    [finishLogin]
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password, captchaToken) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
      const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (error) return { error: translateAuthError(error) };
      finishLogin();
      return {};
    },
    [finishLogin]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const sendPasswordReset = useCallback<AuthContextValue['sendPasswordReset']>(async (email, captchaToken) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin, captchaToken });
    if (error) return { error: translateAuthError(error) };
    return {};
  }, []);

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(async (newPassword) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: translateAuthError(error) };
    return {};
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: profile?.tipo === 'administrador',
      modal,
      openAuthModal,
      closeAuthModal,
      setAuthView,
      requireAuth,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshProfile: loadProfile,
    }),
    [session, profile, loading, modal, openAuthModal, closeAuthModal, setAuthView, requireAuth, signUp, signIn, signOut, sendPasswordReset, updatePassword, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
