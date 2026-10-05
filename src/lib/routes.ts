/**
 * Definição centralizada de rotas e URLs amigáveis para SEO e navegação SPA.
 * Mapeia visualizações (views) internas para caminhos limpos (pathnames).
 */

export const PUBLIC_ROUTES = [
  'landing',
  'sobre',
  'para-creators',
  'para-marcas',
  'contato',
  'squad',
  'planos',
  'ferramentas',
  'termos',
  'privacidade',
  'auth',
  'manual',
  'public-apply',
  'reset-password',
] as const;

export type PublicView = typeof PUBLIC_ROUTES[number];

/**
 * Mapeamento canônico: view interna -> URL amigável
 */
export const VIEW_TO_PATH: Record<string, string> = {
  // Institucional / Público (SEO Prioritário)
  landing: '/',
  sobre: '/sobre',
  'para-creators': '/para-creators',
  'para-marcas': '/para-marcas',
  contato: '/contato',
  squad: '/squad',
  planos: '/planos',
  ferramentas: '/ferramentas/calculadora-de-engajamento',
  termos: '/termos',
  privacidade: '/privacidade',
  auth: '/entrar',
  manual: '/manual',
  'public-apply': '/candidatura',
  'reset-password': '/recuperar-senha',

  // Painéis Gerais (Squadra Core)
  dashboard: '/painel',
  creators: '/painel/creators',
  retail: '/painel/retail',
  campaigns: '/painel/campanhas',
  affiliates: '/painel/afiliados',
  reports: '/painel/relatorios',
  brands: '/painel/marcas',
  settings: '/painel/configuracoes',

  // Creator Dedicated Views
  'creator-dashboard': '/creator/painel',
  'creator-campaigns': '/creator/oportunidades',
  'creator-my-campaigns': '/creator/minhas-campanhas',
  'creator-portfolio': '/creator/portfolio',
  'creator-earnings': '/creator/ganhos',
  'creator-academy': '/creator/academy',
  'creator-profile': '/creator/perfil',

  // Brand Dedicated Views
  'brand-dashboard': '/marca/painel',
  'brand-campaigns': '/marca/campanhas',
  'brand-create-campaign': '/marca/campanhas/nova',
  'brand-creators': '/marca/creators',
  'brand-applications': '/marca/candidaturas',
  'brand-content': '/marca/conteudos',
  'brand-products': '/marca/produtos',

  // Admin Views
  'admin-dashboard': '/admin/painel',
  'admin-moderation-creators': '/admin/moderacao/creators',
  'admin-moderation-brands': '/admin/moderacao/marcas',
  'admin-moderation-campaigns': '/admin/moderacao/campanhas',
  'admin-finance': '/admin/financeiro',
  'admin-academy': '/admin/academy',
};

/**
 * Mapeamento reverso: URL amigável (e apelidos/sinônimos) -> view interna
 */
