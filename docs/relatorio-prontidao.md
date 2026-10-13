# Relatório de prontidão — Squad UGC

Data da auditoria: 2026-10-09. Commit analisado: `000cf1a` (branch `main`).

Esta auditoria é somente leitura. Nenhum arquivo de código foi alterado, nenhuma migração foi aplicada e nenhuma escrita foi feita no banco. Os rótulos usados ao longo do texto significam:

- **VERIFICADO**: o código foi lido (ou o comando foi rodado e o resultado observado).
- **INFERIDO**: a conclusão foi deduzida do código, sem confirmação no banco de produção.
- **NÃO VERIFICADO**: não foi possível checar, e o motivo está na seção 8.

Os caminhos de arquivo são relativos à raiz do repositório.

---

## 1. Resumo

1. **Dá para mostrar a uma marca, sem risco, só o fluxo de campanha em conta de demonstração e sem login de marca:** criar o rascunho, publicar, convidar, contratar, receber o vídeo, aprovar e registrar o pagamento. As regras estão no banco (funções `SECURITY DEFINER`), e os 108 testes de `scripts/test-fluxo` passam na réplica das migrações versionadas. Isso não prova que o banco de produção está igual.
2. **Não dá para mostrar nem para entregar hoje:** Relatórios, Afiliados, Marcas, Dashboard (PDVs, TikTok, Instagram, GMV), Academia do creator e a landing com "18.000+ creators". Todos exibem números fixos ou dados de demonstração como se fossem reais. O BI de Redes Sociais fica travado em "Carregando medições…".
3. **Não dá para dar login a uma marca antes de corrigir a segurança.** A chave pública do site (que está no código do navegador) consegue ler e-mail e telefone de todos os perfis e os dados de contato de candidatos a campanha. Algumas tabelas não têm RLS e aceitam leitura e escrita por qualquer pessoa. Qualquer usuário logado passa pelo gate de admin. Isto é bloqueante e é a primeira coisa a corrigir.
4. **Afiliado e cupom não existem.** A tela de Afiliados é só interface sobre dados fixos. Nada cria cupom no servidor, nada registra venda (não há webhook, integração de loja nem importação) e nada calcula comissão sobre venda.
5. **Pagamento:** o registro manual (marca informa, Squad confirma, Squad repassa) funciona como o CLAUDE.md manda. Mas a tela de Financeiro do admin tem o botão "Processar Lote de Pagamento Automático PIX", que só muda estado na memória do navegador e não transfere nada. Isso contradiz a regra do projeto e precisa ser removido antes de qualquer uso.

---

## 2. Tabela de módulos

Estados possíveis: funciona de ponta a ponta / parcial / só interface / quebrado / não existe / não verificado.

