-- ==============================================================================
-- SQUAD UGC — ROTINA DE MÉTRICAS (FASE 2: FILA POR PRIORIDADE E RPC DE AUDITORIA)
-- ==============================================================================
-- Esta migração cria o RPC para busca otimizada da fila de medições por prioridade
-- (Faixa A > Faixa B > Faixa C > Sem Faixa), respeitando vencimento e limite de lote.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_creators_metrics_queue(p_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  professional_name text,
  tiktok text,
  instagram text,
  tags text[],
  tiktok_followers int,
  instagram_followers int,
  last_light_sync_at timestamptz,
  next_light_sync_at timestamptz,
  last_post_at timestamptz,
  sync_error_count int,
  tier text,
  priority_rank int
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    c.id,
    c.professional_name,
    c.tiktok,
    c.instagram,
    c.tags,
    c.tiktok_followers,
    c.instagram_followers,
    c.last_light_sync_at,
    c.next_light_sync_at,
    c.last_post_at,
    coalesce(c.sync_error_count, 0) as sync_error_count,
    CASE 
      WHEN coalesce(c.tags, ARRAY[]::text[]) @> ARRAY['A - Prioritário (Top Live)']::text[] 
        OR EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%A - Prioritário%') THEN 'A'
      WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%B - Qualificado%') THEN 'B'
      WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%C - %') THEN 'C'
      ELSE 'none'
    END as tier,
    CASE 
      WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%A - Prioritário%') THEN 1
      WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%B - Qualificado%') THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE '%C - %') THEN 3
      ELSE 4
    END as priority_rank
  FROM public.creators c
  WHERE 
    ((c.tiktok IS NOT NULL AND c.tiktok <> '') OR (c.instagram IS NOT NULL AND c.instagram <> ''))
    AND (c.next_light_sync_at IS NULL OR c.next_light_sync_at <= now())
  ORDER BY 
    priority_rank ASC,
    coalesce(c.next_light_sync_at, '1970-01-01'::timestamptz) ASC,
    c.created_at ASC
  LIMIT p_limit;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.get_creators_metrics_queue(int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_creators_metrics_queue(int) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
