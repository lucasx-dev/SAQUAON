import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { formatDateRange, formatPlanPrice, formatPrice } from './format';
import type {
  BeachCondition,
  KioskMerchant,
  LocalEvent,
  MerchantCategory,
  MerchantTier,
  PlanCode,
  Profile,
  SafetyFlag,
  Testimonial,
} from '../types';

interface PraiaRow {
  id: string;
  slug: string;
  nome: string;
  subtitulo: string | null;
  slogan: string | null;
  imagem_url: string | null;
  altura_ondas: string | null;
  periodo_ondas: string | null;
  direcao_ondas: string | null;
  vento_velocidade: string | null;
  vento_direcao: string | null;
  temperatura_agua: string | null;
  mare: BeachCondition['tide'] | null;
  nivel_mare: string | null;
  lotacao: BeachCondition['crowdLevel'] | null;
  bandeira: SafetyFlag;
  mensagem_seguranca: string | null;
  ideal_para: string[] | null;
  recursos: string[] | null;
}

interface PlanoRow {
  codigo: PlanCode;
  nome: string;
  selo: string | null;
  preco_mensal: number | string;
  periodo: string | null;
  descricao: string | null;
  recursos: string[] | null;
  destaque: boolean;
  texto_botao: string | null;
}

/** Linha da view vw_comerciantes */
interface ComercianteRow {
  id: string;
  slug: string | null;
  nome_negocio: string;
  categoria: MerchantCategory;
  descricao: string | null;
  endereco: string | null;
  praia_nome: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  whatsapp: string;
  instagram: string | null;
  fotos: string[] | null;
  comodidades: string[] | null;
  faixa_preco: '$' | '$$' | '$$$' | null;
  verificado: boolean;
  nota_media: number | string | null;
  total_avaliacoes: number | null;
  produto_destaque: string | null;
  produto_destaque_preco: number | string | null;
  produto_destaque_a_partir_de: boolean | null;
  produto_destaque_descricao: string | null;
  promocao: string | null;
}

interface EventoRow {
  id: string;
  slug: string | null;
  titulo: string;
  descricao: string | null;
  local: string | null;
  data_inicio: string;
  data_fim: string | null;
  horario: string | null;
  categoria: LocalEvent['category'] | null;
  selo: string | null;
  imagem_url: string | null;
  link_url: string | null;
}

interface DepoimentoRow {
  id: string;
  autor: string;
  funcao: string | null;
  localizacao: string | null;
  avatar_url: string | null;
  conteudo: string;
  nota: number;
}

const mapPraia = (r: PraiaRow): BeachCondition => ({
  id: r.slug,
  dbId: r.id,
  name: r.nome,
  subtitle: r.subtitulo ?? '',
  tagline: r.slogan ?? '',
  image: r.imagem_url ?? '',
  swellHeight: r.altura_ondas ?? '-',
  swellPeriod: r.periodo_ondas ?? '-',
  swellDirection: r.direcao_ondas ?? '-',
  windSpeed: r.vento_velocidade ?? '-',
  windDirection: r.vento_direcao ?? '-',
  waterTemp: r.temperatura_agua ?? '-',
  tide: r.mare ?? 'Estável',
  tideLevel: r.nivel_mare ?? '-',
  crowdLevel: r.lotacao ?? 'Moderado',
  safetyFlag: r.bandeira,
  safetyMessage: r.mensagem_seguranca ?? '',
  idealFor: r.ideal_para ?? [],
  features: r.recursos ?? [],
});

const mapPlano = (r: PlanoRow): MerchantTier => ({
  id: r.codigo,
  name: r.nome,
  badge: r.selo ?? '',
  price: formatPlanPrice(Number(r.preco_mensal)),
  period: r.periodo ?? '',
  description: r.descricao ?? '',
  features: r.recursos ?? [],
  highlight: r.destaque,
  ctaText: r.texto_botao ?? 'Cadastrar',
});