| Módulo | Estado | Evidência (arquivo) | O que falta |
|---|---|---|---|
| Site público (landing, sobre, planos, contato) | Parcial: funciona, mas tem número inventado | `src/pages/landing/LandingPage.tsx:153` ("18.000+ creators e manicures mapeadas") | Trocar por contagem do banco ou remover. A regra do projeto proíbe base inventada. **VERIFICADO** |
| Login com e-mail e senha | Funciona de ponta a ponta | `src/context/AuthContext.tsx:212-293`; `src/pages/auth/AuthPage.tsx` | Se o perfil não for achado pelo `auth_user_id`, o código busca pelo e-mail (`AuthContext.tsx:244-249`). Conferir a configuração do Supabase Auth. **VERIFICADO** no código, **INFERIDO** no banco |
| Cadastro "Criar nova conta" | Só interface | `src/context/AuthContext.tsx:363-478` (não chama `supabase.auth.signUp`; gera `auth_user_id: 'auth-<timestamp>'`); `AuthPage.tsx:265-285` (aba visível em produção) | Esconder a aba ou implementar o cadastro de verdade. Remover os números fixos de `AuthContext.tsx:389-404` (15000, 25000, 4.8, 85, 80). **VERIFICADO** |
| Recuperação de senha | Só interface | `src/pages/squadra/SquadraResetPassword.tsx:13-18` (só faz `setSent(true)`) | Chamar a função de recuperação do Supabase ou esconder a tela. **VERIFICADO** |
| Guarda de sessão do painel (`/painel/*`) | Funciona | `src/App.tsx:107-110, 239-241` | Nenhum para este item. Sem sessão, vai para `/entrar`. **VERIFICADO** |
| Guarda de papel do painel | Quebrado (segurança) | `src/App.tsx:159-170` (retail, campanhas, afiliados, relatórios, marcas e configurações sem `checkPermission`); `src/components/admin/AdminAuthGuard.tsx:45-48, 68-69` (qualquer usuário logado libera as telas de admin) | Checar o papel `admin` depois do login e proteger cada rota por papel. **VERIFICADO** |
| Campanhas & Squads (tela do admin) | Não verificado. Lê direto do banco, então não é mock; a causa do vazio não foi confirmada | `src/pages/squadra/CampaignsPage.tsx:40-41` (consulta direta a `campaigns`), `:95` (mensagem "Crie sua primeira campanha…") | Rodar as consultas da seção 8. Possíveis causas: nenhuma campanha publicada no banco, perfil do admin sem `auth_user_id` (a RLS não o reconhece como admin), ou o insert da marca falhando por FK (ver linha seguinte). **VERIFICADO** no código |
| Marca cria rascunho e publica campanha | Funciona no banco; parcial na tela | `src/components/campaign/CampaignBuilder.tsx:60-118`; `src/services/campaignFlow.ts:112-142`; `src/supabase/migrations/20261006_fluxo_campanha.sql:231-252` | O código usa `organization_id` `…0001`, e nenhuma migração insere essa linha em `organizations`. Se a linha não existir em produção, o insert falha. **INFERIDO** |
| Convite, candidatura e contratação pela Squad | Funciona de ponta a ponta (no banco) | `src/components/campaign/CampaignWorkspace.tsx:152-177`; `src/pages/creator/CreatorFlow.tsx:40-92`; `20261008_curadoria_squad.sql:60-130` | Sem e-mail (correto, por regra). O estado `hired` nunca é gravado: a contratação vai direto para `shipping` ou `producing`. **VERIFICADO** |
| Endereço do creator e envio do produto pela Squad | Funciona | `CreatorFlow.tsx:178-213`; `CampaignWorkspace.tsx:184-276`; `20261008_curadoria_squad.sql:100-106, 132-144` | Nada além do registro. **VERIFICADO** |
| Envio do produto da marca para a Squad | Só interface | `CampaignWorkspace.tsx:81` (só texto "Enviar os produtos para a Squad UGC"; sem botão nem registro) | Botão e registro, ou processo manual até lá. **VERIFICADO** |
| Entrega do vídeo pelo creator | Funciona | `CreatorFlow.tsx:185-231`; `campaignFlow.ts:202`; `20261008_curadoria_squad.sql:146-168` | Se o registro falhar depois do upload, o arquivo fica órfão no bucket. **VERIFICADO** |
| Triagem da Squad e revisão da marca | Funciona | `CampaignWorkspace.tsx:346-357`; `20261008_curadoria_squad.sql:171-198`; `20261006_fluxo_campanha.sql:435-459` | Aprovação automática depende de alguém abrir a tela (`CampaignWorkspace.tsx:49`, `CreatorFlow.tsx:133, 242`) ou de um `pg_cron` que não foi confirmado. **VERIFICADO** no código |
| Registro de pagamento (marca informa, Squad confirma, Squad repassa) | Funciona como registro; o PIX é externo, como a regra manda | `CampaignWorkspace.tsx:303-305`; `20261006_fluxo_campanha.sql:461-508` | Nenhum teste com dado real em produção. **VERIFICADO** no código |
| Ganhos do creator (tela ativa, `/creator/ganhos`) | Funciona (só leitura) | `src/pages/creator/CreatorFlow.tsx:238` (`CreatorEarningsReal`) | Nenhum saque, o que está correto. **VERIFICADO** |
| Moderação de campanhas do admin (`/admin/moderacao`) | Só interface | `src/pages/admin/AdminModeration.tsx:12, 19`; `src/context/DataContext.tsx:809-813` (só muda o status na memória; some ao recarregar) | Trocar por função do banco ou remover. Viola a regra de não mudar estado por `update` direto. **VERIFICADO** |
| Creators: base e contatos (admin) | Funciona para admin; a marca não vê contato na tela | `src/pages/squadra/SquadraCreators.tsx:63, 734-744, 1308-1312, 262-271`; `src/services/supabaseService.ts:14-16`; contatos só por rpc `admin_creator_contacts` | Tabela de creators do Dashboard usa fallback 85 e 4.2 (`src/pages/squadra/SquadraDashboard.tsx:343, 354`). Criar creator à mão recebe valores padrão (`src/context/DataContext.tsx:1078-1081`). **VERIFICADO** |
| PDVs (varejo) | Parcial: mostra 200 PDVs fictícios quando o banco não tem PDV | `src/context/DataContext.tsx:164, 185`; `src/data/squadraData.ts:120-141` | Remover o gerador. Se não houver dado, mostrar "—". **VERIFICADO** |
| Marcas (`/painel/marcas`) | Parcial: mostra três marcas fictícias se o banco não tiver marcas | `src/context/DataContext.tsx:309, 366-368`; `src/data/squadraData.ts:26-80` | Remover os seeds e o botão "Limpar Mockups & Restaurar Base" (ver seção 5). **VERIFICADO** |
| Afiliados e cupom | Não existe (só interface sobre dado fixo) | `src/pages/squadra/SquadraAffiliates.tsx:121-167`; `src/context/DataContext.tsx:711-766`; `src/data/squadraData.ts:386-476` | Ver seção 4. **VERIFICADO** |
| Relatórios | Dado fixo | `src/pages/squadra/SquadraReports.tsx:184-192` (views 2,84 mi, engajamento 4,52%, GMV R$ 258.450,00); `:45-47` (CSV com os mesmos valores) | Calcular do banco ou remover a tela. **VERIFICADO** |
| Academia do creator | Dado fixo | `src/context/DataContext.tsx:284` (`return MOCK_COURSES;`, sem checar demo); `src/pages/creator/CreatorAcademy.tsx` | Retornar lista vazia ou ler de tabela real. **VERIFICADO** |
| Dashboard da Squad/admin | Parcial: contadores com fallback e somas com números fixos | `src/context/DataContext.tsx:178-186` (TikTok, Instagram e únicos viram 0 em vez de "—"); `src/pages/squadra/SquadraDashboard.tsx:158-179`; `src/pages/admin/AdminDashboard.tsx:98` (GMV + 145000 fixo) | Devolver `null` quando não houver dado e mostrar "—". Remover as somas fixas. **VERIFICADO** |
| Financeiro do admin (`/admin/financeiro`) | Só interface no lote PIX | `src/pages/admin/AdminFinance.tsx:19-25, 69, 86` (botão "Processar Lote de Pagamento Automático PIX"); `src/context/DataContext.tsx:776-792` (muda status só na memória) | Remover o botão. O pagamento deve passar pela função `admin_payment`. Taxa fixa de 15% (`AdminFinance.tsx:38, 47`) deveria vir de `squad_settings`. **VERIFICADO** |
| Ganho do creator ao aprovar entrega | Lógica errada (só na memória) | `src/context/DataContext.tsx:656-667` (`camp.commission_value \|\| 350`) | Se a campanha tiver comissão em percentual (ex.: 15%), o creator recebe R$ 15 como se fosse reais. Se não houver cachê, cria R$ 350 fixo. Remover e usar o banco. **VERIFICADO** |
| BI de Redes Sociais (`/painel/bi-redes`) | Quebrado: fica em "Carregando medições…" | `src/pages/squadra/SquadraSocialBI.tsx:57, 64`; `src/services/supabaseService.ts:174-185` | Ver seção 2.2 (causa). **VERIFICADO** no código; o disparo exato em produção é **INFERIDO** |
| Integrações de pagamento (Asaas, Stripe, Mercado Pago) | Não existe | Busca em `src/`, `scripts/` e `package.json`: zero ocorrências | Nada. Não é necessário pela regra atual (pagamento manual). **VERIFICADO** |
| Integrações de loja (Shopify, Nuvemshop, WooCommerce, TikTok Shop) | Não existe | Zero ocorrências de código. Aparecem só em texto de planejamento (`public/anti-fraude/squad-ugc-dados-de-venda-falsos.docx.md:39`) | Definir a fonte de vendas antes de qualquer afiliado. **VERIFICADO** |
| Webhook de leads | Parcial: só funciona se `VITE_LEADS_WEBHOOK_URL` estiver definida, e ela não está declarada em nenhum `.env` | `src/services/supabaseService.ts:390-397, 435-442` | Decidir se é usado. Não serve para vendas. **VERIFICADO** |
| Coleta de métricas (Apify) | Funciona, mas só como script de linha de comando, e com custo | `scripts/buscar-creators-*.mjs`, `scripts/medir-creator-tiktok.mjs`, `scripts/importar-metricas-apify.mjs` (lê `data/apify/`, sem rede) | Não tem tela. Há trava de orçamento (`APIFY_MAX_USD`). **VERIFICADO** |
| Consulta de CNPJ (BrasilAPI) | Funciona de ponta a ponta | `src/lib/brasilapi.ts:54-60`; `src/pages/squadra/SquadraRetail.tsx` | — **VERIFICADO** |
| Saque PIX do creator | Não existe; o código que o simula é morto | `src/pages/creator/CreatorEarnings.tsx:72, 239-250` (tela "Saque Solicitado!"); nenhum arquivo importa esse módulo | Apagar o arquivo. **VERIFICADO** |
| Calculadora e simuladores (`/ferramentas`, `MissionSimulator`) | Não verificado | — | Não foi auditado por esta rodada. |

### 2.1 Saúde técnica e deploy

**Verificado, rodado sem escrever em disco:**

- `tsc --noEmit` para `tsconfig.app.json` e `tsconfig.node.json`: **0 erros** nos dois.
- Lint (`oxlint`, sem `--fix`): **0 erros e 257 avisos**, quase todos de imports e variáveis não usados (ex.: `src/pages/squadra/SquadraCreators.tsx:37, 60, 97, 99, 344`).
- `node scripts/test-fluxo/fluxo.test.cjs`: **108 verificações OK, 0 falhas**. A réplica usa PGlite em memória e lê as migrações versionadas (não inclui `20260911_fase1`, `20260911_fase2` nem `20261002_auth_3_levels`).
- `node --experimental-strip-types scripts/creatorMetrics.check.mts`: **12 verificações OK**.
- Não há marcadores `TODO`, `FIXME`, `HACK` ou `XXX` em `src/`.
- **Não verificado:** `npm run build` completo. O script é `tsc -b && vite build`. A parte do `tsc` passou, mas o `vite build` não foi rodado, porque escreve em `dist/` e isso ficou fora da tarefa.
- `npm run test:rls` não foi rodado: depende de `tsx`, que não está instalado.

