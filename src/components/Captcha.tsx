import React, { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/** O CAPTCHA só aparece (e passa a ser exigido) quando a chave do Turnstile está no .env. */
export const CAPTCHA_ENABLED = Boolean(SITE_KEY);

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Não foi possível carregar a verificação de segurança.'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

interface CaptchaProps {
  onToken: (token: string | null) => void;
  /** mude este valor para pedir uma nova verificação (o token vale uma vez só) */
  resetKey?: number;
}

export const Captcha: React.FC<CaptchaProps> = ({ onToken, resetKey = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!CAPTCHA_ENABLED || !ref.current) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          language: 'pt-br',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null),
        });
      })
      .catch(() => cb.current(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
      cb.current(null);
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      cb.current(null);
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  if (!CAPTCHA_ENABLED) return null;
  return <div ref={ref} className="flex justify-center min-h-[65px]" aria-label="Verificação de segurança" />;
};
