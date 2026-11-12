import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import {
  api,
  type AdminBusiness,
  type AdminReport,
  type AdminUser,
  type ReportStatus,
} from '../lib/api';
import { translateDbError } from '../lib/validation';
import type { PlanCode, UserType } from '../types';
import { btnGhost, inputCls, Modal, Notice, Tabs } from './ui/Modal';

const PLANOS: { id: PlanCode; label: string }[] = [
  { id: 'gratuito', label: 'Gratuito' },
  { id: 'pago', label: 'Pro' },
  { id: 'premium', label: 'Master' },
];
const TIPOS: UserType[] = ['turista', 'morador', 'comerciante', 'administrador'];
const MOTIVO: Record<string, string> = { spam: 'Spam', ofensivo: 'Ofensivo', falso: 'Falso', outro: 'Outro' };
const ALVO: Record<string, string> = { publicacao: 'Publicação', comentario: 'Comentário', estabelecimento: 'Estabelecimento' };
const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export const AdminPanel: React.FC<{ open: boolean; onClose: () => void; onChanged: () => void }> = ({ open, onClose, onChanged }) => {
  const [tab, setTab] = useState('denuncias');
  const [openReports, setOpenReports] = useState(0);

  return (
    <Modal open={open} onClose={onClose} wide title="Painel do administrador" subtitle="Moderação, estabelecimentos e usuários">
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'denuncias', label: 'Denúncias', badge: openReports },
          { id: 'estabelecimentos', label: 'Estabelecimentos' },
          { id: 'usuarios', label: 'Usuários' },
        ]}
      />
      {tab === 'denuncias' && <ReportsTab onCount={setOpenReports} onChanged={onChanged} />}
      {tab === 'estabelecimentos' && <BusinessesTab onChanged={onChanged} />}
      {tab === 'usuarios' && <UsersTab />}
    </Modal>
  );
};

// ------------------------------------------------------------------ denúncias (UC18)
const ReportsTab: React.FC<{ onCount: (n: number) => void; onChanged: () => void }> = ({ onCount, onChanged }) => {
  const [filter, setFilter] = useState<ReportStatus | 'todas'>('aberta');
  const [items, setItems] = useState<AdminReport[] | null>(null);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.adminFetchDenuncias(filter));
      if (filter === 'aberta') onCount((await api.adminFetchDenuncias('aberta')).length);
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
      setItems([]);
    }
  }, [filter, onCount]);
  useEffect(() => void load(), [load]);

  const act = async (r: AdminReport, action: 'ocultar' | 'reexibir' | 'suspender' | 'resolver' | 'descartar' | 'reabrir') => {
    setBusyId(r.id);
    setMsg(null);
    try {
      if (action === 'ocultar' || action === 'reexibir') {
        await api.adminModerar(r.alvoTipo as 'publicacao' | 'comentario', r.alvoId, action === 'ocultar');
      }
      if (action === 'suspender') await api.adminAtualizarComerciante(r.alvoId, { status: 'suspenso' });
      const novo: ReportStatus = action === 'descartar' ? 'descartada' : action === 'reabrir' ? 'aberta' : action === 'reexibir' ? 'descartada' : 'resolvida';
      await api.adminResolverDenuncia(r.id, novo);
      await load();
      onChanged();
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <select className={`${inputCls} sm:max-w-[220px]`} value={filter} onChange={(e) => setFilter(e.target.value as ReportStatus | 'todas')} aria-label="Filtrar">
        <option value="aberta">Abertas</option>
        <option value="resolvida">Resolvidas</option>
        <option value="descartada">Descartadas</option>
        <option value="todas">Todas</option>
      </select>
      {items === null ? (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma denúncia por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="bg-sky-100 text-sky-800 rounded-md px-2 py-0.5">{ALVO[r.alvoTipo]}</span>
                <span className="bg-amber-100 text-amber-800 rounded-md px-2 py-0.5">{MOTIVO[r.motivo]}</span>
                {r.alvoStatus && r.alvoStatus !== 'publicada' && r.alvoStatus !== 'ativo' && (
                  <span className="bg-slate-200 text-slate-700 rounded-md px-2 py-0.5">{r.alvoStatus}</span>
                )}
                <span className="text-slate-400 font-normal ml-auto">{date(r.criadoEm)} • por {r.denunciante}</span>
              </div>
              <p className="text-sm text-slate-800 break-words">“{r.resumo}”</p>
              {r.detalhe && <p className="text-xs text-slate-500">Detalhe: {r.detalhe}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status === 'aberta' ? (
                  <>
                    {r.alvoTipo !== 'estabelecimento' && (
                      <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'ocultar')}>Ocultar conteúdo e resolver</button>
                    )}
                    {r.alvoTipo === 'estabelecimento' && (
                      <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'suspender')}>Suspender estabelecimento</button>
                    )}
                    <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'resolver')}>Marcar como resolvida</button>
                    <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'descartar')}>Descartar</button>
                  </>
                ) : (
                  <>
                    {r.alvoTipo !== 'estabelecimento' && r.alvoStatus === 'oculta' && (
                      <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'reexibir')}>Reexibir conteúdo</button>
                    )}
                    <button type="button" disabled={busyId === r.id} className={btnGhost} onClick={() => void act(r, 'reabrir')}>Reabrir</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ estabelecimentos (UC19–UC20)
