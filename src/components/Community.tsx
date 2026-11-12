import React, { useCallback, useEffect, useState } from 'react';
import { EyeOff, Flag, Loader2, MessageCircle, Send, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api, type Post, type PostComment } from '../lib/api';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getInitials } from '../lib/format';
import { translateDbError } from '../lib/validation';
import { PhotoUploader } from './PhotoUploader';
import { inputCls } from './ui/Modal';
import type { ReportTargetInfo } from './ReportDialog';

interface CommunityProps {
  onReport: (target: ReportTargetInfo) => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const Community: React.FC<CommunityProps> = ({ onReport }) => {
  const { user, isAdmin, requireAuth } = useAuth();
  const { beaches } = useData();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [praiaId, setPraiaId] = useState('');
  const [foto, setFoto] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setPosts([]);
      return;
    }
    try {
      setPosts(await api.fetchPublicacoes(30));
      setError(null);
    } catch (err) {
      setError(translateDbError(err));
      setPosts([]);
    }
  }, []);

  // recarrega quando a pessoa entra/sai (quem está logado enxerga os próprios posts ocultos)
  useEffect(() => void load(), [load, user?.id]);

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(
      async () => {
        const conteudo = text.trim();
        if (conteudo.length < 3) return setFormError('Escreva pelo menos 3 caracteres.');
        setSending(true);
        setFormError(null);
        try {
          // `user` pode estar desatualizado se a pessoa acabou de entrar: pergunta à sessão atual
          const id = (await supabase.auth.getUser()).data.user?.id;
          if (!id) throw { code: '42501' };
          await api.criarPublicacao({ usuarioId: id, conteudo, praiaId: praiaId || null, fotoUrl: foto[0] ?? null });
          setText('');
          setFoto([]);
          await load();
        } catch (err) {
          setFormError(translateDbError(err));
        } finally {
          setSending(false);
        }
      },
      { view: 'cadastro', tipo: 'turista' }
    );
  };

  const removePost = async (p: Post) => {
    if (!window.confirm('Excluir esta publicação?')) return;
    try {
      await api.removerPublicacao(p.id, p.usuarioId === user?.id ? p.fotoUrl : null);
      await load();
    } catch (err) {
      setError(translateDbError(err));
    }
  };

  const toggleHidden = async (p: Post) => {
    try {
      await api.adminModerar('publicacao', p.id, p.status === 'publicada');
      await load();
    } catch (err) {
      setError(translateDbError(err));
    }
  };

  return (
    <section id="comunidade" className="py-16 sm:py-20 bg-white border-y border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#4FA8D8]">Comunidade</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#004F8A] mt-1">Como está a praia agora?</h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Moradores e visitantes compartilham dicas, fotos e avisos em tempo real.
          </p>
        </div>

        <form onSubmit={publish} className="bg-[#FAF5EE] rounded-3xl p-4 sm:p-5 border border-slate-200 mb-8 space-y-3">
          <textarea
            className={inputCls}
            rows={3}
            maxLength={1000}
            placeholder={user ? 'Compartilhe algo com a comunidade...' : 'Entre na sua conta para publicar...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Nova publicação"
          />
          {user && <PhotoUploader urls={foto} onChange={setFoto} folder="posts" max={1} label="Foto" />}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <select className={`${inputCls} sm:max-w-[220px]`} value={praiaId} onChange={(e) => setPraiaId(e.target.value)} aria-label="Praia">
              <option value="">Qual praia? (opcional)</option>
              {beaches.map((b) => <option key={b.dbId} value={b.dbId}>{b.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#004F8A] hover:bg-[#003d6b] disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 cursor-pointer"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {user ? 'Publicar' : 'Entrar para publicar'}
            </button>
          </div>
          {formError && <p className="text-xs text-red-600" role="alert">{formError}</p>}
        </form>

        {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
        {posts === null ? (
          <p className="text-center text-slate-500 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-500 text-sm">Ainda não há publicações. Seja a primeira pessoa a compartilhar!</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                canDelete={!!user && (p.usuarioId === user.id || isAdmin)}
                isAdmin={isAdmin}
                onDelete={() => void removePost(p)}
                onToggleHidden={() => void toggleHidden(p)}
                onReport={() => requireAuth(() => onReport({ tipo: 'publicacao', id: p.id, titulo: p.conteudo.slice(0, 60) }), { view: 'login' })}
                onReportComment={(c) => requireAuth(() => onReport({ tipo: 'comentario', id: c.id, titulo: c.conteudo.slice(0, 60) }), { view: 'login' })}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

interface PostCardProps {
  post: Post;
  canDelete: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onToggleHidden: () => void;
  onReport: () => void;
  onReportComment: (c: PostComment) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, canDelete, isAdmin, onDelete, onToggleHidden, onReport, onReportComment }) => {
  const { user, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setComments(await api.fetchComentarios(post.id));
    } catch (err) {
      setError(translateDbError(err));
      setComments([]);
    }
  }, [post.id]);

  useEffect(() => {
    if (open && comments === null) void loadComments();
  }, [open, comments, loadComments]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const conteudo = text.trim();
    if (!conteudo) return;
    requireAuth(
      async () => {
        const id = (await supabase.auth.getUser()).data.user?.id;
        if (!id) return;
        setBusy(true);
        setError(null);
        try {
          await api.criarComentario({ usuarioId: id, publicacaoId: post.id, conteudo });
          setText('');
          await loadComments();
        } catch (err) {
          setError(translateDbError(err));
        } finally {
          setBusy(false);
        }
      },
      { view: 'login' }
    );
  };

  const removeComment = async (c: PostComment) => {
    try {
      await api.removerComentario(c.id);
      await loadComments();
    } catch (err) {
      setError(translateDbError(err));
    }
  };

  const toggleComment = async (c: PostComment) => {
    try {
      await api.adminModerar('comentario', c.id, c.status === 'publicada');
      await loadComments();
    } catch (err) {
      setError(translateDbError(err));
    }
  };

  return (
    <li className={`bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm ${post.status === 'oculta' ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-full bg-[#004F8A] text-white text-xs font-black flex items-center justify-center shrink-0">{getInitials(post.autor)}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0A1E2F] truncate">{post.autor}</p>
          <p className="text-[11px] text-slate-500">{fmt(post.criadoEm)}{post.praia ? ` • ${post.praia}` : ''}</p>
        </div>
        {post.status === 'oculta' && <span className="ml-auto text-[10px] font-black uppercase bg-slate-200 text-slate-700 rounded-md px-2 py-0.5">Oculta</span>}
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{post.conteudo}</p>
      {post.fotoUrl && <img src={post.fotoUrl} alt="Foto da publicação" loading="lazy" className="mt-3 rounded-2xl max-h-96 w-full object-cover" />}

      <div className="flex flex-wrap items-center gap-1 mt-3 -ml-2 text-xs font-bold text-slate-600">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
          <MessageCircle className="w-4 h-4" /> Comentários
        </button>
        <button type="button" onClick={onReport} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
          <Flag className="w-4 h-4" /> Denunciar
        </button>
        {isAdmin && (
          <button type="button" onClick={onToggleHidden} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            {post.status === 'publicada' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {post.status === 'publicada' ? 'Ocultar' : 'Reexibir'}
          </button>
        )}
        {canDelete && (
          <button type="button" onClick={onDelete} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer">
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {comments === null ? (
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-500">Sem comentários ainda.</p>
          ) : (
            <ul className="space-y-2.5">
              {comments.map((c) => (
                <li key={c.id} className={`text-sm bg-slate-50 rounded-2xl px-3.5 py-2.5 ${c.status === 'oculta' ? 'opacity-60' : ''}`}>
                  <p className="text-xs font-bold text-slate-700">{c.autor} <span className="font-normal text-slate-400">• {fmt(c.criadoEm)}{c.status === 'oculta' ? ' • oculto' : ''}</span></p>
                  <p className="text-slate-800 break-words whitespace-pre-wrap">{c.conteudo}</p>
                  <div className="flex gap-3 mt-1 text-[11px] font-bold text-slate-500">
                    <button type="button" className="hover:text-slate-800 cursor-pointer" onClick={() => onReportComment(c)}>Denunciar</button>
                    {isAdmin && <button type="button" className="hover:text-slate-800 cursor-pointer" onClick={() => void toggleComment(c)}>{c.status === 'publicada' ? 'Ocultar' : 'Reexibir'}</button>}
                    {user && (c.usuarioId === user.id || isAdmin) && <button type="button" className="hover:text-red-600 cursor-pointer" onClick={() => void removeComment(c)}>Excluir</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={send} className="flex gap-2">
            <input className={inputCls} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Escreva um comentário..." aria-label="Comentário" />
            <button type="submit" disabled={busy} aria-label="Enviar comentário" className="shrink-0 rounded-xl bg-[#004F8A] text-white px-3.5 disabled:opacity-60 cursor-pointer">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        </div>
      )}
    </li>
  );
};