**Deploy em squadugc.com.br** (GET público, sem credenciais):

- O site responde HTTP 200 e publica o bundle `index-CjjgzRL5.js`.
- O hash desse bundle é igual ao do `dist/` local gerado às 13:05:23, um minuto antes do commit `000cf1a` (13:06:02). **INFERIDO**: o que está no ar corresponde ao código de antes do último commit.
- O bundle publicado contém as strings "Squadra Nutrition" (6 ocorrências), "258.450", "Limpar Mockups" (2), "Carregando medições" e "bi-redes". Ou seja, **a produção mostra os dados de demonstração hoje**.
- O bundle contém 12 endereços de e-mail distintos (27 ocorrências em `example.com`, 1 em `nailclubpro.com.br`, 2 em `squadra.app`). Nenhum é `@gmail.com`. O endereço em `nailclubpro.com.br` precisa ser conferido: se for de uma pessoa real, está exposto no JavaScript público.
- O host do Supabase no bundle é o mesmo de `.env.production`. **VERIFICADO**.

### 2.2 BI de Redes Sociais: por que fica preso

**Causa raiz (VERIFICADO no código):**

1. A tela mostra o loader enquanto `metrics == null` (`src/pages/squadra/SquadraSocialBI.tsx:64`).
2. A única atribuição de `metrics` é o `.then` da linha 57, que chama `supabaseService.getLatestMetrics()`. Esse `.then` não tem `.catch`, não tem timeout e não tem cancelamento.
3. Se a consulta responder com erro, a tela sai do loader e mostra o aviso amarelo (linha 94). Ela só fica presa se a promessa **nunca resolver** (consulta pendente, por exemplo por travamento de sessão) ou **rejeitar sem catch**.
4. Se a RLS bloquear a leitura, o PostgREST devolve lista vazia, e a tela mostra "Nenhuma medição ainda" (linha 104), não o loader.
5. Qualquer erro que não case com `schema cache` ou `does not exist` vira o código `'login'` (`supabaseService.ts:179`). Isso mostra "Entre com a conta de administrador" mesmo quando o problema é rede ou timeout. A mensagem engana.

**Hipótese principal (INFERIDO):** a consulta fica pendente, porque a sessão do Supabase ainda não está pronta (`AuthContext.tsx:192-193`). Sem timeout, o loader fica para sempre.

**Correção mínima sugerida (não aplicada):** adicionar `.catch` que devolve `{ rows: [], error: 'login' }`, cancelar o `setState` quando o componente sai da tela, e impor um timeout de cerca de 15 segundos. Trocar a mensagem de erro genérica.

**Risco separado de privacidade:** a migração `20261007_creator_metrics.sql:29-30` cria uma política de leitura para qualquer usuário logado (`USING (true)`). A migração `20261008_curadoria_squad.sql:23-25` substitui essa regra pela correta (admin ou o próprio creator). Se a `20261008` não estiver aplicada em produção, qualquer creator ou marca logada lê as métricas de todos. Conferir com a consulta da seção 8.

---

## 3. Fluxo de conteúdo (campanha → entrega → pagamento)

Cada etapa foi lida no código e confirmada pela migração correspondente. O que está no banco é o que vale; a tela só chama as funções.

| # | Etapa | Tela | Grava no banco | Regra implementada | Estado |
|---|---|---|---|---|---|
| 1 | Marca cria rascunho | `CampaignBuilder.tsx:60-85` (salvamento automático), `CampaignsPage.tsx:73, 95` | `campaigns`, por upsert em `client_ref` (`campaignFlow.ts:112-140`). Sem sessão, o rascunho fica só no navegador | Só o dono, e só com sessão | Funciona. Risco: a organização `…0001` pode não existir (INFERIDO) |
| 2 | Marca publica | `CampaignBuilder.tsx:94-118` | Função `campaign_publish` (`campaignFlow.ts:142`; migração `20261006:231-252`) | Valida nome, produto, vagas, briefing, remuneração e condições de pagamento. Congela a taxa da Squad. Status vira `open`. Clique repetido não republica | Funciona. **VERIFICADO** |
| 3 | Admin seleciona e convida creators | `CampaignWorkspace.tsx:152, 368, 408` | `brand_invite` (`20261008:60-74`) grava `campaign_creators` com `stage = invited` e notifica o creator. Sem e-mail | Só admin | Funciona. **VERIFICADO** |
| 4 | Creator aceita condições e se candidata | `CreatorFlow.tsx:40, 63, 92` | `creator_apply` (`20261008:111-130`) grava `applied`, a versão aceita das condições e a data do aceite | Exige a versão atual das condições. Qualquer creator pode se candidatar a campanha aberta | Funciona. **VERIFICADO** |
| 5 | Admin contrata ou recusa | `CampaignWorkspace.tsx:166, 176-177` | `brand_participant` (`20261008:76-109`) muda para `shipping` (se houver produto) ou `producing`, e a campanha para `in_progress` | Só admin. Exige aceite e vaga livre | Funciona. **VERIFICADO** |
| 6 | Creator informa endereço | `CreatorFlow.tsx:178-213` | `creator_set_shipping` (`20261008:132-144`) | Só em `shipping`. Endereço fica privado | Funciona. **VERIFICADO** |
| 7 | Admin registra o envio ao creator | `CampaignWorkspace.tsx:184-276` ("Produto enviado") | `brand_participant` com `action = shipped` (`20261008:100-106`) muda para `producing` e notifica o creator | Só admin, só em `shipping` | Funciona para a Squad. **VERIFICADO** |
| 8 | **Marca envia produtos para a Squad** | Só texto (`CampaignWorkspace.tsx:81`) | Nada | Nenhuma | **Só interface. Ponto sem registro.** |
| 9 | Creator envia o vídeo | `CreatorFlow.tsx:185-231`; upload em `campanhas/` | `creator_submit` (`20261008:146-168`) grava `contents` com status `squad_review` | Só em `producing` ou `revision`. Limite de 500 MB no cliente | Funciona. Arquivo órfão se o registro falhar |
| 10 | Squad triagem | `CampaignWorkspace.tsx:346-349` | `squad_screen` (`20261008:171-198`): "encaminhar" muda para `reviewing` com prazo; "ajustar" muda para `revision_requested` sem gastar as revisões da marca | Só admin | Funciona. **VERIFICADO** |
| 11 | Marca vê e aprova (ou pede ajuste) | `CampaignWorkspace.tsx:332, 356-357` | `brand_review` (`20261006:435-459`) → `squad_approve_content` (`:403-433`): status `approved`, calcula o total da marca (cachê + taxa) e prazo de pagamento | A marca só lê o que foi encaminhado (`forwarded_at`). Sem decisão no prazo, aprova sozinha | Funciona. A aprovação automática só roda quando alguém abre a tela (`squad_run_deadlines`). Se não houver `pg_cron`, o prazo não é cumprido sozinho. **INFERIDO** |
| 12 | Marca informa que pagou a Squad | `CampaignWorkspace.tsx:303` | `brand_report_payment` (`20261006:461-476`) grava referência e comprovante. Não muda o status do pagamento | Exige referência | Funciona. **VERIFICADO** |
| 13 | Admin confirma recebimento da Squad | `CampaignWorkspace.tsx:304` | `admin_payment` ação `received` (`20261006:478-508`) | Só admin | Funciona. **VERIFICADO** |
| 14 | Admin repassa ao creator | `CampaignWorkspace.tsx:305` | `admin_payment` ação `payout` (`:478-508`): status `repassado`, etapa `paid`, notifica o creator | Só em `recebido`. O PIX em si é externo | Funciona (registro). **VERIFICADO** |
| 15 | Creator vê o recebimento | `CreatorFlow.tsx:238` | Só leitura de `campaign_creators` | Nenhum botão de saque, o que está correto | Funciona. **VERIFICADO** |

