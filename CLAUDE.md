# Squad UGC — regras do projeto

## Dados reais, sempre
- **Nenhum número fixo/inventado no painel.** Os contadores do Dashboard (`sourceCounts` em `src/context/DataContext.tsx`) são contados direto do banco (creators, TikTok, Instagram, contato, PDVs).
- **Não recolocar** as bases antigas "17.000 manicures", "799 TikTok", "560 Instagram", "8.059 PDVs", "18.359 únicos": o Richard confirmou que estão erradas (revertido 2x: f314f20 e o revert de 0b26726).
- Quando falta um dado, mostrar "—" (nunca um valor padrão como 4.2% ou score 80).

## Privacidade
- Empresas (brand) nunca veem e-mail/WhatsApp de creators nem telefone/e-mail/gerente de PDV. CSV só para admin.
- Proteção no banco (migração 20261005_protege_contatos): **nunca usar select('*') em creators/retail_points** — usar CREATOR_COLS/RETAIL_COLS de supabaseService; contatos só via rpc admin_creator_contacts/admin_retail_contacts.
- Login: sem senha padrão e sem atalho por e-mail fora de VITE_DEMO_MODE=true. Scripts gravam com SUPABASE_SERVICE_ROLE_KEY (só no .env local).
- `data/` inteira fica fora do git (repositório PÚBLICO): planilhas, listas e `data/realLeads.json`. Nenhuma lista de creators reais dentro de `src/`: o JavaScript do site é público.
- Sem sessão do Supabase não existe painel: `/painel/*` vai para `/entrar`; o papel vem de `profiles` (nunca do localStorage). Seletor de papel, atalhos e dados de exemplo só com VITE_DEMO_MODE=true, e o modo demo nunca usa dados reais.
- Antes de publicar: `grep @gmail.com` e busca de telefones em `dist/` têm que dar zero.

## Fluxo de campanha (migração 20261006_fluxo_campanha)
- Campanhas reais usam `src/services/campaignFlow.ts`. Mudança de estado só por funções do banco (campaign_publish, creator_apply, brand_participant, creator_submit, brand_review, brand_report_payment, admin_payment) — nunca `update` direto de status/stage/pagamento.
- Estados: campanha draft → open → selecting → in_progress → completed; creator invited → applied (aceite registrado) → hired → shipping → producing → submitted → revision → approved → paid.
- "Publicada" ≠ "contratado"; perfil mapeado ≠ confirmado. Convite não envia e-mail.
- Pagamento passa pela Squad (manual, PIX fora do sistema): marca paga a Squad (cachê + taxa %) → admin confirma recebimento → admin registra repasse ao creator. Taxa e prazos vêm de squad_settings (padrão 15%, revisão 5 dias úteis com aprovação automática, marca paga em 7 dias, repasse em 5 dias úteis). Nada de saque, fatura ou escrow simulados.
- Teste do banco: `npm i --no-save @electric-sql/pglite && node scripts/test-fluxo/fluxo.test.cjs` (precisa passar 100%).

## Curadoria pela Squad (migração 20261008_curadoria_squad)
- A empresa **não vê a base nem escolhe creators**: convidar/contratar/recusar/enviar produto só admin (brand_invite e brand_participant exigem admin). Marca envia os produtos para a Squad.
- A marca vê só os creators **já contratados** da campanha dela, via rpc `brand_squad` (sem endereço, mensagem ou dados do repasse). Tabela campaign_creators: só admin e o próprio creator.
- Entrega nasce `squad_review`; a Squad usa `squad_screen` (forward → marca revisa com prazo; revision → ajuste que não gasta as revisões da marca). A marca só lê conteúdos/arquivos com `forwarded_at`.
- Base de creators e creator_metrics: leitura só admin e o próprio creator (visitante e marca recebem vazio).

## Métricas do creator (migração 20261007_creator_metrics)
- Snapshots em `creator_metrics` (um por coleta). Fórmulas só em `src/lib/creatorQuality.ts` (computeMetrics, reachPct, growth30d, suspicionAlerts, metricsQuality). Coleta: `scripts/medir-creator-tiktok.mjs` (vídeos fixados ficam fora da média).
- Sem preço/CPM, demografia ou autenticidade de audiência até existir base real. Sem medição: "Ainda não medido" e "—".
- Teste das fórmulas: `node --experimental-strip-types scripts/creatorMetrics.check.mts`.