const mapComerciante = (r: ComercianteRow): KioskMerchant => ({
  id: r.id,
  slug: r.slug ?? undefined,
  name: r.nome_negocio,
  category: r.categoria,
  beach: r.praia_nome ?? 'Outra região de Saquarema',
  rating: Number(r.nota_media) || 0,
  reviewCount: r.total_avaliacoes ?? 0,
  verified: r.verificado,
  image: r.fotos?.[0] ?? '',
  specialty: r.descricao ?? '',
  priceRange: r.faixa_preco ?? undefined,
  amenities: r.comodidades ?? [],
  whatsAppNumber: r.whatsapp,
  instagram: r.instagram ?? undefined,
  featuredDish: r.produto_destaque ?? undefined,
  featuredPrice:
    r.produto_destaque_preco != null
      ? formatPrice(Number(r.produto_destaque_preco), r.produto_destaque_a_partir_de ?? false)
      : undefined,
  featuredNote: r.produto_destaque_descricao ?? undefined,
  distanceOrAddress: r.endereco ?? r.praia_nome ?? 'Saquarema, RJ',
  promo: r.promocao ?? undefined,
  lat: r.latitude != null ? Number(r.latitude) : undefined,
  lng: r.longitude != null ? Number(r.longitude) : undefined,
});

const mapEvento = (r: EventoRow): LocalEvent => ({
  id: r.slug ?? r.id,
  title: r.titulo,
  date: formatDateRange(r.data_inicio, r.data_fim),
  time: r.horario ?? '',
  location: r.local ?? '',
  category: r.categoria ?? 'Surf & Esporte',
  image: r.imagem_url ?? '',
  description: r.descricao ?? '',
  badge: r.selo ?? 'Evento',
  link: r.link_url ?? undefined,
});

const mapDepoimento = (r: DepoimentoRow): Testimonial => ({
  id: r.id,
  author: r.autor,
  role: r.funcao ?? '',
  location: r.localizacao ?? '',
  avatar: r.avatar_url ?? '',
  content: r.conteudo,
  rating: r.nota,
});

export interface NewMerchantInput {
  usuarioId: string;
  nome: string;
  categoria: MerchantCategory;
  praiaId: string | null;
  whatsapp: string;
  instagram: string | null;
  endereco: string | null;
  descricao: string | null;
  planoSolicitado: PlanCode;
}

export interface MyBusiness {
  id: string;
  nome: string;
  categoria: string;
  plano: PlanCode;
  planoSolicitado: PlanCode | null;
  status: 'ativo' | 'inativo' | 'suspenso';
  verificado: boolean;
  praia: string | null;
}

export interface Review {
  id: string;
  nota: number;
  comentario: string | null;
  autor: string;
  data: string;
}

export interface SaveReviewInput {
  existingId?: string;
  userId: string;
  comercianteId: string;
  nota: number;
  comentario: string | null;
}

// ---------------------------------------------------------------- gestão do estabelecimento
export interface BusinessDetails {
  id: string;
  nome: string;
  categoria: MerchantCategory;
  descricao: string;
  endereco: string;
  praiaId: string | null;
  whatsapp: string;
  instagram: string;
  horario: string;
  faixaPreco: '$' | '$$' | '$$$' | '';
  comodidades: string[];
  fotos: string[];
  plano: PlanCode;
}

export type BusinessPatch = Partial<Omit<BusinessDetails, 'id' | 'plano'>>;

export interface Product {
  id: string;
  nome: string;
  preco: number;
  aPartirDe: boolean;
  descricao: string;
  destaque: boolean;
  ativo: boolean;
}

export interface ProductInput {
  id?: string;
  comercianteId: string;
  nome: string;
  preco: number;
  aPartirDe: boolean;
  descricao: string | null;
  ativo: boolean;
}

export type EventCategory = 'Surf & Esporte' | 'Música & Cultura' | 'Gastronomia' | 'Sustentabilidade';

export interface BusinessEvent {
  id: string;
  tipo: 'evento' | 'promocao';
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  horario: string;
  categoria: EventCategory | null;
  linkUrl: string;
}

export interface BusinessEventInput {
  id?: string;
  comercianteId: string;
  tipo: 'evento' | 'promocao';
  titulo: string;
  descricao: string | null;
  dataInicio: string;
  dataFim: string | null;
  horario: string | null;
  categoria: EventCategory | null;
  linkUrl: string | null;
}

