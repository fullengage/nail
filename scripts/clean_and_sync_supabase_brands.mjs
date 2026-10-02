import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bynhmqpdwtsyvfcxutbo.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const BRAND_1 = '00000000-0000-0000-0000-000000000010';
const BRAND_2 = '00000000-0000-0000-0000-000000000011';
const BRAND_3 = '00000000-0000-0000-0000-000000000012';

async function run() {
  console.log('--- LIMPANDO MOCKUPS DE UNHAS E ATUALIZANDO PARA MARCAS REAIS DO CLIENTE ---');

  // 1. Atualizar Marcas
  const cleanBrands = [
    {
      id: BRAND_1,
      organization_id: ORG_ID,
      company_name: 'Squadra Sports Nutrition & Wellness Ltda',
      brand_name: 'Squadra Nutrition',
      cnpj: '34.891.204/0001-88',
      description: 'Suplementação esportiva de alta pureza, creatina micronizada, whey isolado e pré-treinos avançados.',
      logo_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300'
    },
    {
      id: BRAND_2,
      organization_id: ORG_ID,
      company_name: 'Longevita Saúde Funcional & Longevidade Ltda',
      brand_name: 'Longevita 50+',
      cnpj: '48.192.837/0001-55',
      description: 'Saúde integrativa, colágeno hidrolisado, polivitamínicos e suporte para menopausa e vitalidade após os 50 anos.',
      logo_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300'
    },
    {
      id: BRAND_3,
      organization_id: ORG_ID,
      company_name: 'BioEquilíbrio Alimentos Saudáveis S/A',
      brand_name: 'BioEquilíbrio',
      cnpj: '19.482.716/0001-32',
      description: 'Alimentação limpa, snacks proteicos, pastas funcionais e blends saudáveis para rotina fitness.',
      logo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
    }
  ];

  for (const b of cleanBrands) {
    const { error } = await supabase
      .from('brands')
      .upsert(b);
    if (error) console.error('Erro ao atualizar marca:', b.brand_name, error.message);
    else console.log('Marca atualizada:', b.brand_name);
  }

  // 2. Atualizar Campanhas
  const cleanCampaigns = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      brand_id: BRAND_1,
      title: 'Desafio 30 Dias: Creatina Creapure & Força Máxima',
      slug: 'desafio-creatina-creapure-squadra',
      description: 'Campanha de lançamento da Creatina 100% Creapure com absorção acelerada. Envio de kit completo para criação de vídeos de rotina de treino, preparo matinal e resenha autêntica.',
      objective: 'Gerar 50+ vídeos de UGC no TikTok e Reels e tracionar vendas com cupom exclusivo de 15% OFF.',
      campaign_type: 'ugc',
      cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
      requirements_text: 'Mínimo 5.000 seguidores no TikTok ou Instagram. Foco em academia, bem-estar, saúde ou nutrição.',
      deliverables_text: '1x TikTok ou Reel demonstrando o consumo na rotina diária + 3x Stories com link rastreado e cupom.'
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      brand_id: BRAND_2,
      title: 'Longevidade Ativa & Bem-Estar 50+: Saúde Integrativa',
      slug: 'longevidade-ativa-bem-estar-50',
      description: 'Apresentação do complexo de saúde integrativa para o público 50+: colágeno bioativo tipo II, magnésio quelato e vitaminas essenciais.',
      objective: 'Autoridade médica e depoimentos autênticos sobre disposição, articulações e qualidade de vida.',
      campaign_type: 'paid_content',
      cover_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
      requirements_text: 'Creators e profissionais da área da saúde ou perfil 50+ com mais de 10.000 seguidores.',
      deliverables_text: '1x Vídeo explicativo de rotina matinal + 1 Carrossel educativo sobre micronutrientes.'
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      brand_id: BRAND_3,
      title: 'Rotina Saudável: Alimentação Limpa & Snacks Proteicos',
      slug: 'rotina-saudavel-alimentacao-limpa',
      description: 'Seeding exclusivo de snacks saudáveis, pastas proteicas sem açúcar e blends nutricionais para lanche funcional.',
      objective: 'Posicionamento em receitas práticas e refeições funcionais no dia a dia.',
      campaign_type: 'product_seeding',
      cover_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      requirements_text: 'Perfil focado em alimentação saudável, marmitas fit, nutrição ou rotina ativa.',
      deliverables_text: '2x Vídeos de receitas práticas no TikTok/Reels mencionando a marca.'
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      brand_id: BRAND_1,
      title: 'Maratona & Triatlo: Hidratação e Recuperação Celular',
      slug: 'maratona-triatlo-hidratacao-performance',
      description: 'Campanha de eletrólitos em sachê e recuperação intra/pós treino para corredores de rua e atletas amadores.',
      objective: 'Fortalecer a marca no nicho de corrida e endurance com avaliações reais de performance.',
      campaign_type: 'ugc',
      cover_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
      requirements_text: 'Corredores, maratonistas e praticantes de crossfit/triatlo ativos nas redes.',
      deliverables_text: '1x Vídeo durante o longão de fim de semana + 1x Review de sabor e absorção.'
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      brand_id: BRAND_1,
      title: 'Live Commerce Especial: Lançamentos & Cupons VIP',
      slug: 'live-commerce-squadra-vip',
      description: 'Transmissão ao vivo com promoções exclusivas, kits de suplementação e comissionamento agressivo de até 20%.',
      objective: 'GMV direto e conversão em tempo real no TikTok Shop e live do Instagram.',
      campaign_type: 'live_commerce',
      cover_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      requirements_text: 'Creators experientes em vendas por live com engajamento acima de 4%.',
      deliverables_text: '2x Lives de 45 minutos demonstrando os produtos com cupom ativo.'
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      brand_id: BRAND_2,
      title: 'Seeding Exclusivo: Top 50 Creators Saúde & Fitness Brasil',
      slug: 'seeding-top-50-creators-saude-brasil',
      description: 'Envio de kits premium personalizados com a linha completa para os 50 creators mais relevantes da base.',
      objective: 'Gerar buzz no mercado nacional e ativação em massa nos stories.',
      campaign_type: 'product_seeding',
      cover_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
      requirements_text: 'Creators prioritários da Faixa A com mais de 50.000 seguidores.',
      deliverables_text: 'Unboxing em destaque e inclusão na rotina.'
    }
  ];

  for (const c of cleanCampaigns) {
    const { error } = await supabase
      .from('campaigns')
      .update(c)
      .eq('id', c.id);
    if (error) console.error('Erro ao atualizar campanha:', c.title, error.message);
    else console.log('Campanha atualizada:', c.title);
  }

  console.log('--- LIMPEZA DO BANCO SUPABASE CONCLUÍDA COM SUCESSO ---');
}

run().catch(console.error);
