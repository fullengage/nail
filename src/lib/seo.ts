import { getViewPath } from './routes';
import { FAQ_PLANOS } from '../pages/site/PlanosPage';
import { FAQ_FERRAMENTAS } from '../pages/site/FerramentasPage';

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  robots?: string;
  ogType?: 'website' | 'article';
  schema?: Record<string, unknown>;
}

const BASE_URL = 'https://www.squadugc.com.br';
const SITE_NAME = 'Squad UGC';

export const SEO_METADATA: Record<string, PageSEO> = {
  landing: {
    title: 'Squad UGC — Squads de Creators e Live Commerce para Marcas',
    description: 'Monte o squad de creators da sua marca e produza UGC em escala com seeding, aprovação, logística e métricas em um só painel.',
    keywords: 'squad ugc, creators brasil, conteúdo ugc, live commerce, seeding de produtos, creators para marcas, influenciadores de conversão',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/painel/campanhas?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  },
  sobre: {
    title: 'Sobre Nós — Squad UGC | Da Influência à Conversão Real',
    description: 'Nascemos para profissionalizar o UGC e o live commerce: conectar marcas a creators reais que testam, mostram e vendem produtos ao vivo.',
    keywords: 'sobre squad ugc, quem somos squad ugc, plataforma ugc, creator economy brasil, live shop creators',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${BASE_URL}/sobre`,
      logo: `${BASE_URL}/favicon.svg`,
      description: 'Plataforma que conecta marcas e empresas aos melhores squads de creators de UGC e Live Commerce do Brasil.',
    },
  },
  'para-creators': {
    title: 'Para Creators & UGCs — Monetize com Vídeos e Venda ao Vivo | Squad UGC',
    description: 'Receba produtos em casa, participe de campanhas com cachê garantido via PIX e venda produtos com comissões de até 30% em live commerce.',
    keywords: 'ugc creator, como ser ugc, ganhar dinheiro com tiktok, unboxing patrocinado, comissão live commerce, vagas para creators',
    ogType: 'website',
  },
  'para-marcas': {
    title: 'Para Marcas & Empresas — UGC em Escala e Squads Fixos | Squad UGC',
    description: 'Contrate creators selecionados e aprovados para a sua marca. Pipeline completo de aprovação, envios rastreados e métricas de conversão.',
    keywords: 'ugc para marcas, contratar influenciadores, banco de creators, gestão de criativos, campanhas ugc, live shopping empresa',
    ogType: 'website',
  },
  contato: {
    title: 'Fale Conosco — Fale com Especialistas em UGC | Squad UGC',
    description: 'Entre em contato com o time da Squad UGC para tirar dúvidas, agendar uma demonstração corporativa ou obter suporte.',
    keywords: 'contato squad ugc, suporte creators, atendimento marcas ugc',
    ogType: 'website',
  },
  planos: {
    title: 'Planos e preços: missão pontual ou squad mensal | Squad UGC',
    description: 'Defina quantos creators quer e quanto pagar por vídeo ou live. O cachê só é liberado depois que você aprova o conteúdo. Simule o preço.',
    keywords: 'preço ugc, quanto custa creator ugc, live commerce preço, squad de creators mensal, contratar creators',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_PLANOS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  },
  ferramentas: {
    title: 'Calculadora de engajamento grátis: Instagram e TikTok | Squad UGC',
    description: 'Calcule a taxa de engajamento de qualquer perfil do Instagram ou TikTok e veja se a audiência é real, comparada com creators brasileiros.',
    keywords: 'calculadora de engajamento, taxa de engajamento instagram, engajamento tiktok, seguidores falsos, audiencia real influenciador',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_FERRAMENTAS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  },
  squad: {
    title: 'O Que É um Squad de Creators? Pare de Contratar Avulso | Squad UGC',
    description: 'Descubra como um time fixo de creators aprovados transforma UGC em rotina: mais criativos testados, menor custo por aquisição e escala rápida.',
    keywords: 'o que e squad ugc, artigos creators, guia de criativos ads, estratégia de ugc, live commerce brasil',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Pare de contratar creators. Monte um squad.',
      description: 'Como um time fixo de creators aprovados pela sua marca transforma UGC em rotina com mais vídeos e menos retrabalho.',
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
      },
    },
  },
  termos: {
    title: 'Termos de Uso e Condições Gerais | Squad UGC',
    description: 'Termos e condições de uso da plataforma Squad UGC para creators, marcas parceiras e contratantes.',
    robots: 'index, follow',
    ogType: 'website',
  },
  privacidade: {
    title: 'Política de Privacidade & LGPD | Squad UGC',
    description: 'Conheça nossa política de privacidade, tratamento seguro de dados e conformidade total com a Lei Geral de Proteção de Dados (LGPD).',
    robots: 'index, follow',
    ogType: 'website',
  },
  auth: {
    title: 'Acessar Plataforma — Login de Creators e Marcas | Squad UGC',
    description: 'Faça login na plataforma Squad UGC para gerenciar campanhas, aprovar criativos ou acompanhar seus ganhos como creator.',
    robots: 'noindex, follow',
    ogType: 'website',
  },
  'public-apply': {
    title: 'Candidatura de Campanha — Envie Sua Inscrição | Squad UGC',
    description: 'Candidate-se às campanhas abertas de marcas líderes e faça parte dos squads oficiais de creators.',
    robots: 'noindex, follow',
    ogType: 'website',
  },
  'reset-password': {
    title: 'Recuperar Senha | Squad UGC',
    description: 'Defina uma nova senha de acesso para sua conta na plataforma Squad UGC.',
    robots: 'noindex, nofollow',
    ogType: 'website',
  },
  manual: {
    title: 'Manual do Cliente — Documentação e Guia | Squad UGC',
    description: 'Manual completo e guia operacional para uso da plataforma Squad UGC.',
    robots: 'noindex, nofollow',
    ogType: 'website',
  },
};

/**
 * Aplica os metadados de SEO ao documento de forma reativa no SPA
 */
export function applySEO(view: string): void {
  if (typeof document === 'undefined') return;

  const seo = SEO_METADATA[view] || {
    title: 'Squad UGC — Squads de creators para marcas',
    description: 'Squad UGC: monte o squad de creators da sua marca e produza UGC em escala com seeding, aprovação e métricas em um só painel.',
    robots: view.startsWith('admin-') || view.startsWith('creator-') || view.startsWith('brand-') || view === 'dashboard'
      ? 'noindex, nofollow'
      : 'index, follow',
    ogType: 'website',
  };

  // 1. Título do Documento
  document.title = seo.title;

  // 2. Meta Helper
  const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Description
  setMetaTag('meta[name="description"]', 'name', 'description', seo.description);

  // Keywords (se houver)
  if (seo.keywords) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', seo.keywords);
  }

  // Robots
  const robots = seo.robots || 'index, follow';
  setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

  // Canonical URL
  const canonicalPath = getViewPath(view);
  const canonicalUrl = `${BASE_URL}${canonicalPath === '/' ? '' : canonicalPath}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', seo.ogType || 'website');
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);

  // Twitter Card
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);

  // Structured Data (JSON-LD)
  const existingScript = document.getElementById('seo-jsonld');
  if (existingScript) {
    existingScript.remove();
  }

  if (seo.schema) {
    const script = document.createElement('script');
    script.id = 'seo-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seo.schema);
    document.head.appendChild(script);
  }
}
