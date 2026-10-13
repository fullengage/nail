// Teste unitário da fila por prioridade, ordenação e configurações
// Rodar: node --experimental-strip-types scripts/metricsQueue.check.mts
import {
  sortQueueCandidates,
  parseSquadSettings,
  calculateNextLightSyncDate,
  getCreatorTier,
  getPriorityRank,
  DEFAULT_METRIC_CONFIG,
} from '../src/services/metricsSyncService.ts';

const assert = (cond: unknown, msg: string) => {
  if (!cond) {
    console.error('FALHOU:', msg);
    process.exitCode = 1;
  } else {
    console.log('ok:', msg);
  }
};

// 1. Ordenação por prioridade de Faixa (A > B > C > sem faixa)
const mockCandidates = [
  { id: '1', tags: ['origem:tiktok'], next_light_sync_at: null, created_at: '2026-01-01' }, // sem faixa
  { id: '2', tags: ['C - Fora do perfil'], next_light_sync_at: null, created_at: '2026-01-02' }, // C
  { id: '3', tags: ['A - Prioritário (Top Live)'], next_light_sync_at: '2026-10-01', created_at: '2026-01-03' }, // A
  { id: '4', tags: ['B - Qualificado'], next_light_sync_at: '2026-10-02', created_at: '2026-01-04' }, // B
];

const sorted = sortQueueCandidates(mockCandidates);
assert(sorted[0].id === '3', 'Faixa A ficou em 1º lugar');
assert(sorted[1].id === '4', 'Faixa B ficou em 2º lugar');
assert(sorted[2].id === '2', 'Faixa C ficou em 3º lugar');
assert(sorted[3].id === '1', 'Sem faixa ficou em 4º lugar');

// 2. Desempate dentro da mesma faixa por data de vencimento (mais antigo primeiro)
const sameTierCandidates = [
  { id: 'b2', tags: ['B - Qualificado'], next_light_sync_at: '2026-10-05T00:00:00Z', created_at: '2026-01-01' },
  { id: 'b1', tags: ['B - Qualificado'], next_light_sync_at: '2026-10-01T00:00:00Z', created_at: '2026-01-01' },
  { id: 'b0', tags: ['B - Qualificado'], next_light_sync_at: null, created_at: '2026-01-01' }, // nunca medido
];

const sortedSame = sortQueueCandidates(sameTierCandidates);
assert(sortedSame[0].id === 'b0', 'Nunca medido (null) tem prioridade dentro da mesma faixa');
assert(sortedSame[1].id === 'b1', 'Mais antigo (10-01) veio antes de mais recente (10-05)');
assert(sortedSame[2].id === 'b2', 'Mais recente (10-05) veio por último');

// 3. Conversão de configurações do squad_settings
const settingsRows = [
  { key: 'metric_freq_tier_a_light_days', value: 2 },
  { key: 'metric_batch_hourly_limit', value: 45 },
  { key: 'metric_retry_backoff_hours', value: 3 },
];

const cfg = parseSquadSettings(settingsRows);
assert(cfg.tierALightDays === 2, 'Configuração personalizada tierALightDays lida');
assert(cfg.batchHourlyLimit === 45, 'Configuração personalizada batchHourlyLimit lida');
assert(cfg.retryBackoffHours === 3, 'Configuração personalizada retryBackoffHours lida');
assert(cfg.tierBLightDays === DEFAULT_METRIC_CONFIG.tierBLightDays, 'Configuração ausente usou valor padrão');

// 4. Backoff exponencial crescente
const now = Date.now();
const dateErr1 = new Date(calculateNextLightSyncDate('B', false, 1, cfg));
const diffHoursErr1 = Math.round((dateErr1.getTime() - now) / (3600 * 1000));
assert(diffHoursErr1 === 3, `Erro 1 com backoff base 3h agendou em 3h (deu ${diffHoursErr1}h)`);

const dateErr2 = new Date(calculateNextLightSyncDate('B', false, 2, cfg));
const diffHoursErr2 = Math.round((dateErr2.getTime() - now) / (3600 * 1000));
assert(diffHoursErr2 === 6, `Erro 2 com backoff base 3h agendou em 6h (deu ${diffHoursErr2}h)`);