// ---------------------------------------------------------------- comunidade
export interface Post {
  id: string;
  autor: string;
  conteudo: string;
  fotoUrl: string | null;
  praiaId: string | null;
  praia: string | null;
  status: 'publicada' | 'oculta';
  criadoEm: string;
  /** só vem preenchido para quem está logado */
  usuarioId: string | null;
}

export interface PostComment {
  id: string;
  publicacaoId: string;
  autor: string;
  conteudo: string;
  status: 'publicada' | 'oculta';
  criadoEm: string;
  usuarioId: string | null;
}

export type ReportTarget = 'publicacao' | 'comentario' | 'estabelecimento';
export type ReportReason = 'spam' | 'ofensivo' | 'falso' | 'outro';

export interface ReportInput {
  usuarioId: string;
  alvoTipo: ReportTarget;
  alvoId: string;
  motivo: ReportReason;
  detalhe: string | null;
}

// ---------------------------------------------------------------- administrador
export interface AdminBusiness {
  id: string;
  nome: string;
  categoria: string;
  plano: PlanCode;
  planoSolicitado: PlanCode | null;
  status: 'ativo' | 'inativo' | 'suspenso';
  verificado: boolean;
  dono: string;
  email: string;
  criadoEm: string;
}

export interface AdminBusinessPatch {
  plano?: PlanCode;
  planoSolicitado?: PlanCode | null;
  status?: 'ativo' | 'inativo' | 'suspenso';
  verificado?: boolean;
}

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  tipo: Profile['tipo'];
  criadoEm: string;
}

export type ReportStatus = 'aberta' | 'resolvida' | 'descartada';

