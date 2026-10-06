import type { CreatorProfile } from '../types/database';

// Selo de qualidade da audiência a partir do engajamento medido (curtidas + comentários + compartilhamentos).
// ponytail: só engajamento; somar crescimento de seguidores quando houver histórico coletado.
export type Quality = { key: 'alta' | 'real' | 'baixa' | 'suspeita' | 'verificar' | 'sem'; label: string; why: string; cls: string };

export function audienceQuality(c: Pick<CreatorProfile, 'engagement_rate'>): Quality {
  const e = Number(c.engagement_rate) || 0;
  if (!e) return { key: 'sem', label: 'Sem medição', why: 'Engajamento ainda não medido.', cls: 'bg-muted text-muted-foreground border-border' };
  if (e < 0.1) return { key: 'suspeita', label: 'Audiência suspeita', why: `Só ${e}% de interação: perfil parado ou seguidores comprados.`, cls: 'bg-red-500/10 text-red-600 border-red-500/30' };
  if (e < 1) return { key: 'baixa', label: 'Engajamento baixo', why: `${e}% de interação: audiência pouco ativa.`, cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
  if (e > 40) return { key: 'verificar', label: 'Fora da curva', why: `${e}% é acima do normal: conferir posts antes de contratar.`, cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
  if (e >= 3) return { key: 'alta', label: 'Audiência engajada', why: `${e}% de interação nos posts recentes: acima da média.`, cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' };
  return { key: 'real', label: 'Audiência real', why: `${e}% de interação nos posts recentes.`, cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' };
}

export const followersOf = (c: Pick<CreatorProfile, 'tiktok_followers' | 'instagram_followers'>) =>
  Math.max(c.tiktok_followers || 0, c.instagram_followers || 0);

export const SIZES = {
  nano: { label: 'Nano (até 10 mil)', min: 0, max: 10_000 },
  micro: { label: 'Micro (10–100 mil)', min: 10_000, max: 100_000 },
  medio: { label: 'Médio (100 mil–1 mi)', min: 100_000, max: 1_000_000 },
  macro: { label: 'Macro (1 mi+)', min: 1_000_000, max: Infinity },
} as const;
export type SizeKey = keyof typeof SIZES;
export const sizeOf = (n: number): SizeKey => (n >= 1e6 ? 'macro' : n >= 1e5 ? 'medio' : n >= 1e4 ? 'micro' : 'nano');

// ---------- métricas por post (tabela creator_metrics) ----------
// Mesmas faixas do selo acima; a barra de faixas da interface usa estes limites (não há base de comparação externa).
export const ER_BANDS = [0.1, 1, 3, 40] as const;

export interface PostStat { views: number; likes: number; comments: number; shares: number; created_at?: string | null }
export interface MetricsSummary {
  posts_analyzed: number; period_days: number | null;
  avg_views: number | null; avg_likes: number | null; avg_comments: number | null; avg_shares: number | null;
  er_by_views: number | null; er_by_followers: number | null;
}
const r2 = (n: number) => Math.round(n * 100) / 100;
// porcentagem no padrão brasileiro (vírgula)
export const pctBR = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// er_by_views = (curtidas + comentários + compartilhamentos) / views × 100
// er_by_followers = (curtidas + comentários + compartilhamentos) / seguidores × 100  (médias por post)
export function computeMetrics(posts: PostStat[], followers: number | null): MetricsSummary {
  const n = posts.length;
  const v = avg(posts.map((p) => p.views || 0)), l = avg(posts.map((p) => p.likes || 0));
  const c = avg(posts.map((p) => p.comments || 0)), s = avg(posts.map((p) => p.shares || 0));
  const inter = n ? (l || 0) + (c || 0) + (s || 0) : null;
  const dates = posts.map((p) => (p.created_at ? Date.parse(p.created_at) : NaN)).filter((d) => !Number.isNaN(d));
  return {
    posts_analyzed: n,
    period_days: dates.length > 1 ? Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000)) : null,
    avg_views: v == null ? null : r2(v), avg_likes: l == null ? null : r2(l), avg_comments: c == null ? null : r2(c), avg_shares: s == null ? null : r2(s),
    er_by_views: inter != null && v ? r2((inter / v) * 100) : null,
    er_by_followers: inter != null && followers ? r2((inter / followers) * 100) : null,
  };
}
// alcance = média de views / seguidores × 100
export const reachPct = (avgViews: number | null | undefined, followers: number | null | undefined) =>
  avgViews != null && followers ? r2((avgViews / followers) * 100) : null;

// crescimento: snapshot mais recente × o mais próximo de 30 dias antes dele. Menos de 2 coletas → null ("—").
export function growth30d(snaps: { collected_at: string; followers: number | null }[]) {
  const s = snaps.filter((x) => x.followers != null).sort((a, b) => Date.parse(b.collected_at) - Date.parse(a.collected_at));
  if (s.length < 2) return null;
  const last = s[0], target = Date.parse(last.collected_at) - 30 * 86400000;
  const base = s.slice(1).reduce((best, x) => (Math.abs(Date.parse(x.collected_at) - target) < Math.abs(Date.parse(best.collected_at) - target) ? x : best));
  const delta = (last.followers as number) - (base.followers as number);
  return { delta, pct: base.followers ? r2((delta / (base.followers as number)) * 100) : null, from: base.collected_at, to: last.collected_at };
}

export interface Alert { key: 'comments_over_likes' | 'comments_over_views' | 'er_too_high'; title: string; why: string }
// sinais de engajamento suspeito, explicados para a marca
export function suspicionAlerts(m: Pick<MetricsSummary, 'avg_views' | 'avg_likes' | 'avg_comments' | 'er_by_views'> | null): Alert[] {
  if (!m) return [];
  const out: Alert[] = [];
  if (m.avg_comments != null && m.avg_likes != null && m.avg_comments > m.avg_likes)
    out.push({ key: 'comments_over_likes', title: 'Mais comentários que curtidas', why: 'Comentários acima das curtidas costuma indicar grupo de engajamento ou sorteio ("comente para ganhar").' });
  if (m.avg_comments != null && m.avg_views && m.avg_comments / m.avg_views > 0.1)
    out.push({ key: 'comments_over_views', title: 'Comentários demais para as views', why: `${pctBR(r2((m.avg_comments / m.avg_views) * 100))} de quem vê comenta; o normal é bem abaixo de 1%. Confira se os comentários são de pessoas reais.` });
  if (m.er_by_views != null && m.er_by_views > ER_BANDS[3])
    out.push({ key: 'er_too_high', title: 'Engajamento fora da curva', why: `${pctBR(m.er_by_views)} de interação por view é acima do normal. Confira os posts antes de contratar.` });
  return out;
}

// selo a partir das médias medidas; com alerta nunca vira "Audiência engajada"
export function metricsQuality(m: MetricsSummary | null, fallback: Pick<CreatorProfile, 'engagement_rate'>): Quality {
  if (!m || m.er_by_views == null) return audienceQuality(fallback);
  const alerts = suspicionAlerts(m);
  if (alerts.length) return { key: 'verificar', label: 'Engajamento atípico', why: alerts.map((a) => a.title).join(' · '), cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
  return audienceQuality({ engagement_rate: m.er_by_views });
}
