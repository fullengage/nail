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