**Onde o fluxo para:**

- No **pagamento externo**, que é manual por regra. O sistema registra cada etapa, mas não movimenta dinheiro.
- Antes disso, na **etapa 8**: a marca não tem como registrar o envio dos produtos para a Squad. Hoje isso só é texto.
- Na **Campanhas & Squads do admin**, a tela pode aparecer vazia por motivos que não foram confirmados (ver seção 8).
- Em **três caminhos paralelos que não são o fluxo oficial**: a moderação do admin (`AdminModeration.tsx`) muda estado só na memória; o `createCampaign` de `DataContext.tsx:546` faz insert direto (mas só é chamado por código morto); e `supabaseService.updateParticipantStage` (`supabaseService.ts:324`) escreve direto em `campaign_creators` (também só por código morto).

**Outros pontos do fluxo:**

- O estado `hired` documentado no CLAUDE.md nunca é gravado pelo banco.
- Cachê zero: a entrega aprovada fica com `payment_status = nao_devido` e nenhuma função leva esse creator ao estado `paid`.
- A marca pode concluir ou cancelar a campanha (`campaign_set_status`, `20261006:254-266`), mesmo com creators em produção. Decisão de negócio pendente.
- A tela do creator (`CreatorFlow.tsx:93, 177`) diz "a marca escolhe quem contratar", o que contradiz a regra de curadoria pela Squad.

---

## 4. Fluxo de cupom e afiliado, etapa por etapa

Resumo: **não existe**. Todos os números da tela são constantes do código ou fallback.

| # | Etapa | Tela e código | O que acontece de fato | Estado |
|---|---|---|---|---|
| 1 | Marca cria oferta | `SquadraAffiliates.tsx:58-72, 121-140` ("Nova Proposta de Venda") | Grava só no `localStorage` (`DataContext.tsx:711-724`). Marca fixa `brand-current` e nome fixo "Minha Marca" (`:126-127`). Cupom padrão `MEUCUPOM15` e preço padrão 199,90. Nenhuma chamada ao Supabase | Só interface |
| 2 | Lista de ofertas | `SquadraAffiliates.tsx:220, 287-300` | Lê o `localStorage`. Se estiver vazio, mostra as propostas de exemplo da Vòlia Cosméticos (`squadraData.ts:410-451`, com cupons BLINDAGEM15 e GELCOLECAO e contagens fixas de vendas) | Dado fixo. **VERIFICADO** |
| 3 | Candidatura do creator | `DataContext.tsx:90-94, 320-326` | Não existe função para o creator se candidatar. Candidaturas são só as de exemplo (`squadraData.ts:453+`) | Não existe |
| 4 | Aprovação e cupom do creator | `SquadraAffiliates.tsx:158-167`; `DataContext.tsx:742-766` | Muda status na memória. Cupom sugerido vem de `requested_coupon` ou de `CUPOM15`. Não checa se o cupom já existe. Nada vai ao banco | Só interface |
| 5 | Link e cupom mostrados ao creator | Não há tela ativa de afiliado no painel do creator (`CreatorEarningsReal`, `CreatorFlow.tsx:238`, mostra só cachês). INFERIDO | Link fixo `loja.glamgel.com.br` em `squadraData.ts:397` | Não existe no painel ativo |
| 6 | Registro de vendas | Não existe | Não há webhook de loja (o único webhook é de leads), não há integração com Shopify, Nuvemshop, WooCommerce ou TikTok Shop, e não há importação de CSV | **Não existe** |
| 7 | Cálculo de comissão | `squadraData.ts:401-404` | `commission_generated = gmv × 0.12`, com GMV = vendas × 189,90. Tudo constante. Diverge dos 15% da proposta (`squadraData.ts:419-426`) | Dado fixo |
| 8 | Painel de ganhos do creator | Só ganhos de cachê (ver linha 5) | Nenhuma comissão de venda entra em ganhos | **Não existe** |
| 9 | Painel da marca (vendas diretas) | `BrandDashboard.tsx:108, 119-120` (INFERIDO: não confirmei se é rota ativa) | Soma valores fixos ao real: +185000 views, +12840 de receita, +142 vendas | Dado fixo somado ao real |
| 10 | Painel do admin (rastreamento) | `SquadraAffiliates.tsx:79, 93-96, 692-742` | GMV, comissões e pedidos vêm de `SQUADRA_AFFILIATES` (constante). Texto "808+ creators da base qualificada" (`:272`, literal). Botão "Exportar CSV" (`:198-203`) não tem `onClick` | Dado fixo |

**Tabelas no banco:** `affiliate_links` e `affiliate_sales` existem só nas migrações (`20261002_squadra_mvp.sql:242-265`). Nenhum código de `src/` as lê ou escreve. Em `20261002_squadra_mvp.sql:337`, `affiliate_links` tem política de leitura pública `USING (true)`. A tabela `affiliate_sales` não tem RLS e aceita tudo para `anon` (**VERIFICADO** na réplica; **INFERIDO** em produção).

**Onde o fluxo para:** em `SquadraAffiliates.tsx:163-167`, que chama `DataContext.tsx:742-766`. É uma mudança de estado no navegador. Não há cupom gerado no servidor, não há registro de venda e não há comissão calculada.

**Pergunta de decisão para o piloto:** de onde virão as vendas? Opções: (a) planilha ou CSV enviado pela marca, (b) webhook da loja, (c) integração direta com TikTok Shop ou Shopify. Sem essa resposta, o módulo não pode ser construído.

---

## 5. Lista completa de dados de demonstração a remover

Legenda: **"Real?"** = aparece para o usuário como se fosse real. **Morto** = não é alcançado por nenhuma rota (apagar o arquivo).

### 5.1 Dados e fallbacks que aparecem como reais

