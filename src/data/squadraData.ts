import {
  CreatorProfile,
  BrandProfile,
  RetailPoint,
  Campaign,
  CampaignParticipant,
  Shipment,
  ContentSubmission,
  AffiliateLink,
  SourceCounts,
  ScoreWeights
} from '../types/database';
import rawLeads from './realLeads.json';

// 1. Contadores Consolidados por Fonte (exatamente como solicitado)
export const SQUADRA_SOURCE_COUNTS: SourceCounts = {
  manicures: 17000,
  tiktok: 799,
  instagram: 560,
  retail_points: 8059,
  unique_creators: 18359
};

// 2. Pesos padrão para o cálculo da Pontuação Operacional
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  engagement: 30,
  audience: 20,
  nicheMatch: 25,
  deliveryHistory: 15,
  quality: 10
};

// 3. Marcas Oficiais da Plataforma (Multiempresa)
export const SQUADRA_BRANDS: BrandProfile[] = [
  {
    id: 'brand-1',
    user_id: 'user-b1',
    company_name: 'Squadra Sports Nutrition & Wellness Ltda',
    brand_name: 'Squadra Nutrition',
    cnpj: '34.891.204/0001-88',
    description: 'Suplementação esportiva de alta pureza, creatina micronizada, whey isolado e pré-treinos avançados.',
    logo_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300',
    website: 'https://squadranutrition.com.br',
    contact_name: 'Equipe de Marketing',
    contact_email: 'contato@squadranutrition.com.br',
    contact_phone: '(11) 98888-7711',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'brand-2',
    user_id: 'user-b2',
    company_name: 'Longevita Saúde Funcional & Longevidade Ltda',
    brand_name: 'Longevita 50+',
    cnpj: '48.192.837/0001-55',
    description: 'Saúde integrativa, colágeno hidrolisado, polivitamínicos e suporte para menopausa e vitalidade após os 50 anos.',
    logo_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300',
    website: 'https://longevita.com.br',
    contact_name: 'Dr. Roberto Longevita',
    contact_email: 'contato@longevita.com.br',
    contact_phone: '(41) 99111-2233',
    city: 'Curitiba',
    state: 'PR',
    status: 'active',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'brand-3',
    user_id: 'user-b3',
    company_name: 'BioEquilíbrio Alimentos Saudáveis S/A',
    brand_name: 'BioEquilíbrio',
    cnpj: '19.482.716/0001-32',
    description: 'Alimentação limpa, snacks proteicos, pastas funcionais e blends saudáveis para rotina fitness.',
    logo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300',
    website: 'https://bioequilibrio.com.br',
    contact_name: 'Mariana Nutri',
    contact_email: 'parcerias@bioequilibrio.com.br',
    contact_phone: '(31) 99777-6655',
    city: 'Belo Horizonte',
    state: 'MG',
    status: 'active',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z'
  }
];