const BusinessesTab: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const [items, setItems] = useState<AdminBusiness[] | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    () => api.adminFetchComerciantes().then(setItems).catch((e) => { setMsg({ kind: 'error', text: translateDbError(e) }); setItems([]); }),
    []
  );
  useEffect(() => void load(), [load]);

  const patch = async (b: AdminBusiness, p: Parameters<typeof api.adminAtualizarComerciante>[1]) => {
    setBusyId(b.id);
    setMsg(null);
    try {
      await api.adminAtualizarComerciante(b.id, p);
      await load();
      onChanged();
      setMsg({ kind: 'ok', text: `“${b.nome}” atualizado.` });
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    } finally {
      setBusyId(null);
    }
  };

  const list = (items ?? []).filter((b) => `${b.nome} ${b.dono} ${b.email}`.toLowerCase().includes(q.toLowerCase()));
  const pendentes = list.filter((b) => b.planoSolicitado && b.planoSolicitado !== b.plano);

  return (
    <div className="space-y-3">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <input className={inputCls} placeholder="Buscar por nome, dono ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
      {pendentes.length > 0 && (
        <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {pendentes.length} pedido(s) de plano aguardando ativação.
        </p>
      )}
      {items === null ? (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum estabelecimento encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <li key={b.id} className="border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <span className="truncate">{b.nome}</span>
                    {b.verificado && <BadgeCheck className="w-4 h-4 text-[#4FA8D8] shrink-0" />}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{b.categoria} • {b.dono} • {b.email}</p>
                </div>
                <span className="text-[11px] text-slate-400">{date(b.criadoEm)}</span>
              </div>
              {b.planoSolicitado && b.planoSolicitado !== b.plano && (
                <button type="button" disabled={busyId === b.id} className={`${btnGhost} !border-amber-300 !bg-amber-50 !text-amber-900`}
                  onClick={() => void patch(b, { plano: b.planoSolicitado!, planoSolicitado: null })}>
                  Ativar plano pedido: {PLANOS.find((p) => p.id === b.planoSolicitado)?.label}
                </button>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-end">
                <label className="text-[11px] font-bold text-slate-600">Plano
                  <select className={inputCls} disabled={busyId === b.id} value={b.plano} onChange={(e) => void patch(b, { plano: e.target.value as PlanCode })}>
                    {PLANOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-slate-600">Status
                  <select className={inputCls} disabled={busyId === b.id} value={b.status} onChange={(e) => void patch(b, { status: e.target.value as AdminBusiness['status'] })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer col-span-2 sm:col-span-1 pb-2.5">
                  <input type="checkbox" disabled={busyId === b.id} checked={b.verificado} onChange={(e) => void patch(b, { verificado: e.target.checked })} />
                  Selo verificado
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ usuários
const UsersTab: React.FC = () => {
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const load = useCallback(
    () => api.adminFetchUsuarios().then(setItems).catch((e) => { setMsg({ kind: 'error', text: translateDbError(e) }); setItems([]); }),
    []
  );
  useEffect(() => void load(), [load]);

  const change = async (u: AdminUser, tipo: UserType) => {
    if (tipo === 'administrador' && !window.confirm(`Dar acesso de administrador a ${u.nome}?`)) return;
    setMsg(null);
    try {
      await api.adminDefinirTipo(u.id, tipo);
      await load();
      setMsg({ kind: 'ok', text: `${u.nome} agora é ${tipo}.` });
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    }
  };

  const list = (items ?? []).filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <input className={inputCls} placeholder="Buscar por nome ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
      {items === null ? (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl">
          {list.map((u) => (
            <li key={u.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{u.nome}</p>
                <p className="text-xs text-slate-500 truncate">{u.email} • desde {date(u.criadoEm)}</p>
              </div>
              <select className={`${inputCls} !w-auto`} value={u.tipo} onChange={(e) => void change(u, e.target.value as UserType)} aria-label={`Tipo de ${u.nome}`}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