| Arquivo:linha | O que é | Tela afetada | Real? | O que fazer |
|---|---|---|---|---|
| `src/context/DataContext.tsx:164, 185` + `src/data/squadraData.ts:120-141` | 200 PDVs gerados por código, com redes reais (Droga Raia, Sephora Brasil) e filiais e cidades inventadas | Dashboard (KPI "PDVs"), Varejo, mapa | **Sim** (quando o banco não tem PDV) | Remover o gerador. Estado inicial vazio. Dado só por importação |
| `src/context/DataContext.tsx:309, 366-368` + `src/data/squadraData.ts:26-80` | Marcas fictícias: Squadra Nutrition, Longevita 50+ (com contato "Dr. Roberto Longevita", linha 54) e BioEquilíbrio | Marcas, seleção de marca, Configurações | **Sim** (quando o banco não tem marcas) | Remover os seeds |
| `src/context/AuthContext.tsx:271-283` | Sessão real de marca sem cadastro em `brands` recebe `SQUADRA_BRANDS[0]` (Squadra Nutrition) como perfil | Cabeçalho e perfil da marca | **Sim** | Retornar `null` e tratar como cadastro pendente |
| `src/context/DataContext.tsx:317, 325` + `src/data/squadraData.ts:410-476` | Propostas da "Vòlia Cosméticos" (com preços, cupons, lojas e contagens de vendas inventados) e candidaturas de exemplo | Afiliados | **Sim, sempre** | Remover. Ligar a tabela real ou deixar vazio |
| `src/pages/squadra/SquadraAffiliates.tsx:652` | "Ticket médio R$ 189,90" fixo | Afiliados, KPIs | **Sim** | Calcular do dado real ou mostrar "—" |
| `src/pages/squadra/SquadraReports.tsx:184-192` | Views 2,84 mi, engajamento 4,52% e GMV R$ 258.450,00 fixos no card "Resultados Consolidados da Amostra" | Relatórios | **Sim** | Calcular do banco ou remover o card |
| `src/pages/squadra/SquadraReports.tsx:45-47` | CSV exportado com 2840000, '4.5%' e '258450.00' fixos | Relatórios (exportação só admin) | **Sim** (no arquivo baixado) | Gerar do dado real ou remover a exportação |
| `src/context/DataContext.tsx:284` + `src/pages/creator/CreatorAcademy.tsx` | `return MOCK_COURSES;`, com instrutora "Camila Rodriguez & Time Nail Club" | Academia do creator ("Cursos Disponíveis") | **Sim** | Retornar `[]` ou ler de tabela real |
| `src/context/DataContext.tsx:656` | `camp.commission_value \|\| 350`: aprovar entrega cria ganho de R$ 350 quando falta cachê. Se for percentual, cria o valor percentual como reais | Ganhos do creator (localStorage), `src/components/brand/` | **Sim** | Remover. Pagamento só pelas funções do banco |
| `src/context/DataContext.tsx:1078-1081` + `src/pages/squadra/SquadraCreators.tsx:147` | Creator criado à mão recebe engajamento 4,2, operational_score 85, profile_completion 100 e verificação `verified` | Creators (só local) | **Sim** | Deixar vazio ("—"). Nunca marcar como verificado por padrão |
| `src/pages/squadra/SquadraDashboard.tsx:343, 354` | `operational_score \|\| 85` e `engagement_rate \|\| 4.2` | Dashboard, tabela de creators | **Sim** (creator sem medição mostra 85 e 4,2%) | Mostrar "—" |
| `src/pages/squadra/SquadraDashboard.tsx:158, 165, 179` + `src/context/DataContext.tsx:178-186` | Contadores de TikTok, Instagram e únicos viram 0 quando o banco está vazio, em vez de "—" | Dashboard | **Sim** | Devolver `null` e mostrar "—" |
| `src/pages/admin/AdminDashboard.tsx:98`, `src/pages/admin/AdminFinance.tsx:59` | GMV = `totalVolume + 145000` (constante somada ao real) | Dashboard e Financeiro do admin | **Sim** | Remover a soma |
| `src/pages/squadra/SquadraSettings.tsx:107-116` | Fallback de marca: "Squadra Nutrition Alimentos Funcionais Ltda", CNPJ fictício e e-mail de exemplo | Configurações | Não na prática (marcas sempre têm seeds) | Remover, junto com os seeds |
| `src/components/brand/ContentApprovalCard.tsx:8, 19-20` | Fallback para `MOCK_CREATORS[0]` e `MOCK_CAMPAIGNS[0]` quando não acha o creator ou a campanha | Conteúdos da marca (rota ativa `/marca/conteudos`) | **Sim**, quando não há correspondência | Mostrar "—" |
| `src/components/creator/CampaignCard.tsx:8, 23` | Fallback para `MOCK_BRANDS[0]`, marca fictícia no card | Cards de campanha do creator | **Sim**, quando a campanha não tem marca | Mostrar "—" |
| `src/pages/landing/LandingPage.tsx:153` | Texto fixo "18.000+ creators e manicures mapeadas na base" | Landing pública | **Sim** | Trocar pela contagem do banco ou remover. O número também viola a regra do projeto |
| `src/pages/squadra/SquadraCampaignDetail.tsx` (linhas 113-122 e 780-792) | Série "Dia 1..30" e CTR, pedidos, ticket, GMV e ROI fixos | Detalhe de campanha | **Morto** (ver 5.2). Mesmo assim, apagar | Apagar o arquivo |
| `src/supabase/migrations/20261002_squadra_mvp.sql:289-296` | Tabela `source_counts` com DEFAULT 17000, 799, 560, 8059 e 18359 (as bases que o usuário proibiu) | Nenhuma tela lê essa tabela | Não, mas o número existe no banco | Criar nova migração que remova os defaults ou apague a tabela. **Não editar a migração antiga** |

### 5.2 Código morto que contém dado fixo (apagar)

Estes arquivos não são importados por nenhuma rota de `App.tsx`. Mesmo assim contêm dado fixo ou caminho proibido.

- `src/pages/squadra/SquadraCampaigns.tsx` e `src/pages/squadra/SquadraCampaignDetail.tsx`. A frente 5 disse que o detalhe aparece para o usuário. A busca de importação mostra que não: o detalhe só é importado por `SquadraCampaigns.tsx`, que não é usado por nenhuma rota.
- `src/pages/creator/CreatorEarnings.tsx`: contém o modal "Saque PIX" e os links de afiliado fixos (`MOCK_AFFILIATES`). Proibido pela regra e não alcançável.
- `src/pages/creator/CreatorDashboard.tsx`, `src/pages/brand/BrandCampaigns.tsx`, `src/pages/creator/CreatorCampaigns.tsx`, `src/pages/brand/BrandApplications.tsx`, `src/components/brand/CandidateReviewCard.tsx`.
- `src/pages/squadra/SquadraDashboard.tsx:40-48` (`PERFORMANCE_DATA`, 30 dias fictícios): declarado e não usado.

### 5.3 O botão "Limpar Mockups & Restaurar Base"

**Onde está:** `src/pages/squadra/SquadraBrands.tsx:189-199` (botão; rótulo na linha 198), modal em `:627-660`, e handler `handleCleanMockups` em `:155-159`.

**O que faz de verdade** (`src/context/DataContext.tsx:1172-1195`, função `cleanMockData`):

1. Apaga 13 chaves do `localStorage`: `squadra_brands`, `squadra_campaigns`, `squadra_creators_v2`, `squadra_retail_points`, `squadra_shipments`, `squadra_participants`, `squadra_submissions`, `squadra_score_weights`, `ncp_campaigns`, `ncp_creators`, `ncp_brands`, `ncp_products`, `ncp_portfolio`.
2. **Não** apaga `squadra_applications`, `squadra_affiliate_proposals`, `squadra_affiliate_applications`, `ncp_earnings`, `ncp_courses` nem `ncp_notifications`. Esses continuam na tela.
3. Recarrega na memória os seeds de `src/data/squadraData.ts`: 3 marcas fictícias (Squadra Nutrition selecionada), 200 PDVs gerados, creators vazio. Campanhas, entregas, participantes e submissões ficam vazias.
4. Os efeitos de sincronização gravam esse estado no `localStorage` logo em seguida (`DataContext.tsx` por volta das linhas 371-410). Por isso os 200 PDVs fictícios voltam depois de recarregar.

