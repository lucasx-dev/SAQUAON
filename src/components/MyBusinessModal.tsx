import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Star, Trash2, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  api,
  type BusinessDetails,
  type BusinessEvent,
  type EventCategory,
  type Product,
} from '../lib/api';
import {
  formatWhatsappDisplay,
  translateDbError,
  validateBusinessName,
  validateInstagram,
  validateOptionalText,
  validateWhatsapp,
} from '../lib/validation';
import { formatPrice } from '../lib/format';
import type { MerchantCategory } from '../types';
import { btnGhost, btnPrimary, Field, inputCls, Modal, Notice, Tabs } from './ui/Modal';
import { PhotoUploader } from './PhotoUploader';

const CATEGORIAS: MerchantCategory[] = ['Quiosque', 'Restaurante', 'Escola de Surf', 'Pousada', 'Ambulante'];
const EVENT_CATS: EventCategory[] = ['Surf & Esporte', 'Música & Cultura', 'Gastronomia', 'Sustentabilidade'];
const TABS = [
  { id: 'dados', label: 'Dados' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'cardapio', label: 'Cardápio / serviços' },
  { id: 'promocoes', label: 'Promoções e eventos' },
];

interface Props {
  businessId: string | null;
  onClose: () => void;
  /** chamado após qualquer alteração, para atualizar a vitrine do site */
  onSaved: () => void;
}

export const MyBusinessModal: React.FC<Props> = ({ businessId, onClose, onSaved }) => {
  const [tab, setTab] = useState('dados');
  const [biz, setBiz] = useState<BusinessDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setBiz(null);
    setLoadError(null);
    setTab('dados');
    api.fetchComercianteDetalhe(businessId).then(setBiz).catch((e) => setLoadError(translateDbError(e)));
  }, [businessId]);

  return (
    <Modal open={!!businessId} onClose={onClose} wide title={biz?.nome ?? 'Meu estabelecimento'} subtitle="Edite as informações que aparecem no site">
      {loadError && <Notice kind="error">{loadError}</Notice>}
      {!biz && !loadError && (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      )}
      {biz && (
        <>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          {tab === 'dados' && <DadosTab biz={biz} onUpdated={(b) => { setBiz(b); onSaved(); }} />}
          {tab === 'fotos' && <FotosTab biz={biz} onUpdated={(b) => { setBiz(b); onSaved(); }} />}
          {tab === 'cardapio' && <CardapioTab biz={biz} onSaved={onSaved} />}
          {tab === 'promocoes' && <PromocoesTab biz={biz} onSaved={onSaved} />}
        </>
      )}
    </Modal>
  );
};

