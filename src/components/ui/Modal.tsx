import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

/** Janela padrão do site: fecha com ESC ou clicando fora. */
export const Modal: React.FC<ModalProps> = ({ open, title, subtitle, onClose, children, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#0A1E2F]/60 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden`}
      >
        <div className="bg-[#004F8A] text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-white/70 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
};

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#0A1E2F] focus:outline-none focus:ring-2 focus:ring-[#4FA8D8] focus:bg-white';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#004F8A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#003d6b] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer transition-colors';

export const Field: React.FC<{ label: string; hint?: string; error?: string; children: React.ReactNode }> = ({
  label,
  hint,
  error,
  children,
}) => (
  <label className="block">
    <span className="block text-xs font-bold text-slate-700 mb-1">{label}</span>
    {children}
    {hint && !error && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    {error && <span className="block text-[11px] text-red-600 mt-1">{error}</span>}
  </label>
);

export const Tabs: React.FC<{
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 overflow-x-auto mb-4 border-b border-slate-200 -mx-1 px-1">
    {tabs.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
          active === t.id ? 'border-[#004F8A] text-[#004F8A]' : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        {t.label}
        {t.badge ? (
          <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{t.badge}</span>
        ) : null}
      </button>
    ))}
  </div>
);

export const Notice: React.FC<{ kind: 'error' | 'ok'; children: React.ReactNode }> = ({ kind, children }) => (
  <p
    role={kind === 'error' ? 'alert' : 'status'}
    className={`text-xs rounded-xl px-3 py-2 mb-3 border ${
      kind === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }`}
  >
    {children}
  </p>
);
