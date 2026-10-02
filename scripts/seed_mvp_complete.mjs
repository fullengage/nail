import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bynhmqpdwtsyvfcxutbo.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const BRAND_GLAMGEL = '00000000-0000-0000-0000-000000000010';
const BRAND_PRONAIL = '00000000-0000-0000-0000-000000000011';
const BRAND_COUTURE = '00000000-0000-0000-0000-000000000012';

const CITIES_BY_STATE = [
  { state: 'SP', cities: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos', 'Sorocaba'] },
  { state: 'RJ', cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Petrópolis', 'Cabo Frio'] },
  { state: 'MG', cities: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Contagem', 'Montes Claros'] },
  { state: 'PR', cities: ['Curitiba', 'Londrina', 'Maringá', 'Cascavel', 'Ponta Grossa'] },
  { state: 'RS', cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'] },
  { state: 'BA', cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'] },
  { state: 'SC', cities: ['Florianópolis', 'Joinville', 'Blumenau', 'Balneário Camboriú', 'Chapecó'] },
  { state: 'GO', cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'] },
  { state: 'PE', cities: ['Recife', 'Olinda', 'Jaboatão dos Guararapes', 'Caruaru'] },
  { state: 'CE', cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Sobral'] }
];

const NETWORKS = [
  { name: 'Ikesaki Cosméticos', type: 'cosmetics' },
  { name: 'Danny Cosméticos', type: 'cosmetics' },
  { name: 'Perfumaria Sumirê', type: 'perfumery' },
  { name: 'Perfumaria Teruya', type: 'perfumery' },
  { name: 'Lojas REDE', type: 'cosmetics' },
  { name: 'Soneda Perfumaria', type: 'perfumery' },
  { name: 'Droga Raia', type: 'pharmacy' },
  { name: 'Drogasil', type: 'pharmacy' },
  { name: 'Pague Menos', type: 'pharmacy' },
  { name: 'Sephora Brasil', type: 'perfumery' },
  { name: 'Studio Nails Beauty Salão', type: 'salon' },
  { name: 'Distribuidora ProNail Express', type: 'distributor' }
];

async function seed() {
  console.log('--- SEEDING COMPLETO SQUADRA MVP ---');

  // 1. Inserir 200 PDVs (retail_points)
  console.log('Gerando 200 PDVs...');
  const { data: existingRetail } = await supabase.from('retail_points').select('id').limit(1);
  if (!existingRetail || existingRetail.length === 0) {
    const retailPoints = [];
    for (let i = 1; i <= 200; i++) {
      const net = NETWORKS[i % NETWORKS.length];
      const region = CITIES_BY_STATE[i % CITIES_BY_STATE.length];
      const city = region.cities[i % region.cities.length];
      const cnpjNum = String(10000000000000 + i * 3791).slice(0, 14);
      const cnpjFormatted = `${cnpjNum.slice(0,2)}.${cnpjNum.slice(2,5)}.${cnpjNum.slice(5,8)}/${cnpjNum.slice(8,12)}-${cnpjNum.slice(12,14)}`;

      retailPoints.push({
        organization_id: ORG_ID,
        name: `${net.name} - Filial ${city}`,
        trade_name: net.name,
        network: net.name,
        cnpj: cnpjFormatted,
        type: net.type,
        city: city,
        state: region.state,
        address: `Av. Principal, ${100 + i * 12} - Centro`,
        phone: `(${11 + (i % 80)}) 9${8000 + i}-${1000 + i}`,
        email: `loja.${city.toLowerCase().replace(/\s+/g, '')}@${net.name.toLowerCase().replace(/\s+/g, '')}.com.br`,
        manager_name: `Gerente Operacional ${i}`,
        status: i % 15 === 0 ? 'lead' : 'active'
      });
    }

    const { error: errRetail } = await supabase.from('retail_points').insert(retailPoints);
    if (errRetail) console.error('Erro ao inserir PDVs:', errRetail);
    else console.log('200 PDVs inseridos com sucesso!');
  } else {
    console.log('PDVs já existentes no banco.');
  }

  // 2. Inserir 6 Campanhas detalhadas
  console.log('Verificando 6 Campanhas...');
  const { data: existingCamp } = await supabase.from('campaigns').select('id').limit(1);
  let campaignIds = [];
  if (!existingCamp || existingCamp.length === 0) {
    const campaigns = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        organization_id: ORG_ID,
        brand_id: BRAND_GLAMGEL,
        title: 'Lançamento Linha Gel Diamante & Blindagem',
        slug: 'lancamento-gel-diamante-glamgel',
        description: 'Campanha de lançamento da nova fórmula do gel construtor com brilho diamante e primer hipoalergênico. Envio de kit completo para criação de vídeos de passo a passo e resenha autêntica.',
        objective: 'Gerar 50+ vídeos de UGC no TikTok e Reels e tracionar vendas com cupom exclusivo de 15% OFF.',
        campaign_type: 'ugc',
        cover_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
        start_date: '2026-10-01',
        end_date: '2026-11-15',
        application_deadline: '2026-10-15',
        creator_slots: 30,
        occupied_slots: 24,
        budget: 45000,
        commission_type: 'fixed',
        commission_value: 350,
        requirements_text: 'Mínimo 5.000 seguidores no TikTok ou Instagram. Foco em unhas, nail design ou beleza. Perfil ativo com boa iluminação.',
        deliverables_text: '1x TikTok ou Reel demonstrando a aplicação do Gel Diamante + 3x Stories com link rastreado e cupom.',
        status: 'open'
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        organization_id: ORG_ID,
        brand_id: BRAND_PRONAIL,
        title: 'Review Micromotores & Cabines LED UV Pro',
        slug: 'review-micromotores-pronail',
        description: 'Apresentação da nova linha de micromotores sem fio e cabines UV de 72W de alta performance para manicures profissionais.',
        objective: 'Autoridade técnica e geração de leads para distribuidores e lojas físicas autorizadas.',
        campaign_type: 'paid_content',
        cover_url: 'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=800',
        start_date: '2026-10-05',
        end_date: '2026-11-20',
        application_deadline: '2026-10-18',
        creator_slots: 15,
        occupied_slots: 12,
        budget: 32000,
        commission_type: 'fixed',
        commission_value: 800,
        requirements_text: 'Nail designers experientes com mais de 10.000 seguidores e público profissional.',
        deliverables_text: '1x Vídeo unboxing detalhado no TikTok/Reels com teste de ruído e ergonomia + 1 Carrossel técnico.',
        status: 'open'
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        organization_id: ORG_ID,
        brand_id: BRAND_COUTURE,
        title: 'Coleção Outono/Inverno Esmaltação em Gel',
        slug: 'colecao-outono-inverno-couture',
        description: 'Seeding exclusivo de 12 novas cores sofisticadas da paleta europeia com pigmentação ultra concentrada.',
        objective: 'Posicionamento premium da marca e presença forte em feeds e tutoriais de tendências.',
        campaign_type: 'product_seeding',
        cover_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
        start_date: '2026-09-15',
        end_date: '2026-10-30',
        application_deadline: '2026-10-10',
        creator_slots: 25,
        occupied_slots: 25,
        budget: 28000,
        commission_type: 'product_only',
        commission_value: 0,
        requirements_text: 'Estilo visual limpo, fotos bem iluminadas e afinidade com design minimalista.',
        deliverables_text: '2x Vídeos de swatches das cores nas unhas + Menção da marca @couturenails.',
        status: 'in_progress'
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        organization_id: ORG_ID,
        brand_id: BRAND_GLAMGEL,
        title: 'Desafio 30 Dias: Unhas Fortes e Blindadas',
        slug: 'desafio-30-dias-unhas-blindadas',
        description: 'Desafio viral de antes e depois usando o kit de tratamento e blindagem com Queratina e Cálcio.',
        objective: 'Viralização orgânica de depoimentos reais de crescimento e fortalecimento de unhas.',
        campaign_type: 'ugc',
        cover_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
        start_date: '2026-10-10',
        end_date: '2026-11-30',
        application_deadline: '2026-10-22',
        creator_slots: 40,
        occupied_slots: 18,
        budget: 50000,
        commission_type: 'fixed',
        commission_value: 400,
        requirements_text: 'Creators que mostrem sua rotina e transição de unhas naturais.',
        deliverables_text: '1x Vídeo de início + 1x Vídeo de resultado no dia 30 com fotos comparativas.',
        status: 'open'
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        organization_id: ORG_ID,
        brand_id: BRAND_PRONAIL,
        title: 'Live Commerce & Cupons Black Beauty VIP',
        slug: 'live-commerce-black-beauty',
        description: 'Venda ao vivo de combos promocionais de ferramentas com comissionamento agressivo de até 20%.',
        objective: 'GMV direto e conversão de vendas em tempo real via live no TikTok Shop e Instagram.',
        campaign_type: 'live_commerce',
        cover_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
        start_date: '2026-11-01',
        end_date: '2026-11-28',
        application_deadline: '2026-10-25',
        creator_slots: 20,
        occupied_slots: 8,
        budget: 20000,
        commission_type: 'percentage',
        commission_value: 20,
        requirements_text: 'Habilidade comprovada de venda em live e boa oratória.',
        deliverables_text: '2x Lives de 45 minutos demonstrando os produtos com cupom ativo.',
        status: 'draft'
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        organization_id: ORG_ID,
        brand_id: BRAND_COUTURE,
        title: 'Seeding Exclusivo Top 50 Creators Brasil',
        slug: 'seeding-exclusivo-top-50-creators',
        description: 'Envio de maletas personalizadas de couro com a coleção inteira para as 50 maiores influenciadoras.',
        objective: 'Gerar buzz no mercado nacional e ativação em massa nos stories.',
        campaign_type: 'product_seeding',
        cover_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
        start_date: '2026-08-10',
        end_date: '2026-09-30',
        application_deadline: '2026-08-25',
        creator_slots: 50,
        occupied_slots: 50,
        budget: 60000,
        commission_type: 'product_only',
        commission_value: 0,
        requirements_text: 'Creators verificadas com mais de 50.000 seguidores.',
        deliverables_text: 'Recebidos do mês e unboxing em destaque.',
        status: 'completed'
      }
    ];

    const { error: errCamp } = await supabase.from('campaigns').insert(campaigns);
    if (errCamp) console.error('Erro ao inserir Campanhas:', errCamp);
    else {
      console.log('6 Campanhas inseridas com sucesso!');
      campaignIds = campaigns.map(c => c.id);
    }
  } else {
    const { data: camps } = await supabase.from('campaigns').select('id');
    campaignIds = camps.map(c => c.id);
    console.log('Campanhas já existentes:', campaignIds.length);
  }

  // 3. Pegar creators existentes para popular o Pipeline de 14 Etapas, Shipments e Conteúdos
  const { data: creatorsList } = await supabase.from('creators').select('id, professional_name, tiktok, instagram, operational_score').limit(30);
  if (creatorsList && creatorsList.length > 0 && campaignIds.length > 0) {
    const targetCampId = campaignIds[0];
    const stages = [
      'discovery', 'invited', 'applied', 'screening', 'squad_approved',
      'briefing_sent', 'shipping', 'delivered', 'producing', 'submitted',
      'reviewing', 'approved', 'published', 'completed'
    ];

    console.log('Populando Squad no Pipeline de 14 etapas...');
    const campaignCreators = [];
    const shipments = [];
    const contents = [];
    const affiliateLinks = [];

    creatorsList.forEach((c, idx) => {
      const stage = stages[idx % stages.length];
      campaignCreators.push({
        campaign_id: targetCampId,
        creator_id: c.id,
        stage: stage,
        operational_score: c.operational_score || 85,
        notes: `Creator qualificada em ${new Date().toLocaleDateString('pt-BR')}. Boa taxa de visualizações.`,
        status: stage === 'completed' ? 'completed' : stage === 'approved' || stage === 'published' ? 'approved' : 'selected'
      });

      // Envios para quem está em shipping ou além
      if (['shipping', 'delivered', 'producing', 'submitted', 'reviewing', 'approved', 'published', 'completed'].includes(stage)) {
        shipments.push({
          campaign_id: targetCampId,
          creator_id: c.id,
          tracking_code: `BR${98234100 + idx}SP`,
          carrier: idx % 2 === 0 ? 'Correios' : 'Melhor Envio',
          status: stage === 'shipping' ? 'in_transit' : 'delivered',
          address_street: `Rua das Flores, ${200 + idx}`,
          address_city: 'São Paulo',
          address_state: 'SP',
          address_zip: `0131${idx}-000`,
          notes: 'Kit Gel Diamante + Pincel Esculpido + Base Blindada'
        });
      }

      // Conteúdos para quem está em submitted ou além
      if (['submitted', 'reviewing', 'approved', 'published', 'completed'].includes(stage)) {
        contents.push({
          campaign_id: targetCampId,
          creator_id: c.id,
          content_type: idx % 2 === 0 ? 'instagram_reel' : 'tiktok',
          media_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
          published_url: `https://tiktok.com/@${c.tiktok.replace('@','')}/video/728938192301`,
          caption: 'Passo a passo completo com o Gel Diamante da @glamgelbrasil! O que acharam desse acabamento espelhado? 💎✨ #UGC #UnhasDeGel',
          status: stage === 'submitted' ? 'reviewing' : stage === 'reviewing' ? 'reviewing' : 'approved'
        });
      }

      // Afiliados para quem já está publicando ou finalizou
      if (['published', 'completed', 'approved'].includes(stage)) {
        const handle = c.tiktok.replace('@','').toUpperCase();
        affiliateLinks.push({
          campaign_id: targetCampId,
          creator_id: c.id,
          code: `${handle}15`,
          url: `https://loja.glamgel.com.br/?cupom=${handle}15`,
          commission_percentage: 12.0,
          total_clicks: 140 + idx * 45,
          total_sales: 12 + idx * 4,
          gmv: (12 + idx * 4) * 189.90,
          commission_amount: ((12 + idx * 4) * 189.90) * 0.12,
          payment_status: stage === 'completed' ? 'paid' : 'approved'
        });
      }
    });

    // Inserir squad
    await supabase.from('campaign_creators').upsert(campaignCreators, { onConflict: 'campaign_id,creator_id' });
    console.log(`Squad com ${campaignCreators.length} creators distribuídos nas 14 etapas inserido!`);

    // Inserir shipments
    if (shipments.length > 0) {
      await supabase.from('shipments').insert(shipments);
      console.log(`${shipments.length} Envios de produtos (shipments) registrados!`);
    }

    // Inserir conteúdos
    if (contents.length > 0) {
      const { data: insertedContents } = await supabase.from('contents').insert(contents).select('id');
      console.log(`${contents.length} Conteúdos UGC registrados!`);

      // Inserir comentários/reviews de aprovação
      if (insertedContents && insertedContents.length > 0) {
        const reviews = [
          {
            content_id: insertedContents[0].id,
            author_name: 'Camila Brand Manager',
            author_role: 'brand_admin',
            comment: 'A iluminação ficou fantástica! Aprovadíssimo para veicular em tráfego pago.'
          },
          {
            content_id: insertedContents[0].id,
            author_name: 'Lucas Analista',
            author_role: 'analyst',
            comment: 'Lembrar de adicionar a hashtag #GlamGelDiamante na legenda final.'
          }
        ];
        await supabase.from('content_reviews').insert(reviews);
        console.log('Comentários de aprovação e reviews inseridos!');
      }
    }

    // Inserir affiliate links
    if (affiliateLinks.length > 0) {
      await supabase.from('affiliate_links').insert(affiliateLinks);
      console.log(`${affiliateLinks.length} Links e cupons de afiliados registrados!`);
    }
  }

  console.log('--- SEEDING FINALIZADO COM SUCESSO! ---');
}

seed().catch(console.error);