export const PATH_TO_VIEW: Record<string, string> = {
  '/': 'landing',
  '': 'landing',
  '/sobre': 'sobre',
  '/sobre-nos': 'sobre',
  '/para-creators': 'para-creators',
  '/creators-info': 'para-creators',
  '/para-marcas': 'para-marcas',
  '/marcas-info': 'para-marcas',
  '/contato': 'contato',
  '/fale-conosco': 'contato',
  '/squad': 'squad',
  '/planos': 'planos',
  '/ferramentas': 'ferramentas',
  '/ferramentas/calculadora-de-engajamento': 'ferramentas',
  '/calculadora-de-engajamento': 'ferramentas',
  '/artigo-squad': 'squad',
  '/academy': 'squad',
  '/termos': 'termos',
  '/terms': 'termos',
  '/termos-de-uso': 'termos',
  '/privacidade': 'privacidade',
  '/privacy': 'privacidade',
  '/politica-de-privacidade': 'privacidade',
  '/entrar': 'auth',
  '/login': 'auth',
  '/auth': 'auth',
  '/manual': 'manual',
  '/candidatura': 'public-apply',
  '/aplicar': 'public-apply',
  '/apply': 'public-apply',
  '/public-apply': 'public-apply',
  '/recuperar-senha': 'reset-password',
  '/reset-password': 'reset-password',

  // Painel & Atalhos
  '/painel': 'dashboard',
  '/dashboard': 'dashboard',
  '/creators': 'creators',
  '/painel/creators': 'creators',
  '/retail': 'retail',
  '/painel/retail': 'retail',
  '/campanhas': 'campaigns',
  '/campaigns': 'campaigns',
  '/painel/campanhas': 'campaigns',
  '/afiliados': 'affiliates',
  '/affiliates': 'affiliates',
  '/painel/afiliados': 'affiliates',
  '/relatorios': 'reports',
  '/reports': 'reports',
  '/painel/relatorios': 'reports',
  '/marcas': 'brands',
  '/brands': 'brands',
  '/painel/marcas': 'brands',
  '/configuracoes': 'settings',
  '/settings': 'settings',
  '/painel/configuracoes': 'settings',

  // Creator
  '/creator': 'creator-dashboard',
  '/creator/painel': 'creator-dashboard',
  '/creator-dashboard': 'creator-dashboard',
  '/creator/oportunidades': 'creator-campaigns',
  '/creator/campanhas': 'creator-campaigns',
  '/creator-campaigns': 'creator-campaigns',
  '/creator/minhas-campanhas': 'creator-my-campaigns',
  '/creator-my-campaigns': 'creator-my-campaigns',
  '/creator/portfolio': 'creator-portfolio',
  '/creator-portfolio': 'creator-portfolio',
  '/creator/ganhos': 'creator-earnings',
  '/creator/financeiro': 'creator-earnings',
  '/creator-earnings': 'creator-earnings',
  '/creator/academy': 'creator-academy',
  '/creator-academy': 'creator-academy',
  '/creator/perfil': 'creator-profile',
  '/creator-profile': 'creator-profile',

  // Brand
  '/marca': 'brand-dashboard',
  '/marca/painel': 'brand-dashboard',
  '/brand-dashboard': 'brand-dashboard',
  '/marca/campanhas': 'brand-campaigns',
  '/brand-campaigns': 'brand-campaigns',
  '/marca/campanhas/nova': 'brand-create-campaign',
  '/brand-create-campaign': 'brand-create-campaign',
  '/marca/creators': 'brand-creators',
  '/brand-creators': 'brand-creators',
  '/marca/candidaturas': 'brand-applications',
  '/brand-applications': 'brand-applications',
  '/marca/conteudos': 'brand-content',
  '/brand-content': 'brand-content',
  '/marca/produtos': 'brand-products',
  '/brand-products': 'brand-products',

  // Admin
  '/admin': 'admin-dashboard',
  '/admin/painel': 'admin-dashboard',
  '/admin-dashboard': 'admin-dashboard',
  '/admin/moderacao': 'admin-moderation-creators',
  '/admin/moderacao/creators': 'admin-moderation-creators',
  '/admin-moderation-creators': 'admin-moderation-creators',
  '/admin/moderacao/marcas': 'admin-moderation-brands',
  '/admin-moderation-brands': 'admin-moderation-brands',
  '/admin/moderacao/campanhas': 'admin-moderation-campaigns',
  '/admin-moderation-campaigns': 'admin-moderation-campaigns',
  '/admin/financeiro': 'admin-finance',
  '/admin-finance': 'admin-finance',
  '/admin/academy': 'admin-academy',
  '/admin-academy': 'admin-academy',
};

/**
 * Retorna o caminho amigável a partir do nome da view
 */
export function getViewPath(view: string): string {
  return VIEW_TO_PATH[view] || `/${view}`;
}

/**
 * Resolve a view correspondente examinando pathname, query params e hash.
 * Suporta retrocompatibilidade total com ?view=xxx e #manual.
 */
export function parseUrlToView(
  pathname: string = window.location.pathname,
  search: string = window.location.search,
  hash: string = window.location.hash
): { view: string; hasLegacyQuery: boolean } {
  // 1. Verifica parâmetro legado ?view=xxx
  const searchParams = new URLSearchParams(search);
  const legacyViewParam = searchParams.get('view');
  if (legacyViewParam) {
    const aliased = PATH_TO_VIEW[`/${legacyViewParam}`] || legacyViewParam;
    return { view: aliased, hasLegacyQuery: true };
  }

  // 2. Hash legado #manual
  if (hash === '#manual' && import.meta.env.VITE_DEMO_MODE === 'true') {
    return { view: 'manual', hasLegacyQuery: true };
  }

  // 3. Normaliza pathname (remove barra final se não for a raiz)
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname.toLowerCase();

  const matched = PATH_TO_VIEW[normalizedPath];
  if (matched) {
    return { view: matched, hasLegacyQuery: false };
  }

  // Fallback seguro: se não encontrar rota conhecida, direciona para 'landing'
  return { view: 'landing', hasLegacyQuery: false };
}

// Aliases de compatibilidade e utilitários
export const pathForView = getViewPath;
export function viewFromLocation(pathname: string = window.location.pathname, search: string = window.location.search): string {
  return parseUrlToView(pathname, search).view;
}
export { applySEO as applyHead } from './seo';