export interface AdminReport {
  id: string;
  alvoTipo: ReportTarget;
  alvoId: string;
  motivo: ReportReason;
  detalhe: string;
  status: ReportStatus;
  criadoEm: string;
  denunciante: string;
  resumo: string;
  alvoStatus: string;
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
/** Tamanho máximo da foto escolhida; ela é reduzida antes de ir para o Storage. */
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_PHOTO_SIDE = 1600;
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Reduz a foto no navegador (lado maior até 1600 px, WebP ou JPEG qualidade ~82%)
 * para gastar pouco espaço no Storage. Se algo falhar, devolve o arquivo original.
 */
export async function comprimirImagem(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, MAX_PHOTO_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * escala));
    const h = Math.max(1, Math.round(bmp.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.82));
    let blob = await toBlob('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
    if (!blob || !PHOTO_TYPES[blob.type]) return file;
    // só troca se realmente ficou menor (ou se a foto foi redimensionada)
    if (blob.size >= file.size && escala === 1) return file;
    const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${base}.${PHOTO_TYPES[blob.type]}`, { type: blob.type });
  } catch {
    return file;
  }
}

export function createApi(client: SupabaseClient) {
  async function fetchPraias(): Promise<BeachCondition[]> {
    const { data, error } = await client.from('praias').select('*').order('ordem');
    if (error) throw error;
    return ((data ?? []) as PraiaRow[]).map(mapPraia);
  }

  async function fetchPlanos(): Promise<MerchantTier[]> {
    const { data, error } = await client.from('planos').select('*').order('ordem');
    if (error) throw error;
    return ((data ?? []) as PlanoRow[]).map(mapPlano);
  }

  /** Estabelecimentos ativos, com os planos pagos primeiro (posicionamento prioritário). */
  async function fetchComerciantes(): Promise<KioskMerchant[]> {
    const { data, error } = await client
      .from('vw_comerciantes')
      .select('*')
      .order('plano_ordem', { ascending: false })
      .order('nota_media', { ascending: false })
      .order('nome_negocio');
    if (error) throw error;
    return ((data ?? []) as ComercianteRow[]).map(mapComerciante);
  }

  async function fetchEventos(): Promise<LocalEvent[]> {
    const { data, error } = await client
      .from('eventos')
      .select('*')
      .eq('tipo', 'evento')
      .order('data_inicio', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as EventoRow[]).map(mapEvento);
  }

  async function fetchDepoimentos(): Promise<Testimonial[]> {
    const { data, error } = await client.from('depoimentos').select('*').eq('ativo', true).order('ordem');
    if (error) throw error;
    return ((data ?? []) as DepoimentoRow[]).map(mapDepoimento);
  }

  async function fetchPerfil(userId: string): Promise<Profile | null> {
    const { data, error } = await client
      .from('usuarios')
      .select('id, nome, email, tipo')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as Profile | null) ?? null;
  }

  async function fetchMeusComerciantes(userId: string): Promise<MyBusiness[]> {
    const { data, error } = await client
      .from('comerciantes')
      .select('id, nome_negocio, categoria, plano_codigo, plano_solicitado, status, verificado, praias(nome)')
      .eq('usuario_id', userId)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      nome: r.nome_negocio,
      categoria: r.categoria,
      plano: r.plano_codigo,
      planoSolicitado: r.plano_solicitado,
      status: r.status,
      verificado: r.verificado,
      praia: r.praias?.nome ?? null,
    }));
  }

  async function criarComerciante(input: NewMerchantInput): Promise<{ id: string }> {
    const { data, error } = await client
      .from('comerciantes')
      .insert({
        usuario_id: input.usuarioId,
        nome_negocio: input.nome,
        categoria: input.categoria,
        praia_id: input.praiaId,
        whatsapp: input.whatsapp,
        instagram: input.instagram,
        endereco: input.endereco,
        descricao: input.descricao,
        plano_solicitado: input.planoSolicitado === 'gratuito' ? null : input.planoSolicitado,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data as { id: string };
  }

  async function fetchAvaliacoes(comercianteId: string, limit = 5): Promise<Review[]> {
    const { data, error } = await client
      .from('avaliacoes')
      .select('id, nota, comentario, autor_nome, data')
      .eq('comerciante_id', comercianteId)
      .not('comentario', 'is', null)
      .order('atualizado_em', { ascending: false })
      .limit(limit);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      nota: r.nota,
      comentario: r.comentario,
      autor: r.autor_nome,
      data: r.data,
    }));
  }

  async function fetchMinhaAvaliacao(
    comercianteId: string,
    userId: string
  ): Promise<{ id: string; nota: number; comentario: string | null } | null> {
    const { data, error } = await client
      .from('avaliacoes')
      .select('id, nota, comentario')
      .eq('comerciante_id', comercianteId)
      .eq('usuario_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as { id: string; nota: number; comentario: string | null } | null;
  }
  
  async function salvarAvaliacao(input: SaveReviewInput): Promise<void> {
    if (input.existingId) {
      const { data, error } = await client
        .from('avaliacoes')
        .update({ nota: input.nota, comentario: input.comentario })
        .eq('id', input.existingId)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw { code: '42501', message: 'avaliação não encontrada' };
      return;
    }
    const { error } = await client.from('avaliacoes').insert({
      usuario_id: input.userId,
      comerciante_id: input.comercianteId,
      nota: input.nota,
      comentario: input.comentario,
    });
    if (error) throw error;
  }

  // ------------------------------------------------------------ fotos (Storage)
  /** Envia uma imagem para o bucket "fotos" e devolve a URL pública. */
  async function uploadFoto(original: File, userId: string, pasta: string): Promise<string> {
    if (!PHOTO_TYPES[original.type]) throw { code: 'P0001', message: 'Use uma imagem JPG, PNG ou WebP.' };
    if (original.size > MAX_INPUT_BYTES) throw { code: 'P0001', message: 'A foto pode ter no máximo 20 MB.' };
    const file = await comprimirImagem(original);
    if (file.size > MAX_PHOTO_BYTES) throw { code: 'P0001', message: 'A foto ficou grande demais. Tente uma imagem menor.' };
    const ext = PHOTO_TYPES[file.type];
    const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${userId}/${pasta}/${nome}`;
    // cacheControl de 1 ano: o navegador guarda a imagem e o Storage gasta menos banda
    const { error } = await client.storage
      .from('fotos')
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
    if (error) {
      const msg = String(error.message ?? '');
      if (/exceeded|too large|size/i.test(msg)) throw { code: 'P0001', message: 'A foto pode ter no máximo 5 MB.' };
      if (/row-level|policy|unauthorized/i.test(msg)) throw { code: '42501', message: msg };
      throw error;
    }
    return client.storage.from('fotos').getPublicUrl(path).data.publicUrl;
  }

  /** Apaga do Storage uma foto enviada pelo site (URLs externas são ignoradas). */
  async function removerFoto(url: string): Promise<void> {
    const marker = '/storage/v1/object/public/fotos/';
    const i = url.indexOf(marker);
    if (i < 0) return;
    const path = decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
    await client.storage.from('fotos').remove([path]);
  }

  // ------------------------------------------------------------ gestão do estabelecimento (UC14–UC17)
  async function fetchComercianteDetalhe(id: string): Promise<BusinessDetails> {
    const { data, error } = await client
      .from('comerciantes')
      .select('id, nome_negocio, categoria, descricao, endereco, praia_id, whatsapp, instagram, horario_funcionamento, faixa_preco, comodidades, fotos, plano_codigo')
      .eq('id', id)
      .single();
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = data as any;
    return {
      id: r.id,
      nome: r.nome_negocio,
      categoria: r.categoria,
      descricao: r.descricao ?? '',
      endereco: r.endereco ?? '',
      praiaId: r.praia_id,
      whatsapp: r.whatsapp,
      instagram: r.instagram ?? '',
      horario: r.horario_funcionamento ?? '',
      faixaPreco: r.faixa_preco ?? '',
      comodidades: r.comodidades ?? [],
      fotos: r.fotos ?? [],
      plano: r.plano_codigo,
    };
  }

  async function atualizarComerciante(id: string, patch: BusinessPatch): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.nome !== undefined) row.nome_negocio = patch.nome;
    if (patch.categoria !== undefined) row.categoria = patch.categoria;
    if (patch.descricao !== undefined) row.descricao = patch.descricao || null;
    if (patch.endereco !== undefined) row.endereco = patch.endereco || null;
    if (patch.praiaId !== undefined) row.praia_id = patch.praiaId;
    if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
    if (patch.instagram !== undefined) row.instagram = patch.instagram || null;
    if (patch.horario !== undefined) row.horario_funcionamento = patch.horario || null;
    if (patch.faixaPreco !== undefined) row.faixa_preco = patch.faixaPreco || null;
    if (patch.comodidades !== undefined) row.comodidades = patch.comodidades;
    if (patch.fotos !== undefined) row.fotos = patch.fotos;
    const { data, error } = await client.from('comerciantes').update(row).eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw { code: '42501', message: 'sem permissão' };
  }

  async function fetchProdutos(comercianteId: string): Promise<Product[]> {
    const { data, error } = await client
      .from('produtos_servicos')
      .select('id, nome, preco, preco_a_partir_de, descricao, destaque, ativo')
      .eq('comerciante_id', comercianteId)
      .order('destaque', { ascending: false })
      .order('criado_em');
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      nome: r.nome,
      preco: Number(r.preco),
      aPartirDe: r.preco_a_partir_de,
      descricao: r.descricao ?? '',
      destaque: r.destaque,
      ativo: r.ativo,
    }));
  }

  async function salvarProduto(input: ProductInput): Promise<void> {
    const row = {
      comerciante_id: input.comercianteId,
      nome: input.nome,
      preco: input.preco,
      preco_a_partir_de: input.aPartirDe,
      descricao: input.descricao,
      ativo: input.ativo,
    };
    const q = input.id
      ? client.from('produtos_servicos').update(row).eq('id', input.id)
      : client.from('produtos_servicos').insert(row);
    const { error } = await q;
    if (error) throw error;
  }

  async function removerProduto(id: string): Promise<void> {
    const { error } = await client.from('produtos_servicos').delete().eq('id', id);
    if (error) throw error;
  }

  /** O banco só aceita 1 destaque por estabelecimento: tira dos outros e marca este. */
  async function definirProdutoDestaque(comercianteId: string, produtoId: string | null): Promise<void> {
    const { error: e1 } = await client
      .from('produtos_servicos')
      .update({ destaque: false })
      .eq('comerciante_id', comercianteId)
      .eq('destaque', true);
    if (e1) throw e1;
    if (!produtoId) return;
    const { error: e2 } = await client.from('produtos_servicos').update({ destaque: true }).eq('id', produtoId);
    if (e2) throw e2;
  }

  async function fetchEventosDoComerciante(comercianteId: string): Promise<BusinessEvent[]> {
    const { data, error } = await client
      .from('eventos')
      .select('id, tipo, titulo, descricao, data_inicio, data_fim, horario, categoria, link_url')
      .eq('comerciante_id', comercianteId)
      .order('data_inicio', { ascending: false });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      tipo: r.tipo,
      titulo: r.titulo,
      descricao: r.descricao ?? '',
      dataInicio: r.data_inicio,
      dataFim: r.data_fim ?? '',
      horario: r.horario ?? '',
      categoria: r.categoria,
      linkUrl: r.link_url ?? '',
    }));
  }

  async function salvarEvento(input: BusinessEventInput): Promise<void> {
    const row = {
      comerciante_id: input.comercianteId,
      tipo: input.tipo,
      titulo: input.titulo,
      descricao: input.descricao,
      data_inicio: input.dataInicio,
      data_fim: input.dataFim,
      horario: input.horario,
      categoria: input.categoria,
      link_url: input.linkUrl,
    };
    const q = input.id ? client.from('eventos').update(row).eq('id', input.id) : client.from('eventos').insert(row);
    const { error } = await q;
    if (error) throw error;
  }

  async function removerEvento(id: string): Promise<void> {
    const { error } = await client.from('eventos').delete().eq('id', id);
    if (error) throw error;
  }

  // ------------------------------------------------------------ comunidade (UC06–UC08, UC12)
  async function fetchPublicacoes(limit = 20): Promise<Post[]> {
    const { data, error } = await client
      .from('publicacoes')
      .select('*, praias(nome)')
      .order('criado_em', { ascending: false })
      .limit(limit);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      autor: r.autor_nome,
      conteudo: r.conteudo,
      fotoUrl: r.foto_url,
      praiaId: r.praia_id,
      praia: r.praias?.nome ?? null,
      status: r.status,
      criadoEm: r.criado_em,
      usuarioId: r.usuario_id ?? null,
    }));
  }

  async function criarPublicacao(input: {
    usuarioId: string;
    conteudo: string;
    praiaId: string | null;
    fotoUrl: string | null;
  }): Promise<void> {
    const { error } = await client.from('publicacoes').insert({
      usuario_id: input.usuarioId,
      conteudo: input.conteudo,
      praia_id: input.praiaId,
      foto_url: input.fotoUrl,
    });
    if (error) throw error;
  }

  async function removerPublicacao(id: string, fotoUrl?: string | null): Promise<void> {
    const { error } = await client.from('publicacoes').delete().eq('id', id);
    if (error) throw error;
    if (fotoUrl) await removerFoto(fotoUrl).catch(() => undefined);
  }

  async function fetchComentarios(publicacaoId: string): Promise<PostComment[]> {
    const { data, error } = await client
      .from('comentarios')
      .select('*')
      .eq('publicacao_id', publicacaoId)
      .order('criado_em');
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      publicacaoId: r.publicacao_id,
      autor: r.autor_nome,
      conteudo: r.conteudo,
      status: r.status,
      criadoEm: r.criado_em,
      usuarioId: r.usuario_id ?? null,
    }));
  }

  async function criarComentario(input: { usuarioId: string; publicacaoId: string; conteudo: string }): Promise<void> {
    const { error } = await client.from('comentarios').insert({
      usuario_id: input.usuarioId,
      publicacao_id: input.publicacaoId,
      conteudo: input.conteudo,
    });
    if (error) throw error;
  }

  async function removerComentario(id: string): Promise<void> {
    const { error } = await client.from('comentarios').delete().eq('id', id);
    if (error) throw error;
  }

  async function denunciar(input: ReportInput): Promise<void> {
    const { error } = await client.from('denuncias').insert({
      usuario_id: input.usuarioId,
      alvo_tipo: input.alvoTipo,
      alvo_id: input.alvoId,
      motivo: input.motivo,
      detalhe: input.detalhe,
    });
    if (error) throw error;
  }

  // ------------------------------------------------------------ painel do administrador (UC18–UC20)
  async function adminFetchComerciantes(): Promise<AdminBusiness[]> {
    const { data, error } = await client
      .from('comerciantes')
      .select('id, nome_negocio, categoria, plano_codigo, plano_solicitado, status, verificado, criado_em, usuarios(nome, email)')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      nome: r.nome_negocio,
      categoria: r.categoria,
      plano: r.plano_codigo,
      planoSolicitado: r.plano_solicitado,
      status: r.status,
      verificado: r.verificado,
      dono: r.usuarios?.nome ?? '—',
      email: r.usuarios?.email ?? '',
      criadoEm: r.criado_em,
    }));
  }

  async function adminAtualizarComerciante(id: string, patch: AdminBusinessPatch): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.plano !== undefined) row.plano_codigo = patch.plano;
    if (patch.planoSolicitado !== undefined) row.plano_solicitado = patch.planoSolicitado;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.verificado !== undefined) row.verificado = patch.verificado;
    const { data, error } = await client.from('comerciantes').update(row).eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw { code: '42501', message: 'sem permissão' };
  }

  async function adminFetchUsuarios(): Promise<AdminUser[]> {
    const { data, error } = await client
      .from('usuarios')
      .select('id, nome, email, tipo, criado_em')
      .order('criado_em', { ascending: false })
      .limit(300);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      tipo: r.tipo,
      criadoEm: r.criado_em,
    }));
  }

  async function adminDefinirTipo(usuarioId: string, tipo: Profile['tipo']): Promise<void> {
    const { error } = await client.rpc('admin_definir_tipo', { p_usuario: usuarioId, p_tipo: tipo });
    if (error) throw error;
  }

  async function adminFetchDenuncias(status: ReportStatus | 'todas' = 'aberta'): Promise<AdminReport[]> {
    const { data, error } = await client.rpc('admin_denuncias', { p_status: status });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      alvoTipo: r.alvo_tipo,
      alvoId: r.alvo_id,
      motivo: r.motivo,
      detalhe: r.detalhe ?? '',
      status: r.status,
      criadoEm: r.criado_em,
      denunciante: r.denunciante,
      resumo: r.resumo ?? '(conteúdo removido)',
      alvoStatus: r.alvo_status ?? '',
    }));
  }

  async function adminResolverDenuncia(id: string, status: ReportStatus): Promise<void> {
    const { error } = await client.rpc('admin_resolver_denuncia', { p_id: id, p_status: status });
    if (error) throw error;
  }

  async function adminModerar(tipo: 'publicacao' | 'comentario', id: string, ocultar: boolean): Promise<void> {
    const { error } = await client.rpc('admin_moderar', { p_tipo: tipo, p_id: id, p_ocultar: ocultar });
    if (error) throw error;
  }

  return {
    fetchPraias,
    fetchPlanos,
    fetchComerciantes,
    fetchEventos,
    fetchDepoimentos,
    fetchPerfil,
    fetchMeusComerciantes,
    criarComerciante,
    fetchAvaliacoes,
    fetchMinhaAvaliacao,
    salvarAvaliacao,
    uploadFoto,
    removerFoto,
    fetchComercianteDetalhe,
    atualizarComerciante,
    fetchProdutos,
    salvarProduto,
    removerProduto,
    definirProdutoDestaque,
    fetchEventosDoComerciante,
    salvarEvento,
    removerEvento,
    fetchPublicacoes,
    criarPublicacao,
    removerPublicacao,
    fetchComentarios,
    criarComentario,
    removerComentario,
    denunciar,
    adminFetchComerciantes,
    adminAtualizarComerciante,
    adminFetchUsuarios,
    adminDefinirTipo,
    adminFetchDenuncias,
    adminResolverDenuncia,
    adminModerar,
  };
}

export const api = createApi(supabase);
export type Api = ReturnType<typeof createApi>;