**Não escreve no banco.** Nenhuma chamada ao Supabase é feita, e nenhuma linha do banco é apagada.

**Efeitos que importam:**

- Até o próximo recarregamento, campanhas, participantes e entregas reais somem da tela. Eles continuam no banco.
- Depois de recarregar, a sincronização de sessão (`DataContext.tsx` por volta das linhas 331-370) recarrega do banco o que existir, e só mantém os seeds onde o banco estiver vazio.

**O texto está errado:** o modal (linhas 636-640) diz que restaura "os dados reais oficiais alinhados à planilha do cliente". O toast (linha 157) diz "Base oficial de marcas e dados reais restaurada". Nada disso é verdade: o que volta são os seeds fictícios do código.

**Também não tem guarda de demonstração:** o botão aparece em produção. A rota `/painel/marcas` não tem guarda de papel (`App.tsx:167-168`), então qualquer usuário logado pode abri-la pela URL.

**Recomendação:** remover o botão. Se o objetivo for limpar o navegador de um avaliador, trocar por "Limpar dados locais deste navegador", com texto honesto e sem seeds.

### 5.4 Botão "Resetar" do banner de demonstração

`src/components/layout/DemoBanner.tsx:112` chama `resetToDemoDefaults` (`DataContext.tsx:1122-1137`). Só aparece com `VITE_DEMO_MODE=true` (`App.tsx:258`). Não toca no banco. Não precisa de ação em produção.

---

## 6. Riscos de segurança e privacidade

Ordenados por gravidade. Todos foram verificados na **réplica das migrações versionadas** (PGlite), exceto onde indicado. O estado real de produção precisa ser conferido com as consultas da seção 8.

### Críticos (bloqueiam dar acesso a marca)

1. **Tabelas sem RLS com acesso total para `anon`.** `notes`, `activities`, `memberships`, `creator_social_accounts`, `creator_tags`, `content_metrics` e `affiliate_sales` não têm RLS e concedem leitura, escrita e exclusão à chave pública (`src/supabase/migrations/20261002_squadra_mvp.sql`, criação de cada tabela). `notes` guarda observações internas sobre creators. **VERIFICADO** na réplica. Correção: `ENABLE ROW LEVEL SECURITY`, `REVOKE ALL FROM anon, authenticated` e política só para admin.

2. **E-mail e telefone de todos os perfis legíveis pela chave pública.** A política "Allow public read profiles" com `USING (true)` (`20261002_squadra_mvp.sql:327`) nunca foi removida, e não há restrição por coluna. Qualquer visitante lê `email` e `phone` de `profiles`. **VERIFICADO** na réplica. Viola a regra de privacidade do CLAUDE.md. Correção: remover a política, e expor só colunas públicas por view ou rpc. Antes de remover, conferir quais telas dependem da leitura pública de `profiles`.

3. **Candidaturas com e-mail e telefone legíveis pela chave pública.** `campaign_applications` tem a política "Allow public read campaign_applications" `USING (true)` (`20261002_squadra_mvp.sql:333`), e as colunas `creator_email` e `creator_phone` estão expostas (linhas 177-178). **VERIFICADO** na réplica. Correção: remover a política; leitura só para admin e para o próprio creator.

4. **Gate de admin libera qualquer usuário logado.** `src/components/admin/AdminAuthGuard.tsx:45-48` chama `login()` e, se der certo, libera as telas (`:68-69`), sem checar papel. Um creator ou uma marca que digite as próprias credenciais vê `/admin/*`, `/painel/bi-redes`, moderação, financeiro e academia. A proteção dos dados depende da RLS, mas a interface mostra telas administrativas. **VERIFICADO** no código. Correção: checar `role` depois do login.

5. **Funções `SECURITY DEFINER` executáveis por `anon`.** O padrão do Supabase concede `EXECUTE` a `anon` diretamente, e `REVOKE … FROM PUBLIC` não remove isso. Afetadas: `squad_notify` (insere notificação para qualquer `user_id` com link arbitrário, o que permite phishing dentro do sistema), `squad_notify_admins`, `creator_auth_id` (mapeia creator para `auth_user_id`), `squad_run_deadlines`, `squad_setting` e `squad_contact_counts`. **VERIFICADO** na réplica. Correção: `REVOKE ALL … FROM anon, authenticated`.

### Altos

6. **`my_creator()` devolve a linha completa do creator, com contato,** para quem tem o e-mail no JWT (`20261005_protege_contatos.sql:47-49`). Só é seguro se o Supabase exigir confirmação de e-mail, configuração que não está no repositório. **NÃO VERIFICADO.** Correção: checar `email_confirmed_at` dentro da própria função.

7. **Cadastro falso.** O formulário de nova conta não cria login (`AuthContext.tsx:363-478`) e descarta a senha. Grava números inventados em `creators` (15000, 25000, 4.8, 85, 80). O id `creator-${Date.now()}` não é UUID, então o insert provavelmente falha em silêncio. **INFERIDO** no banco. Correção: esconder a aba.

8. **Defaults fictícios no banco.** A tabela `creators` (`20261002`, linhas 65-90) tem defaults `operational_score = 85`, `engagement_rate = 4.20`, `profile_completion = 95` e `verification_status = 'verified'`. Um insert sem esses campos grava valores inventados.

9. **Credenciais de demonstração no código-fonte.** Há literais de senha de demonstração em `src/pages/auth/AuthPage.tsx:48` e `src/components/admin/AdminAuthGuard.tsx:36`. Só são usados com `VITE_DEMO_MODE=true`, e `.env.production` tem `false`. Ainda assim, o repositório é público. A senha não foi reproduzida neste relatório. Correção: remover do código.

10. **Painel de Financeiro do admin sugere pagamento automático.** O botão "Processar Lote de Pagamento Automático PIX" (`AdminFinance.tsx:19-25`) muda status para "pago" só na memória (`DataContext.tsx:776-792`). Um admin pode achar que o repasse foi feito. Viola a regra de "nada de pagamento simulado". **VERIFICADO**.

### Médios

11. **`creator_metrics`:** se a migração `20261008` não estiver aplicada em produção, a política `USING (true)` de `20261007` (`:29-30`) deixa qualquer usuário logado ler as métricas de todos. **INFERIDO**: conferir com a consulta da seção 8.

12. **`ncp_creator_profiles`:** a política (`20260911_fase1_security_rls.sql:166-175`) libera leitura a qualquer perfil ativo, e o frontend faz `select('*')` nessa tabela (`src/services/supabaseService.ts:456-457`). A tabela não está no repositório, então não é possível dizer se há contato. **NÃO VERIFICADO.**

13. **`creator_auth_id`** (`20261006`, linhas 133-136) não tem checagem de papel e pode ser chamada por `anon` (ver item 5).

14. **Funções `ncp_*` apontam para tabela legada.** `ncp_is_admin` consulta `ncp_profiles`, enquanto o resto usa `profiles` e `squad_is_admin`. O admin do Squad pode não passar nas funções `ncp_*`, o que gera erro de "sem permissão" em `PdvMarketMap.tsx`. **INFERIDO.**