// ------------------------------------------------------------------ dados
const DadosTab: React.FC<{ biz: BusinessDetails; onUpdated: (b: BusinessDetails) => void }> = ({ biz, onUpdated }) => {
  const { beaches } = useData();
  const [f, setF] = useState({
    nome: biz.nome,
    categoria: biz.categoria,
    descricao: biz.descricao,
    endereco: biz.endereco,
    praiaId: biz.praiaId ?? '',
    whatsapp: formatWhatsappDisplay(biz.whatsapp),
    instagram: biz.instagram,
    horario: biz.horario,
    faixaPreco: biz.faixaPreco,
    comodidades: biz.comodidades.join(', '),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const nome = validateBusinessName(f.nome);
    const wpp = validateWhatsapp(f.whatsapp);
    const insta = validateInstagram(f.instagram);
    const desc = validateOptionalText(f.descricao, 300, 'A descrição');
    const end = validateOptionalText(f.endereco, 200, 'O endereço');
    const hor = validateOptionalText(f.horario, 200, 'O horário');
    const comodidades = f.comodidades.split(',').map((s) => s.trim()).filter(Boolean);
    const errs: Record<string, string> = {};
    if (nome.error) errs.nome = nome.error;
    if (wpp.error) errs.whatsapp = wpp.error;
    if (insta.error) errs.instagram = insta.error;
    if (desc.error) errs.descricao = desc.error;
    if (end.error) errs.endereco = end.error;
    if (hor.error) errs.horario = hor.error;
    if (comodidades.length > 20) errs.comodidades = 'Use no máximo 20 comodidades.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const patch = {
        nome: nome.value,
        categoria: f.categoria,
        descricao: desc.value,
        endereco: end.value,
        praiaId: f.praiaId || null,
        whatsapp: wpp.value,
        instagram: insta.value,
        horario: hor.value,
        faixaPreco: f.faixaPreco,
        comodidades,
      };
      await api.atualizarComerciante(biz.id, patch);
      onUpdated({ ...biz, ...patch });
      setMsg({ kind: 'ok', text: 'Alterações salvas.' });
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-3.5">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Field label="Nome do estabelecimento" error={errors.nome}>
        <input className={inputCls} value={f.nome} onChange={set('nome')} maxLength={120} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="Categoria">
          <select className={inputCls} value={f.categoria} onChange={set('categoria')}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Praia">
          <select className={inputCls} value={f.praiaId} onChange={set('praiaId')}>
            <option value="">Outra região</option>
            {beaches.map((b) => <option key={b.dbId} value={b.dbId}>{b.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descrição" hint={`${f.descricao.length}/300`} error={errors.descricao}>
        <textarea className={inputCls} rows={3} value={f.descricao} onChange={set('descricao')} maxLength={300} />
      </Field>
      <Field label="Endereço ou ponto de referência" error={errors.endereco}>
        <input className={inputCls} value={f.endereco} onChange={set('endereco')} maxLength={200} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="WhatsApp" error={errors.whatsapp}>
          <input className={inputCls} value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" placeholder="(22) 99876-5432" />
        </Field>
        <Field label="Instagram" error={errors.instagram}>
          <input className={inputCls} value={f.instagram} onChange={set('instagram')} placeholder="@seunegocio" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="Horário de funcionamento" error={errors.horario}>
          <input className={inputCls} value={f.horario} onChange={set('horario')} placeholder="Todos os dias, 9h às 18h" maxLength={200} />
        </Field>
        <Field label="Faixa de preço">
          <select className={inputCls} value={f.faixaPreco} onChange={set('faixaPreco')}>
            <option value="">Não informar</option>
            <option value="$">$ (econômico)</option>
            <option value="$$">$$ (moderado)</option>
            <option value="$$$">$$$ (premium)</option>
          </select>
        </Field>
      </div>
      <Field label="Comodidades" hint="Separe por vírgula. Ex.: Wi-Fi, Estacionamento, Chuveiro" error={errors.comodidades}>
        <input className={inputCls} value={f.comodidades} onChange={set('comodidades')} />
      </Field>
      <button type="submit" disabled={saving} className={btnPrimary}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar alterações
      </button>
    </form>
  );
};

// ------------------------------------------------------------------ fotos
const FotosTab: React.FC<{ biz: BusinessDetails; onUpdated: (b: BusinessDetails) => void }> = ({ biz, onUpdated }) => {
  const [error, setError] = useState<string | null>(null);

  const change = async (fotos: string[]) => {
    setError(null);
    onUpdated({ ...biz, fotos });
    try {
      await api.atualizarComerciante(biz.id, { fotos });
    } catch (err) {
      setError(translateDbError(err));
    }
  };

  return (
    <div className="space-y-3">
      {error && <Notice kind="error">{error}</Notice>}
      <p className="text-sm text-slate-600">A primeira foto é a capa que aparece na vitrine do site.</p>
      <PhotoUploader urls={biz.fotos} onChange={(u) => void change(u)} folder={biz.id} max={10} />
    </div>
  );
};

// ------------------------------------------------------------------ cardápio
const emptyProduct = { id: '', nome: '', preco: '', aPartirDe: false, descricao: '', ativo: true };

const CardapioTab: React.FC<{ biz: BusinessDetails; onSaved: () => void }> = ({ biz, onSaved }) => {
  const [items, setItems] = useState<Product[] | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const load = useCallback(
    () => api.fetchProdutos(biz.id).then(setItems).catch((e) => setMsg({ kind: 'error', text: translateDbError(e) })),
    [biz.id]
  );
  useEffect(() => void load(), [load]);

  const run = async (fn: () => Promise<void>, okText?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      await load();
      onSaved();
      if (okText) setMsg({ kind: 'ok', text: okText });
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = form.nome.trim();
    const preco = Number(form.preco.replace(',', '.'));
    if (nome.length < 2) return setMsg({ kind: 'error', text: 'Informe o nome (mínimo 2 letras).' });
    if (!Number.isFinite(preco) || preco < 0 || form.preco.trim() === '') return setMsg({ kind: 'error', text: 'Informe um preço válido, como 25,90.' });
    if (form.descricao.length > 500) return setMsg({ kind: 'error', text: 'A descrição pode ter no máximo 500 caracteres.' });
    void run(async () => {
      await api.salvarProduto({
        id: form.id || undefined,
        comercianteId: biz.id,
        nome,
        preco: Math.round(preco * 100) / 100,
        aPartirDe: form.aPartirDe,
        descricao: form.descricao.trim() || null,
        ativo: form.ativo,
      });
      setForm(emptyProduct);
      setEditing(false);
    }, 'Item salvo.');
  };

  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {items === null ? (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum item ainda. Adicione o primeiro abaixo.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border border-slate-200 rounded-xl p-2.5">
              <button
                type="button"
                title={p.destaque ? 'Remover destaque' : 'Marcar como destaque da vitrine'}
                onClick={() => void run(() => api.definirProdutoDestaque(biz.id, p.destaque ? null : p.id))}
                className="p-1.5 cursor-pointer"
              >
                <Star className={`w-4 h-4 ${p.destaque ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate ${p.ativo ? '' : 'text-slate-400 line-through'}`}>{p.nome}</p>
                <p className="text-xs text-slate-500">{formatPrice(p.preco, p.aPartirDe)}{p.ativo ? '' : ' • oculto'}</p>
              </div>
              <button type="button" aria-label="Editar" className={btnGhost} onClick={() => {
                setForm({ id: p.id, nome: p.nome, preco: String(p.preco).replace('.', ','), aPartirDe: p.aPartirDe, descricao: p.descricao, ativo: p.ativo });
                setEditing(true);
              }}><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label="Excluir" className={btnGhost} onClick={() => {
                if (window.confirm(`Excluir "${p.nome}"?`)) void run(() => api.removerProduto(p.id));
              }}><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{editing ? 'Editar item' : 'Novo item'}</p>
        <div className="grid sm:grid-cols-[1fr_140px] gap-3">
          <Field label="Nome">
            <input className={inputCls} value={form.nome} maxLength={120} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <Field label="Preço (R$)">
            <input className={inputCls} value={form.preco} inputMode="decimal" placeholder="25,90" onChange={(e) => setForm({ ...form, preco: e.target.value })} />
          </Field>
        </div>
        <Field label="Descrição (opcional)">
          <textarea className={inputCls} rows={2} maxLength={500} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </Field>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.aPartirDe} onChange={(e) => setForm({ ...form, aPartirDe: e.target.checked })} /> Preço "a partir de"</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Visível no site</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {editing ? 'Salvar item' : 'Adicionar item'}
          </button>
          {editing && <button type="button" className={btnGhost} onClick={() => { setForm(emptyProduct); setEditing(false); }}>Cancelar</button>}
        </div>
      </form>
    </div>
  );
};

// ------------------------------------------------------------------ promoções e eventos
const emptyEvent = { id: '', tipo: 'promocao' as 'promocao' | 'evento', titulo: '', descricao: '', dataInicio: '', dataFim: '', horario: '', categoria: 'Gastronomia' as EventCategory, linkUrl: '' };
const PLANO_NOME: Record<string, string> = { gratuito: 'Gratuito (sem promoções)', pago: 'Pro (até 3 promoções ativas)', premium: 'Master (promoções ilimitadas)' };

const PromocoesTab: React.FC<{ biz: BusinessDetails; onSaved: () => void }> = ({ biz, onSaved }) => {
  const [items, setItems] = useState<BusinessEvent[] | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const load = useCallback(
    () => api.fetchEventosDoComerciante(biz.id).then(setItems).catch((e) => setMsg({ kind: 'error', text: translateDbError(e) })),
    [biz.id]
  );
  useEffect(() => void load(), [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const titulo = form.titulo.trim();
    if (titulo.length < 3) return setMsg({ kind: 'error', text: 'O título precisa ter pelo menos 3 letras.' });
    if (!form.dataInicio) return setMsg({ kind: 'error', text: 'Informe a data de início.' });
    if (form.dataFim && form.dataFim < form.dataInicio) return setMsg({ kind: 'error', text: 'A data final não pode ser antes da inicial.' });
    if (form.linkUrl && !/^https?:\/\//i.test(form.linkUrl)) return setMsg({ kind: 'error', text: 'O link precisa começar com http:// ou https://.' });
    setBusy(true);
    try {
      await api.salvarEvento({
        id: form.id || undefined,
        comercianteId: biz.id,
        tipo: form.tipo,
        titulo,
        descricao: form.descricao.trim() || null,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim || null,
        horario: form.horario.trim() || null,
        categoria: form.tipo === 'evento' ? form.categoria : null,
        linkUrl: form.linkUrl.trim() || null,
      });
      setForm(emptyEvent);
      setEditing(false);
      await load();
      onSaved();
      setMsg({ kind: 'ok', text: 'Salvo.' });
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, titulo: string) => {
    if (!window.confirm(`Excluir "${titulo}"?`)) return;
    try {
      await api.removerEvento(id);
      await load();
      onSaved();
    } catch (err) {
      setMsg({ kind: 'error', text: translateDbError(err) });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Seu plano: <b>{PLANO_NOME[biz.plano]}</b></p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {items === null ? (
        <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nada cadastrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id} className="flex items-center gap-2 border border-slate-200 rounded-xl p-2.5">
              <span className={`text-[10px] font-black uppercase rounded-md px-2 py-0.5 ${ev.tipo === 'promocao' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                {ev.tipo === 'promocao' ? 'Promoção' : 'Evento'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{ev.titulo}</p>
                <p className="text-xs text-slate-500">{ev.dataInicio}{ev.dataFim ? ` → ${ev.dataFim}` : ''}</p>
              </div>
              <button type="button" aria-label="Editar" className={btnGhost} onClick={() => {
                setForm({ id: ev.id, tipo: ev.tipo, titulo: ev.titulo, descricao: ev.descricao, dataInicio: ev.dataInicio, dataFim: ev.dataFim, horario: ev.horario, categoria: ev.categoria ?? 'Gastronomia', linkUrl: ev.linkUrl });
                setEditing(true);
              }}><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label="Excluir" className={btnGhost} onClick={() => void remove(ev.id, ev.titulo)}><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{editing ? 'Editar' : 'Nova promoção ou evento'}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tipo">
            <select className={inputCls} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'promocao' | 'evento' })}>
              <option value="promocao">Promoção</option>
              <option value="evento">Evento</option>
            </select>
          </Field>
          {form.tipo === 'evento' && (
            <Field label="Categoria">
              <select className={inputCls} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as EventCategory })}>
                {EVENT_CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
        </div>
        <Field label="Título">
          <input className={inputCls} value={form.titulo} maxLength={150} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </Field>
        <Field label="Descrição (opcional)">
          <textarea className={inputCls} rows={2} maxLength={1000} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Início"><input type="date" className={inputCls} value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} /></Field>
          <Field label="Fim (opcional)"><input type="date" className={inputCls} value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} /></Field>
          <Field label="Horário"><input className={inputCls} value={form.horario} maxLength={100} placeholder="18h às 22h" onChange={(e) => setForm({ ...form, horario: e.target.value })} /></Field>
        </div>
        <Field label="Link (opcional)">
          <input className={inputCls} value={form.linkUrl} placeholder="https://" onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
        </Field>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {editing ? 'Salvar' : 'Adicionar'}
          </button>
          {editing && <button type="button" className={btnGhost} onClick={() => { setForm(emptyEvent); setEditing(false); }}>Cancelar</button>}
        </div>
      </form>
    </div>
  );
};
