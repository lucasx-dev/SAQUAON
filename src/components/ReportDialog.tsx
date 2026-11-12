import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type ReportReason, type ReportTarget } from '../lib/api';
import { translateDbError } from '../lib/validation';
import { btnGhost, btnPrimary, Field, inputCls, Modal, Notice } from './ui/Modal';

export interface ReportTargetInfo {
  tipo: ReportTarget;
  id: string;
  titulo: string;
}

const MOTIVOS: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam ou propaganda indevida' },
  { id: 'ofensivo', label: 'Conteúdo ofensivo ou desrespeitoso' },
  { id: 'falso', label: 'Informação falsa ou enganosa' },
  { id: 'outro', label: 'Outro motivo' },
];

export const ReportDialog: React.FC<{ target: ReportTargetInfo | null; onClose: () => void }> = ({ target, onClose }) => {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState<ReportReason>('spam');
  const [detalhe, setDetalhe] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (target) {
      setMotivo('spam');
      setDetalhe('');
      setError(null);
      setDone(false);
    }
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !user) return;
    if (motivo === 'outro' && detalhe.trim().length < 5) return setError('Conte rapidamente o que aconteceu.');
    setBusy(true);
    setError(null);
    try {
      await api.denunciar({ usuarioId: user.id, alvoTipo: target.tipo, alvoId: target.id, motivo, detalhe: detalhe.trim() || null });
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') setDone(true); // já denunciou: tratamos como sucesso
      else setError(translateDbError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title="Denunciar" subtitle={target?.titulo}>
      {done ? (
        <div className="space-y-4">
          <Notice kind="ok">Recebemos a sua denúncia. A equipe do SAQUA ON vai analisar. Obrigado por ajudar a cuidar da comunidade.</Notice>
          <button type="button" className={btnPrimary} onClick={onClose}>Fechar</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5" noValidate>
          {error && <Notice kind="error">{error}</Notice>}
          <Field label="Qual é o problema?">
            <select className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value as ReportReason)}>
              {MOTIVOS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Detalhes (opcional)" hint={`${detalhe.length}/500`}>
            <textarea className={inputCls} rows={3} maxLength={500} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enviar denúncia
            </button>
            <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      )}
    </Modal>
  );
};