15. **Token do Apify na URL.** `scripts/buscar-creators-*.mjs` e `scripts/medir-creator-tiktok.mjs` passam o `APIFY_TOKEN` na query string. Pode aparecer em logs de proxy. Só roda na máquina do operador.

16. **Dados de cadastro no navegador.** `AuthContext.tsx:180-181` guarda no `localStorage` a linha do próprio creator, com e-mail e telefone dele. Risco baixo, mas em computador compartilhado é exposição.

### Baixos

17. **`.env.production` está versionado no git.** Contém a URL e a chave `anon` do Supabase, que são públicas por desenho, e não contém chave de serviço. `.gitignore` só cobre `.env` e `.env.*.local`. **VERIFICADO.**

18. **Chave de serviço fora do código.** `SUPABASE_SERVICE_ROLE_KEY` aparece em 13 scripts, sempre por `process.env`, e em `.env` (não versionado). Não há valor de segredo em `src/`. **VERIFICADO.**

19. **Falsos positivos de segredo:** `public/favicon.svg:1` e `src/assets/vite.svg:1` têm `sk-` dentro de SVG; `scripts/enrich-instagram-apify.mjs:9` tem um placeholder. Nenhum é segredo.

20. **Os testes de banco não cobrem exposição.** O teste de 108 verificações não checa `profiles`, `campaign_applications`, `notes` nem as tabelas sem RLS. Ele passa mesmo com os riscos 1 a 3 abertos.

### Contatos de creators: resposta direta

- **Marca na interface:** não vê e-mail, WhatsApp nem telefone de creator. **VERIFICADO** no código (`SquadraCreators.tsx:63`, com `canSeeContacts` só para admin).
- **Marca pelo banco:** **sim, pode ver**, pelos itens 2 e 3 acima. A marca lê `profiles` e `campaign_applications` com a chave pública e os dados aparecem.
- **Creators e PDVs no banco:** protegidos. `creators` e `retail_points` têm concessão por coluna, sem e-mail nem telefone para `anon` ou `authenticated`. **VERIFICADO** (`has_column_privilege` retornou falso).
- **Nenhuma consulta de `select('*')` em `creators` ou `retail_points` existe em `src/`.** **VERIFICADO** por busca.

---

## 7. Pendências para um piloto com 3 marcas

Esforço: **P** = até meio dia; **M** = 1 a 2 dias; **G** = mais de 2 dias. A base de cada estimativa está ao lado.

### 7.1 Obrigatório antes de dar acesso a uma marca

| # | Item | Esforço | Base da estimativa |
|---|---|---|---|
| 1 | Confirmar no Supabase de produção o estado de RLS e policies das tabelas (seção 8) | P | Consultas de leitura prontas |
| 2 | Ativar RLS e revogar `anon` em `notes`, `activities`, `memberships`, `creator_social_accounts`, `creator_tags`, `content_metrics`, `affiliate_sales` | M | Mudança em uma migração nova. A réplica de teste já existe e cobre o padrão |
| 3 | Remover a política pública de `profiles` e expor só colunas públicas | M | Precisa mapear quais telas leem `profiles` antes. Pode quebrar login por e-mail (`AuthContext.tsx:244-249`) |
| 4 | Remover a política pública de `campaign_applications` | P | Uma linha de política; conferir que a tela de candidatura usa só insert |
| 5 | `REVOKE` de `anon` nas funções `SECURITY DEFINER` (`squad_notify`, `squad_notify_admins`, `creator_auth_id`, `squad_run_deadlines`, `squad_setting`, `squad_contact_counts`) | P | Uma migração curta; o teste de 108 verificações deve continuar passando |
| 6 | Checar papel `admin` depois do login em `AdminAuthGuard` e proteger por papel as rotas de `/painel/*` que são de admin | M | Mudança em dois arquivos e em `App.tsx`. Testar cada papel |
| 7 | Esconder o cadastro falso e remover a senha de demonstração do código | P | Remover a aba e os literais |
| 8 | Remover o botão "Processar Lote de Pagamento Automático PIX" e o fallback de R$ 350 | P | Remover o botão e a linha `DataContext.tsx:656` |
| 9 | Remover ou mostrar "—" nos dados fixos que a marca enxergaria (Relatórios, Afiliados, Academia, landing "18.000+", fallbacks 85/4,2, somas de GMV) | M | Cerca de 15 arquivos. A maioria é trocar valor fixo por "—" |
| 10 | Remover os seeds de marcas e PDVs, e o botão "Limpar Mockups & Restaurar Base" | M | Mudança em `DataContext.tsx` (seeds e sincronização) e em `SquadraBrands.tsx`. Precisa testar que a sincronização não quebra |

### 7.2 Necessário para rodar a primeira campanha

| # | Item | Esforço | Base da estimativa |
|---|---|---|---|
| 11 | Confirmar que a organização padrão (`…0001`) existe, ou que o insert da marca funciona sem ela | P | Consulta de leitura. Se faltar, uma linha de seed em migração |
| 12 | Descobrir por que "Campanhas & Squads" fica vazia (seção 8) e corrigir a causa | P a M | Depende da consulta. Se for o `auth_user_id` do admin, uma correção em `profiles` |
| 13 | Confirmar que `pg_cron` roda `squad_run_deadlines`, ou criar o agendamento. Sem isso, a aprovação automática só acontece quando alguém abre a tela | P (confirmar) ou M (criar) | Verificar em `cron.job`. Criar exige agenda no Supabase |
| 14 | Corrigir ou remover a moderação de campanhas do admin (`AdminModeration`) | P | Só remover a rota; o fluxo oficial já tem as funções |
| 15 | Registrar o envio do produto pela marca para a Squad (etapa 8) | M | Uma ação nova em `CampaignWorkspace.tsx` e uma função no banco, ou processo manual documentado |
| 16 | Teste ponta a ponta de uma campanha real com conta de teste (criar, publicar, convidar, entregar, aprovar, registrar pagamento) | M | Roteiro manual. Dura o tempo de um ciclo completo |
| 17 | Rodar `npm run build` completo (o `vite build` não foi verificado) e publicar | P | Build e deploy. Se passar, é só publicar |
| 18 | Tirar do bundle publicado os dados de demonstração, conferindo que `grep` de "Squadra Nutrition", "258.450" e "Limpar Mockups" dê zero | P | Depois dos itens 9 e 10. Conferir também o endereço em `nailclubpro.com.br` |

### 7.3 Pode esperar

| # | Item | Esforço | Base da estimativa |
|---|---|---|---|
| 19 | Módulo de afiliados e cupom (geração de cupom, registro de vendas, comissão, painel do creator) | G | Nada existe. Depende da decisão sobre a fonte das vendas (seção 4). Precisa de modelagem, funções no banco e tela |
| 20 | Integração com loja (TikTok Shop, Shopify, Nuvemshop, WooCommerce) | G | Zero código. Depende de API e credenciais de cada loja |
| 21 | Integração de pagamento (Asaas, Stripe, Mercado Pago) | G | Zero código. Não é necessária enquanto o pagamento for manual, como a regra manda |
| 22 | Saque PIX do creator | G | Não deve ser feito pela regra atual |
| 23 | BI de Redes Sociais funcionando de verdade | M | Corrigir o loader (seção 2.2) é P. Depois, o dado de `creator_metrics` precisa existir (depende da coleta, que é script com custo) |
| 24 | Relatórios com dado real | M a G | Depende de existir dado de venda e de campanha consolidado |
| 25 | E-mail transacional (convite, notificação) | G | Não existe e a regra diz que convite não envia e-mail. Só mexer se o piloto exigir |
| 26 | Apagar código morto (seção 5.2) | P | Apagar arquivos sem importadores. Reduz risco de reativação |
| 27 | Documentar as tabelas `ncp_*` que não estão no repositório (`20260911_fase1`) | M | Precisa extrair o schema do banco de produção |
| 28 | Ajustar o `AdminFinance` para usar `squad_settings` em vez de 15% fixo | P | Uma leitura de tabela |
| 29 | Remover `.env.production` do git, se a política for não versionar variáveis de produção | P | Ajuste de `.gitignore` e do índice do git |

