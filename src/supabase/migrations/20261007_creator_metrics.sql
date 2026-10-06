-- ==============================================================================
-- SQUAD UGC — métricas de desempenho por creator (histórico de coletas)
-- Um registro por coleta (snapshot): médias dos últimos posts, engajamento e seguidores.
-- Leitura: usuários autenticados (não há dado de contato aqui). Escrita: só service role
-- (scripts/medir-creator-tiktok.mjs). Rodar 1x no SQL Editor; seguro para rodar de novo.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.creator_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  collected_at timestamptz NOT NULL DEFAULT now(),
  followers integer,
  posts_analyzed integer NOT NULL DEFAULT 0,
  period_days integer,                 -- dias entre o post mais antigo e o mais recente analisados
  avg_views numeric(14,2),
  avg_likes numeric(14,2),
  avg_comments numeric(14,2),
  avg_shares numeric(14,2),
  er_by_views numeric(8,2),            -- (curtidas + comentários + compartilhamentos) / views × 100
  er_by_followers numeric(8,2),        -- (curtidas + comentários + compartilhamentos) / seguidores × 100
  paid_posts_180d integer,             -- null = o scraper não informou parceria paga
  top_hashtags text[] NOT NULL DEFAULT ARRAY[]::text[],
  recent_posts jsonb NOT NULL DEFAULT '[]'::jsonb  -- [{url, cover, views, created_at}] para a grade de vídeos
);
CREATE INDEX IF NOT EXISTS creator_metrics_creator_platform_idx ON public.creator_metrics (creator_id, platform, collected_at DESC);

ALTER TABLE public.creator_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_metrics_read" ON public.creator_metrics;
CREATE POLICY "creator_metrics_read" ON public.creator_metrics FOR SELECT TO authenticated USING (true);
-- sem policy de insert/update/delete: anon e authenticated não gravam (service role ignora RLS)
REVOKE ALL ON public.creator_metrics FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.creator_metrics FROM authenticated;
GRANT SELECT ON public.creator_metrics TO authenticated;

NOTIFY pgrst, 'reload schema';
