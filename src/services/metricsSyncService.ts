import type { CreatorProfile } from '../types/database';

export interface LightMetricResult {
  creatorId: string;
  platform: 'tiktok' | 'instagram';
  handle: string;
  followers: number | null;
  lastPostAt?: string | null;
  success: boolean;
  error?: string;
}

export interface MetricScheduleConfig {
  tierALightDays: number;
  tierAHeavyDays: number;
  tierBLightDays: number;
  tierBHeavyDays: number;
  tierCLightDays: number;
  inactiveDays: number;
  inactiveThresholdDays: number;
  batchHourlyLimit: number;
  retryBackoffHours: number;
}

export const DEFAULT_METRIC_CONFIG: MetricScheduleConfig = {
  tierALightDays: 1,
  tierAHeavyDays: 30,
  tierBLightDays: 7,
  tierBHeavyDays: 30,
  tierCLightDays: 30,
  inactiveDays: 90,
  inactiveThresholdDays: 60,
  batchHourlyLimit: 30,
  retryBackoffHours: 2,
};

/**
 * Identifica a faixa de prioridade de um creator com base nas suas tags
 */
export function getCreatorTier(creator: Pick<CreatorProfile, 'tags'>): 'A' | 'B' | 'C' | 'none' {
  const tags = creator.tags || [];
  if (tags.some((t) => t.includes('A - Prioritário'))) return 'A';
  if (tags.some((t) => t.includes('B - Qualificado'))) return 'B';
  if (tags.some((t) => t.includes('C - Fora do perfil') || t.includes('C - Geral'))) return 'C';
  return 'none';
}

/**
 * Calcula se a conta está considerada "parada" (sem publicações há 60 dias)
 */
export function isAccountInactive(lastPostAt: string | null | undefined, thresholdDays = 60): boolean {
  if (!lastPostAt) return false;
  const postTime = Date.parse(lastPostAt);
  if (Number.isNaN(postTime)) return false;
  const diffDays = (Date.now() - postTime) / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

/**
 * Calcula a data da próxima medição leve com base na faixa e status da conta
 */
export function calculateNextLightSyncDate(
  tier: 'A' | 'B' | 'C' | 'none',
  isInactive: boolean,
  errorCount = 0,
  config: MetricScheduleConfig = DEFAULT_METRIC_CONFIG
): string {
  const now = Date.now();
  
  // Em caso de falha consecutiva: intervalo crescente (backoff)
  if (errorCount > 0) {
    const backoffMultiplier = Math.min(Math.pow(2, errorCount - 1), 24);
    const delayMs = config.retryBackoffHours * 3600 * 1000 * backoffMultiplier;
    return new Date(now + delayMs).toISOString();
  }

  // Conta inativa há 60 dias: intervalo trimestral (90 dias)
  if (isInactive) {
    return new Date(now + config.inactiveDays * 86400 * 1000).toISOString();
  }

  // Frequência padrão por faixa
  let days: number;
  switch (tier) {
    case 'A':
      days = config.tierALightDays;
      break;
    case 'B':
      days = config.tierBLightDays;
      break;
    case 'C':
    case 'none':
    default:
      days = config.tierCLightDays;
      break;
  }

  return new Date(now + days * 86400 * 1000).toISOString();
}

/**
 * Verifica se a medição leve ou pesada está vencida para acionamento na abertura do perfil
 */
export function isSyncDue(
  lastSyncAt: string | null | undefined,
  maxAgeMs: number
): boolean {
  if (!lastSyncAt) return true;
  const time = Date.parse(lastSyncAt);
  if (Number.isNaN(time)) return true;
  return Date.now() - time > maxAgeMs;
}

export const LIGHT_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;      // 24 horas
export const HEAVY_SYNC_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Retorna o nível de prioridade numérico (1 = Faixa A mais prioritária, 4 = sem faixa)
 */
export function getPriorityRank(tier: 'A' | 'B' | 'C' | 'none'): number {
  switch (tier) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 3;
    default: return 4;
  }
}

/**
 * Ordena criadores pela prioridade da fila:
 * 1. Prioridade da faixa (A > B > C > sem faixa)
 * 2. Tempo de vencimento (mais antigo primeiro / NULL primeiro)
 * 3. Data de criação
 */
export function sortQueueCandidates<T extends Pick<CreatorProfile, 'tags' | 'next_light_sync_at' | 'created_at'>>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    const tierA = getCreatorTier(a);
    const tierB = getCreatorTier(b);
    const rankA = getPriorityRank(tierA);
    const rankB = getPriorityRank(tierB);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const nextA = a.next_light_sync_at ? Date.parse(a.next_light_sync_at) : 0;
    const nextB = b.next_light_sync_at ? Date.parse(b.next_light_sync_at) : 0;

    if (nextA !== nextB) {
      return nextA - nextB;
    }

    return Date.parse(a.created_at || '0') - Date.parse(b.created_at || '0');
  });
}

/**
 * Converte linhas da tabela squad_settings para o objeto MetricScheduleConfig
 */
export function parseSquadSettings(settingsRows: { key: string; value: number }[]): MetricScheduleConfig {
  const map = new Map(settingsRows.map((r) => [r.key, Number(r.value)]));
  return {
    tierALightDays: map.get('metric_freq_tier_a_light_days') ?? DEFAULT_METRIC_CONFIG.tierALightDays,
    tierAHeavyDays: map.get('metric_freq_tier_a_heavy_days') ?? DEFAULT_METRIC_CONFIG.tierAHeavyDays,
    tierBLightDays: map.get('metric_freq_tier_b_light_days') ?? DEFAULT_METRIC_CONFIG.tierBLightDays,
    tierBHeavyDays: map.get('metric_freq_tier_b_heavy_days') ?? DEFAULT_METRIC_CONFIG.tierBHeavyDays,
    tierCLightDays: map.get('metric_freq_tier_c_light_days') ?? DEFAULT_METRIC_CONFIG.tierCLightDays,
    inactiveDays: map.get('metric_freq_inactive_days') ?? DEFAULT_METRIC_CONFIG.inactiveDays,
    inactiveThresholdDays: map.get('metric_inactive_threshold_days') ?? DEFAULT_METRIC_CONFIG.inactiveThresholdDays,
    batchHourlyLimit: map.get('metric_batch_hourly_limit') ?? DEFAULT_METRIC_CONFIG.batchHourlyLimit,
    retryBackoffHours: map.get('metric_retry_backoff_hours') ?? DEFAULT_METRIC_CONFIG.retryBackoffHours,
  };
}