---

## 8. O que não foi possível verificar, e por quê

**Estado do banco de produção.** Nenhuma consulta foi feita ao Supabase real. Só foram lidas as migrações versionadas e uma réplica em memória (PGlite). Não se sabe se todas as migrações foram aplicadas, se há alterações manuais feitas direto no painel do Supabase, ou se as tabelas `ncp_*` e `20260911_fase1` existem. Não tenho acesso de leitura aprovado para isso nesta tarefa.

**Consultas que você pode rodar no SQL Editor do Supabase.** São somente leitura (`SELECT`), e não alteram nada:

```sql
-- 1. Quais tabelas têm RLS ligado
select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and relkind = 'r' order by relname;

-- 2. Políticas de profiles, campaign_applications e creator_metrics
select tablename, policyname, cmd, qual from pg_policies
where tablename in ('profiles', 'campaign_applications', 'creator_metrics');

-- 3. Quais funções SECURITY DEFINER anon pode executar
select p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') as anon_pode
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef order by p.proname;

-- 4. Contagem de registros das tabelas principais
select 'campaigns' t, count(*) from campaigns union all
select 'creators', count(*) from creators union all
select 'retail_points', count(*) from retail_points union all
select 'brands', count(*) from brands union all
select 'profiles', count(*) from profiles union all
select 'campaign_creators', count(*) from campaign_creators union all
select 'creator_metrics', count(*) from creator_metrics;

-- 5. Perfis de admin (sem mostrar e-mail): confere auth_user_id
select id, role, (auth_user_id is not null) as tem_auth_id from profiles
where role in ('admin_master', 'admin');

-- 6. Organização padrão usada pelas campanhas
select exists(select 1 from organizations where id = '00000000-0000-0000-0000-000000000001') as existe;

-- 7. Cron das deadlines
select jobname, schedule from cron.job;
```

**Contagem de registros:** não foi feita. A consulta 4 acima dá esse número.

**Build de produção:** `vite build` não foi rodado, porque escreve em `dist/`. O `tsc` passou.

**Testes de integração de ponta a ponta:** não foram feitos no navegador. Nenhuma tela foi aberta logada.

**Pontos de frente que se contradisseram e foram resolvidos pelo código:**

- A frente 2 disse que `CampaignsPage` lê direto do banco. Confirmado.
- A frente 3 disse que a tela de ganhos do creator mostra links de afiliado fixos. Não é verdade: `CreatorEarnings.tsx` não é importado por nenhuma rota. A tela ativa é `CreatorEarningsReal`.
- A frente 5 disse que o detalhe de campanha com série fictícia aparece. Não é verdade: o arquivo é código morto. Continua sendo um problema a apagar.

**Pontos não auditados:** calculadora e simuladores (`/ferramentas`), `Navbar.tsx` completo, conteúdo completo de `SquadraSettings.tsx`, `CreatorAcademy.tsx` (lista de módulos planejados), e a sincronização completa de `DataContext.tsx` (linhas 371-410).

---

## Anexo A. Rotas do painel e papel que as acessa

Roteamento por estado interno (`src/App.tsx:148-236`, `src/lib/routes.ts`). Sem React Router. O papel vem de `profiles.role` (`AuthContext.tsx:161-172`), e a tabela aceita só `admin_master`, `brand_admin` e `creator` (`20261002_auth_3_levels.sql:9-11`).

| Rota | Componente | Quem acessa (de fato) |
|---|---|---|
| `/`, `/sobre`, `/para-creators`, `/para-marcas`, `/contato`, `/squad`, `/planos`, `/ferramentas/...` | Páginas do site | Todos |
| `/entrar` | `AuthPage` | Todos |
| `/termos`, `/privacidade` | Termos e privacidade | Todos |
| `/candidatura` | `SquadraCampaignApply` | Público, por desenho |
| `/recuperar-senha` | `SquadraResetPassword` | Público; tela simulada |
| `/painel` | `CreatorWorkReal`, `BrandHome` ou `SquadraDashboard` conforme o papel | Qualquer sessão |
| `/painel/creators` | `SquadraCreators` (admin e creator) ou `BrandHome` (marca) | Admin e creator veem a página; marca vê o início |
| `/painel/retail`, `/painel/campanhas`, `/painel/afiliados`, `/painel/relatorios`, `/painel/marcas`, `/painel/configuracoes` | Páginas do admin | **Qualquer sessão** (sem guarda de papel) |
| `/painel/bi-redes` | `SquadraSocialBI` | Gate de admin, que libera qualquer usuário logado |
| `/creator/painel`, `/creator/oportunidades`, `/creator/minhas-campanhas`, `/creator/portfolio`, `/creator/ganhos`, `/creator/perfil` | Páginas do creator | Creator e admin |
| `/creator/academy` | `CreatorAcademy` | Qualquer sessão |
| `/marca/painel`, `/marca/candidaturas` | `BrandHome` | Qualquer sessão |
| `/marca/campanhas`, `/marca/campanhas/nova` | `CampaignsPage` | Marca e admin |
| `/marca/conteudos`, `/marca/produtos` | `BrandContent`, `BrandProducts` | Marca e admin |
| `/admin/painel`, `/admin/moderacao/*`, `/admin/financeiro`, `/admin/academy` | Páginas do admin | Gate de admin (libera qualquer usuário logado) |

**Login e sessão:** com e-mail e senha pelo Supabase Auth. Sem sessão, `/painel/*` vai para `/entrar`, como a regra do projeto manda. Papel padrão antes de carregar o perfil é `creator` (`AuthContext.tsx:116-120`). O login por papel só existe com `VITE_DEMO_MODE=true` (`AuthContext.tsx:301-318`).

---

## Anexo B. Variáveis de ambiente (só nomes)

| Nome | Onde é lida | Onde está declarada |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts:3` | `.env`, `.env.example`, `.env.production` |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:4` | `.env`, `.env.example`, `.env.production` |
| `VITE_DEMO_MODE` | Várias telas e `AuthContext.tsx:111` | `.env`, `.env.example`, `.env.production` (valor `false` em produção) |
| `VITE_LEADS_WEBHOOK_URL` | `src/services/supabaseService.ts:391, 436` | Não declarada em nenhum `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | 13 scripts em `scripts/` | `.env` (não versionado) e `.env.example` (placeholder) |
| `APIFY_TOKEN` | Scripts de coleta | `.env` (falta em `.env.example`) |
| `APIFY_MAX_USD` | Scripts de coleta (opcional) | Não declarada (padrão 18.5) |

Nenhum valor de segredo foi lido ou impresso.
