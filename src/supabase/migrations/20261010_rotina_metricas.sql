-- ==============================================================================
-- SQUAD UGC — ROTINA DE ATUALIZAÇÃO DE MÉTRICAS (FASE 1: HISTÓRICO + FILA + CONFIGURAÇÕES)
-- ==============================================================================
-- Esta migração prepara o banco para o histórico granular de medições (leves e pesadas),
-- controle de fila/próxima execução na tabela creators, logs de execução e configurações de frequência.
-- Seguro para rodar mais de uma vez (idempotente).
-- ==============================================================================

-- 1. Evolução da tabela creator_metrics
ALTER TABLE public.creator_metrics
  ADD COLUMN IF NOT EXISTS metric_type text NOT NULL DEFAULT 'heavy' CHECK (metric_type IN ('light', 'heavy')),
  ADD COLUMN IF NOT EXISTS data_source text NOT NULL DEFAULT 'apify',
  ADD COLUMN IF NOT EXISTS median_views numeric(14,2),
  ADD COLUMN IF NOT EXISTS posts_per_week numeric(6,2),
  ADD COLUMN IF NOT EXISTS last_post_at timestamptz;

CREATE INDEX IF NOT EXISTS creator_metrics_type_idx 
  ON public.creator_metrics (creator_id, metric_type, collected_at DESC);

-- 2. Evolução da tabela creators para fila de sincronização
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS last_light_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_light_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_heavy_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_heavy_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_post_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_error_last text;

CREATE INDEX IF NOT EXISTS creators_next_light_sync_idx 
  ON public.creators (next_light_sync_at) 
  WHERE next_light_sync_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS creators_next_heavy_sync_idx 
  ON public.creators (next_heavy_sync_at) 
  WHERE next_heavy_sync_at IS NOT NULL;

-- 3. Tabela de auditoria/log das execuções da rotina
CREATE TABLE IF NOT EXISTS public.creator_metric_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  trigger_type text NOT NULL, -- 'cron_hourly', 'manual_profile', 'quarterly_heavy', 'cli'
  metric_type text NOT NULL,  -- 'light', 'heavy', 'both'
  total_target integer DEFAULT 0,
  total_success integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS creator_metric_runs_started_idx 
  ON public.creator_metric_runs (started_at DESC);

ALTER TABLE public.creator_metric_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "runs_read" ON public.creator_metric_runs;
CREATE POLICY "runs_read" ON public.creator_metric_runs FOR SELECT TO authenticated
  USING (public.squad_is_admin());

REVOKE ALL ON public.creator_metric_runs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.creator_metric_runs FROM authenticated;
GRANT SELECT ON public.creator_metric_runs TO authenticated;

-- 4. Inserir parâmetros de frequência e rotina em squad_settings (customizáveis pelo Admin)
INSERT INTO public.squad_settings (key, value, label) VALUES
  ('metric_freq_tier_a_light_days', 1, 'Faixa A: intervalo de medição leve (dias)'),
  ('metric_freq_tier_a_heavy_days', 30, 'Faixa A: intervalo de medição pesada (dias)'),
  ('metric_freq_tier_b_light_days', 7, 'Faixa B: intervalo de medição leve (dias)'),
  ('metric_freq_tier_b_heavy_days', 30, 'Faixa B: intervalo de medição pesada (dias)'),
  ('metric_freq_tier_c_light_days', 30, 'Faixa C: intervalo de medição leve (dias)'),
  ('metric_freq_inactive_days', 90, 'Conta parada: intervalo de medição leve (dias)'),
  ('metric_inactive_threshold_days', 60, 'Dias sem post para considerar conta parada'),
  ('metric_batch_hourly_limit', 30, 'Limite de creators por execução horária'),
  ('metric_retry_backoff_hours', 2, 'Horas de espera base após falha de medição')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
