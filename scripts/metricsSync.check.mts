// Teste das funções de agendamento e faixas de métricas
// Rodar: node --experimental-strip-types scripts/metricsSync.check.mts
import {
  getCreatorTier,
  isAccountInactive,
  calculateNextLightSyncDate,
  isSyncDue,
  LIGHT_SYNC_MAX_AGE_MS,
  HEAVY_SYNC_MAX_AGE_MS,
} from '../src/services/metricsSyncService.ts';

const assert = (cond: unknown, msg: string) => {
  if (!cond) {
    console.error('FALHOU:', msg);
    process.exitCode = 1;
  } else {
    console.log('ok:', msg);
  }
};

// 1. Classificação por faixa
assert(getCreatorTier({ tags: ['A - Prioritário (Top Live)'] }) === 'A', 'Faixa A identificada');
assert(getCreatorTier({ tags: ['A - Prioritário'] }) === 'A', 'Faixa A variante identificada');
assert(getCreatorTier({ tags: ['B - Qualificado', 'UGC'] }) === 'B', 'Faixa B identificada');
assert(getCreatorTier({ tags: ['C - Fora do perfil'] }) === 'C', 'Faixa C identificada');
assert(getCreatorTier({ tags: ['origem:instagram'] }) === 'none', 'Sem faixa identificada');

// 2. Conta parada (> 60 dias)
const now = Date.now();
const sixtyFiveDaysAgo = new Date(now - 65 * 86400 * 1000).toISOString();
const tenDaysAgo = new Date(now - 10 * 86400 * 1000).toISOString();
assert(isAccountInactive(sixtyFiveDaysAgo, 60), 'Conta sem post há 65 dias está inativa');
assert(!isAccountInactive(tenDaysAgo, 60), 'Conta com post recente está ativa');
assert(!isAccountInactive(null, 60), 'Sem data de post não marca inativo');

// 3. Próxima medição leve por faixa
const dateA = new Date(calculateNextLightSyncDate('A', false, 0));
const diffDaysA = Math.round((dateA.getTime() - now) / (86400 * 1000));
assert(diffDaysA === 1, `Faixa A agenda leve em 1 dia (deu ${diffDaysA})`);

const dateB = new Date(calculateNextLightSyncDate('B', false, 0));
const diffDaysB = Math.round((dateB.getTime() - now) / (86400 * 1000));
assert(diffDaysB === 7, `Faixa B agenda leve em 7 dias (deu ${diffDaysB})`);

const dateC = new Date(calculateNextLightSyncDate('C', false, 0));
const diffDaysC = Math.round((dateC.getTime() - now) / (86400 * 1000));
assert(diffDaysC === 30, `Faixa C agenda leve em 30 dias (deu ${diffDaysC})`);

const dateInactive = new Date(calculateNextLightSyncDate('A', true, 0));
const diffDaysInactive = Math.round((dateInactive.getTime() - now) / (86400 * 1000));
assert(diffDaysInactive === 90, `Conta inativa agenda em 90 dias mesmo sendo Faixa A (deu ${diffDaysInactive})`);

// 4. Backoff em erro (crescente)
const dateErr1 = new Date(calculateNextLightSyncDate('A', false, 1));
const diffHoursErr1 = Math.round((dateErr1.getTime() - now) / (3600 * 1000));
assert(diffHoursErr1 === 2, `Erro 1 remarca para 2 horas (deu ${diffHoursErr1})`);

const dateErr2 = new Date(calculateNextLightSyncDate('A', false, 2));
const diffHoursErr2 = Math.round((dateErr2.getTime() - now) / (3600 * 1000));
assert(diffHoursErr2 === 4, `Erro 2 remarca para 4 horas (deu ${diffHoursErr2})`);

// 5. Verificação de vencimento para "Ver Perfil"
const twentyFiveHoursAgo = new Date(now - 25 * 3600 * 1000).toISOString();
const tenHoursAgo = new Date(now - 10 * 3600 * 1000).toISOString();
assert(isSyncDue(twentyFiveHoursAgo, LIGHT_SYNC_MAX_AGE_MS), 'Leve com 25h está vencida (> 24h)');
assert(!isSyncDue(tenHoursAgo, LIGHT_SYNC_MAX_AGE_MS), 'Leve com 10h não está vencida');
assert(isSyncDue(null, LIGHT_SYNC_MAX_AGE_MS), 'Sem medição está vencida');