// 3. Carregar os 808 Creators Reais da base do cliente
// Só dados reais coletados (scripts/clean-creators.mjs). Campo sem dado fica vazio — nada é inventado.
export const SQUADRA_CREATORS: CreatorProfile[] = (rawLeads as any[]).map((lead, idx) => ({
  id: `creator-${idx + 1}`,
  user_id: '',
  professional_name: lead.professional_name || lead.tiktok || '',
  bio: lead.bio || '',
  city: lead.city || '',
  state: lead.state || '',
  instagram: lead.instagram || '',
  tiktok: lead.tiktok || '',
  youtube: lead.youtube || '',
  instagram_followers: Number(lead.instagram_followers || 0),
  tiktok_followers: Number(lead.tiktok_followers || 0),
  youtube_followers: Number(lead.youtube_followers || 0),
  years_experience: 0,
  specialties: lead.specialties || [],
  techniques: lead.techniques || [],
  accepts_product_campaigns: true,
  accepts_paid_campaigns: true,
  accepts_affiliate_campaigns: true,
  accepts_live_campaigns: !!lead.vende_por_live,
  portfolio_cover_url: '',
  profile_completion: 0,
  verification_status: lead.verification_status === 'verified' ? 'verified' : 'unverified',
  operational_score: Number(lead.operational_score || 0),
  engagement_rate: Number(lead.engagement_rate || 0),
  tags: lead.tags || [],
  email: lead.email || '',
  phone: lead.phone || '',
  media_kit_url: lead.media_kit_url || '',
  is_featured: idx < 10,
  created_at: lead.ultimo_post || new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

// 4. Carregar 200 PDVs (Pontos de Venda)
const NETWORKS = [
  { name: 'Ikesaki Cosméticos', type: 'cosmetics' as const },
  { name: 'Danny Cosméticos', type: 'cosmetics' as const },
  { name: 'Perfumaria Sumirê', type: 'perfumery' as const },
  { name: 'Perfumaria Teruya', type: 'perfumery' as const },
  { name: 'Lojas REDE', type: 'cosmetics' as const },
  { name: 'Soneda Perfumaria', type: 'perfumery' as const },
  { name: 'Droga Raia', type: 'pharmacy' as const },
  { name: 'Drogasil', type: 'pharmacy' as const },
  { name: 'Pague Menos', type: 'pharmacy' as const },
  { name: 'Sephora Brasil', type: 'perfumery' as const },
  { name: 'Studio Nails Beauty Salão', type: 'salon' as const },
  { name: 'Distribuidora ProNail Express', type: 'distributor' as const }
];

const CITIES = [
  { state: 'SP', city: 'São Paulo' },
  { state: 'SP', city: 'Campinas' },
  { state: 'SP', city: 'Santos' },
  { state: 'RJ', city: 'Rio de Janeiro' },
  { state: 'RJ', city: 'Niterói' },
  { state: 'MG', city: 'Belo Horizonte' },
  { state: 'MG', city: 'Uberlândia' },
  { state: 'PR', city: 'Curitiba' },
  { state: 'PR', city: 'Londrina' },
  { state: 'RS', city: 'Porto Alegre' },
  { state: 'BA', city: 'Salvador' },
  { state: 'SC', city: 'Florianópolis' },
  { state: 'GO', city: 'Goiânia' },
  { state: 'PE', city: 'Recife' }
];

export const SQUADRA_RETAIL_POINTS: RetailPoint[] = Array.from({ length: 200 }).map((_, i) => {
  const net = NETWORKS[i % NETWORKS.length];
  const loc = CITIES[i % CITIES.length];

  return {
    id: `retail-${i + 1}`,
    name: `${net.name} - Filial ${loc.city}`,
    trade_name: net.name,
    network: net.name,
    // ponytail: sem CNPJ/endereço/contato inventados — base real de PDVs entra por importação CSV
    cnpj: '',
    type: net.type,
    city: loc.city,
    state: loc.state,
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    status: i % 15 === 0 ? 'lead' : 'active',
    created_at: new Date(Date.now() - i * 120000000).toISOString()
  };
});

// 6. As 6 Campanhas Oficiais Alinhadas ao Nicho Real do Cliente
export const SQUADRA_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    brand_id: 'brand-1',
    title: 'Desafio 30 Dias: Creatina Creapure & Força Máxima',
    slug: 'desafio-creatina-creapure-squadra',
    description: 'Campanha de lançamento da Creatina 100% Creapure com absorção acelerada. Envio de kit completo para criação de vídeos de rotina de treino, preparo matinal e resenha autêntica.',
    objective: 'Gerar 50+ vídeos de UGC no TikTok e Reels e tracionar vendas com cupom exclusivo de 15% OFF.',
    campaign_type: 'ugc',
    cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
    start_date: '2026-10-01',
    end_date: '2026-11-15',
    application_deadline: '2026-10-15',
    creator_slots: 30,
    occupied_slots: 24,
    budget: 45000,
    commission_type: 'fixed',
    commission_value: 350,
    requirements_text: 'Mínimo 5.000 seguidores no TikTok ou Instagram. Foco em academia, bem-estar, saúde ou nutrição.',
    deliverables_text: '1x TikTok ou Reel demonstrando o consumo na rotina diária + 3x Stories com link rastreado e cupom.',
    status: 'open',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'camp-2',
    brand_id: 'brand-2',
    title: 'Longevidade Ativa & Bem-Estar 50+: Saúde Integrativa',
    slug: 'longevidade-ativa-bem-estar-50',
    description: 'Apresentação do complexo de saúde integrativa para o público 50+: colágeno bioativo tipo II, magnésio quelato e vitaminas essenciais.',
    objective: 'Autoridade médica e depoimentos autênticos sobre disposição, articulações e qualidade de vida.',
    campaign_type: 'paid_content',
    cover_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
    start_date: '2026-10-05',
    end_date: '2026-11-20',
    application_deadline: '2026-10-18',
    creator_slots: 20,
    occupied_slots: 15,
    budget: 35000,
    commission_type: 'fixed',
    commission_value: 600,
    requirements_text: 'Creators e profissionais da área da saúde ou perfil 50+ com mais de 10.000 seguidores.',
    deliverables_text: '1x Vídeo explicativo de rotina matinal + 1 Carrossel educativo sobre micronutrientes.',
    status: 'open',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'camp-3',
    brand_id: 'brand-3',
    title: 'Rotina Saudável: Alimentação Limpa & Snacks Proteicos',
    slug: 'rotina-saudavel-alimentacao-limpa',
    description: 'Seeding exclusivo de snacks saudáveis, pastas proteicas sem açúcar e blends nutricionais para lanche funcional.',
    objective: 'Posicionamento em receitas práticas e refeições funcionais no dia a dia.',
    campaign_type: 'product_seeding',
    cover_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    start_date: '2026-09-15',
    end_date: '2026-10-30',
    application_deadline: '2026-10-10',
    creator_slots: 25,
    occupied_slots: 25,
    budget: 28000,
    commission_type: 'product_only',
    commission_value: 0,
    requirements_text: 'Perfil focado em alimentação saudável, marmitas fit, nutrição ou rotina ativa.',
    deliverables_text: '2x Vídeos de receitas práticas no TikTok/Reels mencionando a marca.',
    status: 'in_progress',
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z'
  },
  {
    id: 'camp-4',
    brand_id: 'brand-1',
    title: 'Maratona & Triatlo: Hidratação e Recuperação Celular',
    slug: 'maratona-triatlo-hidratacao-performance',
    description: 'Campanha de eletrólitos em sachê e recuperação intra/pós treino para corredores de rua e atletas amadores.',
    objective: 'Fortalecer a marca no nicho de corrida e endurance com avaliações reais de performance.',
    campaign_type: 'ugc',
    cover_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
    start_date: '2026-10-10',
    end_date: '2026-11-30',
    application_deadline: '2026-10-22',
    creator_slots: 35,
    occupied_slots: 19,
    budget: 42000,
    commission_type: 'fixed',
    commission_value: 400,
    requirements_text: 'Corredores, maratonistas e praticantes de crossfit/triatlo ativos nas redes.',
    deliverables_text: '1x Vídeo durante o longão de fim de semana + 1x Review de sabor e absorção.',
    status: 'open',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'camp-5',
    brand_id: 'brand-1',
    title: 'Live Commerce Especial: Lançamentos & Cupons VIP',
    slug: 'live-commerce-squadra-vip',
    description: 'Transmissão ao vivo com promoções exclusivas, kits de suplementação e comissionamento agressivo de até 20%.',
    objective: 'GMV direto e conversão em tempo real no TikTok Shop e live do Instagram.',
    campaign_type: 'live_commerce',
    cover_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    start_date: '2026-11-01',
    end_date: '2026-11-28',
    application_deadline: '2026-10-25',
    creator_slots: 20,
    occupied_slots: 8,
    budget: 25000,
    commission_type: 'percentage',
    commission_value: 20,
    requirements_text: 'Creators experientes em vendas por live com engajamento acima de 4%.',
    deliverables_text: '2x Lives de 45 minutos demonstrando os produtos com cupom ativo.',
    status: 'draft',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'camp-6',
    brand_id: 'brand-2',
    title: 'Seeding Exclusivo: Top 50 Creators Saúde & Fitness Brasil',
    slug: 'seeding-top-50-creators-saude-brasil',
    description: 'Envio de kits premium personalizados com a linha completa para os 50 creators mais relevantes da base.',
    objective: 'Gerar buzz no mercado nacional e ativação em massa nos stories.',
    campaign_type: 'product_seeding',
    cover_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    start_date: '2026-08-10',
    end_date: '2026-09-30',
    application_deadline: '2026-08-25',
    creator_slots: 50,
    occupied_slots: 50,
    budget: 65000,
    commission_type: 'product_only',
    commission_value: 0,
    requirements_text: 'Creators prioritários da Faixa A com mais de 50.000 seguidores.',
    deliverables_text: 'Unboxing em destaque e inclusão na rotina.',
    status: 'completed',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z'
  }
];

// 6. As 14 Etapas do Pipeline do Squad
export const PIPELINE_STAGES = [
  { id: 'discovery', label: '1. Descoberta', color: 'bg-slate-500' },
  { id: 'invited', label: '2. Convidado', color: 'bg-blue-500' },
  { id: 'applied', label: '3. Inscrição', color: 'bg-sky-500' },
  { id: 'screening', label: '4. Triagem', color: 'bg-amber-500' },
  { id: 'squad_approved', label: '5. Aprovado no Squad', color: 'bg-emerald-500' },
  { id: 'briefing_sent', label: '6. Briefing Enviado', color: 'bg-indigo-500' },
  { id: 'shipping', label: '7. Envio do Produto', color: 'bg-orange-500' },
  { id: 'delivered', label: '8. Produto Entregue', color: 'bg-teal-500' },
  { id: 'producing', label: '9. Em Produção', color: 'bg-violet-500' },
  { id: 'submitted', label: '10. Conteúdo Submetido', color: 'bg-yellow-500' },
  { id: 'reviewing', label: '11. Em Revisão', color: 'bg-rose-500' },
  { id: 'approved', label: '12. Conteúdo Aprovado', color: 'bg-green-600' },
  { id: 'published', label: '13. Publicado & Live', color: 'bg-pink-600' },
  { id: 'completed', label: '14. Concluído & Pago', color: 'bg-emerald-600' }
] as const;

// 7. Squad Members com distribuição nas 14 etapas
export const SQUADRA_PARTICIPANTS: CampaignParticipant[] = SQUADRA_CREATORS.slice(0, 30).map((c, idx) => {
  const stageObj = PIPELINE_STAGES[idx % PIPELINE_STAGES.length];
  return {
    id: `part-${idx + 1}`,
    campaign_id: 'camp-1',
    creator_id: c.id,
    creator: c,
    status: stageObj.id === 'completed' ? 'completed' : stageObj.id === 'approved' ? 'approved' : 'selected',
    stage: stageObj.id as any,
    operational_score: c.operational_score ?? 0,
    notes: `Creator qualificada em ${new Date().toLocaleDateString('pt-BR')}. Taxa de engajamento de ${c.engagement_rate}%.`,
    tracking_code: `BR${98234100 + idx}SP`,
    product_sent_at: ['shipping', 'delivered', 'producing', 'submitted', 'reviewing', 'approved', 'published', 'completed'].includes(stageObj.id)
      ? '2026-10-02T10:00:00Z'
      : undefined,
    created_at: new Date(Date.now() - idx * 43200000).toISOString(),
    updated_at: new Date().toISOString()
  };
});

// 8. Envios / Shipments
export const SQUADRA_SHIPMENTS: Shipment[] = SQUADRA_PARTICIPANTS.filter(p =>
  ['shipping', 'delivered', 'producing', 'submitted', 'reviewing', 'approved', 'published', 'completed'].includes(p.stage || '')
).map((p, idx) => ({
  id: `ship-${idx + 1}`,
  campaign_id: p.campaign_id,
  creator_id: p.creator_id,
  creator_name: p.creator?.professional_name || 'Creator',
  creator_avatar: p.creator?.portfolio_cover_url,
  tracking_code: p.tracking_code || `BR${98234100 + idx}SP`,
  carrier: idx % 2 === 0 ? 'Correios' : 'Melhor Envio',
  status: p.stage === 'shipping' ? 'in_transit' : 'delivered',
  address_street: `Rua das Flores, ${200 + idx}`,
  address_city: p.creator?.city || 'São Paulo',
  address_state: p.creator?.state || 'SP',
  address_zip: `0131${idx}-000`,
  shipped_at: '2026-10-02T10:00:00Z',
  delivered_at: p.stage !== 'shipping' ? '2026-10-04T15:30:00Z' : undefined,
  notes: 'Kit Gel Diamante + Pincel Esculpido + Base Blindada'
}));

// 9. Conteúdos UGC e Reviews de Aprovação
export const SQUADRA_SUBMISSIONS: ContentSubmission[] = SQUADRA_PARTICIPANTS.filter(p =>
  ['submitted', 'reviewing', 'approved', 'published', 'completed'].includes(p.stage || '')
).map((p, idx) => ({
  id: `sub-${idx + 1}`,
  campaign_id: p.campaign_id,
  creator_id: p.creator_id,
  creator: p.creator,
  content_type: idx % 2 === 0 ? 'instagram_reel' : 'tiktok',
  media_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
  published_url: `https://tiktok.com/@${(p.creator?.tiktok || '').replace('@','')}/video/728938192301`,
  caption: 'Passo a passo completo com o Gel Diamante da @glamgelbrasil! O que acharam desse acabamento espelhado? 💎✨ #UGC #UnhasDeGel',
  status: p.stage === 'submitted' ? 'submitted' : p.stage === 'reviewing' ? 'submitted' : 'approved',
  submitted_at: '2026-10-02T12:00:00Z',
  approved_at: ['approved', 'published', 'completed'].includes(p.stage || '') ? '2026-10-02T14:30:00Z' : undefined,
  metrics: {
    id: `met-${idx + 1}`,
    submission_id: `sub-${idx + 1}`,
    views: 45000 + idx * 8200,
    likes: 3800 + idx * 450,
    comments: 240 + idx * 30,
    shares: 410 + idx * 45,
    saves: 890 + idx * 95,
    clicks: 1200 + idx * 110,
    sales: 42 + idx * 6,
    revenue: (42 + idx * 6) * 189.90,
    updated_at: new Date().toISOString()
  },
  reviews: [
    {
      id: `rev-${idx}-1`,
      content_id: `sub-${idx + 1}`,
      author_name: 'Camila Brand Manager',
      author_role: 'brand_admin',
      comment: 'A iluminação ficou fantástica! Aprovadíssimo para veicular em tráfego pago.',
      created_at: '2026-10-02T14:00:00Z'
    }
  ]
}));

// 10. Links e Códigos de Afiliados
export const SQUADRA_AFFILIATES: AffiliateLink[] = SQUADRA_PARTICIPANTS.filter(p =>
  ['approved', 'published', 'completed'].includes(p.stage || '')
).map((p, idx) => {
  const handle = (p.creator?.tiktok || `CREATOR${idx}`).replace('@', '').toUpperCase();
  const sales = 15 + idx * 8;
  const gmv = sales * 189.90;
  return {
    id: `aff-${idx + 1}`,
    campaign_id: p.campaign_id,
    creator_id: p.creator_id,
    creator: p.creator,
    product_id: 'prod-1',
    code: `${handle}15`,
    url: `https://loja.glamgel.com.br/?cupom=${handle}15`,
    commission_percentage: 12.0,
    clicks: 250 + idx * 65,
    orders: sales,
    revenue: gmv,
    commission_generated: gmv * 0.12,
    created_at: new Date(Date.now() - idx * 86400000).toISOString()
  };
});
