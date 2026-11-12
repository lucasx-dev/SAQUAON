import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Store, Plus, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type MyBusiness } from '../lib/api';
import { translateDbError } from '../lib/validation';
import { getInitials } from '../lib/format';

interface AccountMenuProps {
  onOpenMerchantModal: () => void;
  onEditBusiness?: (id: string) => void;
  onOpenAdmin?: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  turista: 'Turista',
  morador: 'Morador',
  comerciante: 'Comerciante',
  administrador: 'Administrador',
};

const PLANO_LABEL: Record<string, string> = { gratuito: 'Gratuito', pago: 'Pro', premium: 'Master' };

export const AccountMenu: React.FC<AccountMenuProps> = ({ onOpenMerchantModal, onEditBusiness, onOpenAdmin }) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState<MyBusiness[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = profile?.nome ?? user?.email?.split('@')[0] ?? 'Minha conta';
  const userId = user?.id;

  // fecha ao clicar fora ou apertar ESC
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // carrega os estabelecimentos da pessoa quando o menu abre
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoadError(null);
    api
      .fetchMeusComerciantes(userId)
      .then((list) => !cancelled && setBusinesses(list))
      .catch((err) => !cancelled && setLoadError(translateDbError(err)));
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-[#004F8A]/20 hover:bg-[#004F8A]/5 transition-all cursor-pointer"
      >
        <span className="w-7 h-7 rounded-full bg-[#004F8A] text-white text-[11px] font-black flex items-center justify-center">
          {getInitials(displayName)}
        </span>
        <span className="hidden md:inline text-xs font-bold text-[#004F8A] max-w-[110px] truncate">{displayName.split(' ')[0]}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#004F8A] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="pb-3 mb-3 border-b border-slate-100">
            <p className="text-sm font-bold text-[#0A1E2F] truncate">{displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            {profile && (
              <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wide bg-[#4FA8D8]/20 text-[#004F8A] px-2 py-0.5 rounded-md">
                {TIPO_LABEL[profile.tipo] ?? profile.tipo}
              </span>
            )}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Meus estabelecimentos</p>
          {loadError ? (
            <p className="text-xs text-red-600 mb-2">{loadError}</p>
          ) : businesses === null ? (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
            </p>
          ) : businesses.length === 0 ? (
            <p className="text-xs text-slate-500 mb-2">Você ainda não cadastrou nenhum.</p>
          ) : (
            <ul className="space-y-2 mb-2 max-h-48 overflow-y-auto">
              {businesses.map((b) => (
                <li key={b.id} className="text-xs bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#004F8A] shrink-0" />
                    <span className="truncate flex-1">{b.nome}</span>
                    {onEditBusiness && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onEditBusiness(b.id);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#004F8A] hover:underline cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Plano {PLANO_LABEL[b.plano] ?? b.plano}
                    {b.planoSolicitado && b.planoSolicitado !== b.plano
                      ? ` • aguardando ativação do ${PLANO_LABEL[b.planoSolicitado] ?? b.planoSolicitado}`
                      : ''}
                    {b.status !== 'ativo' ? ` • ${b.status}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenMerchantModal();
            }}
            className="w-full flex items-center gap-2 text-xs font-bold text-[#004F8A] hover:bg-[#004F8A]/5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar novo estabelecimento</span>
          </button>

          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenAdmin();
              }}
              className="w-full flex items-center gap-2 text-xs font-bold text-[#004F8A] hover:bg-[#004F8A]/5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Painel do administrador</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full mt-1 flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da conta</span>
          </button>
        </div>
      )}
    </div>
  );
};
