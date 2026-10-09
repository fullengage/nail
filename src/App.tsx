import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layout
import { DemoBanner } from './components/layout/DemoBanner';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { SiteLayout, SITE_VIEWS, SiteActions } from './pages/site/SiteLayout';
import { ArtigoSquadPage } from './pages/site/ArtigoSquadPage';
import { PlanosPage } from './pages/site/PlanosPage';
import { FerramentasPage } from './pages/site/FerramentasPage';
import { SobrePage, ParaCreatorsPage, ParaMarcasPage, ContatoPage } from './pages/site/SitePages';
import { AuthPage } from './pages/auth/AuthPage';
import { ClientManualPage } from './pages/docs/ClientManualPage';
import { TermsPage } from './pages/legal/TermsPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';

// Squadra Core Pages
import { SquadraDashboard } from './pages/squadra/SquadraDashboard';
import { SquadraCreators } from './pages/squadra/SquadraCreators';
import { SquadraRetail } from './pages/squadra/SquadraRetail';
import { CampaignsPage } from './pages/squadra/CampaignsPage';
import { BrandHome } from './pages/brand/BrandHome';
import { SquadraSocialBI } from './pages/squadra/SquadraSocialBI';
import { CreatorOpportunitiesReal, CreatorWorkReal, CreatorEarningsReal } from './pages/creator/CreatorFlow';
import { SquadraCampaignApply } from './pages/squadra/SquadraCampaignApply';
import { SquadraAffiliates } from './pages/squadra/SquadraAffiliates';
import { SquadraReports } from './pages/squadra/SquadraReports';
import { SquadraBrands } from './pages/squadra/SquadraBrands';
import { SquadraSettings } from './pages/squadra/SquadraSettings';
import { SquadraResetPassword } from './pages/squadra/SquadraResetPassword';

// Creator Legacy / Dedicated Pages
import { CreatorPortfolio } from './pages/creator/CreatorPortfolio';
import { CreatorAcademy } from './pages/creator/CreatorAcademy';
import { CreatorProfilePage } from './pages/creator/CreatorProfile';

// Brand Legacy / Dedicated Pages
import { BrandDashboard } from './pages/brand/BrandDashboard';
import { BrandCreators } from './pages/brand/BrandCreators';
import { BrandContent } from './pages/brand/BrandContent';
import { BrandProducts } from './pages/brand/BrandProducts';

// Admin Pages & Guard
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminModeration } from './pages/admin/AdminModeration';
import { AdminFinance } from './pages/admin/AdminFinance';
import { AdminAuthGuard } from './components/admin/AdminAuthGuard';

import { ShieldAlert } from 'lucide-react';
import { getViewPath, parseUrlToView } from './lib/routes';
import { applySEO } from './lib/seo';
import { Button } from './components/ui/Button';

function viewFromUrl(): string {
  const { view } = parseUrlToView(window.location.pathname, window.location.search, window.location.hash);
  // o manual do cliente só existe no modo demo
  return view === 'manual' && import.meta.env.VITE_DEMO_MODE !== 'true' ? 'landing' : view;
}

const MainApp: React.FC = () => {
  const { role, hasSession, isLoading } = useAuth();
  // Home = site institucional; o painel fica atrás de "Acessar painel"
  const [currentView, setCurrentView] = useState<string>(() => viewFromUrl());

  // URL amigável (/para-creators, /painel/creators…) sincronizada com a view + <head> de SEO
  useEffect(() => {
    const target = getViewPath(currentView);
    if (window.location.pathname !== target || window.location.search) {
      // ?view= antigo é substituído (sem criar entrada no histórico); navegação normal faz push
      const legacy = new URLSearchParams(window.location.search).has('view');
      window.history[legacy ? 'replaceState' : 'pushState'](null, '', target + window.location.hash);
    }
    applySEO(currentView);
  }, [currentView]);
  useEffect(() => {
    const onPop = () => setCurrentView(viewFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const isSiteView = (SITE_VIEWS as readonly string[]).includes(currentView);

  const isPublicStandaloneView = 
    currentView === 'landing' || 
    currentView === 'auth' || 
    currentView === 'manual' || 
    currentView === 'termos' || 
    currentView === 'terms' || 
    currentView === 'privacidade' || 
    currentView === 'privacy' ||
    currentView === 'public-apply' ||
    currentView === 'reset-password';

  const isDashboardView = !isPublicStandaloneView;
  // sem sessão do Supabase não existe painel (o modo demonstração usa só dados de exemplo)
  const needsLogin = isDashboardView && !isSiteView && hasSession === false && !isLoading;
  useEffect(() => {
    if (needsLogin) setCurrentView('auth');
  }, [needsLogin]);

  // Permission Guard Function
  const checkPermission = (requiredRole: 'creator' | 'brand' | 'admin', component: React.ReactNode) => {
    const isMaster = role === 'admin_master' || role === 'admin';
    const isBrand = role === 'brand_admin' || role === 'brand';
    const isCreator = role === 'creator';

    const hasAccess = 
      isMaster || 
      (requiredRole === 'creator' && isCreator) ||
      (requiredRole === 'brand' && isBrand);

    if (!hasAccess) {
      return (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">Acesso Restrito por Nível</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta área é exclusiva para contas de nível <strong>{requiredRole === 'creator' ? '3. UGC Influenciador' : requiredRole === 'brand' ? '2. Empresa (Contratante)' : '1. Administrador Geral'}</strong>. Seu perfil atual é <strong>{role.toUpperCase()}</strong>.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => {
                setCurrentView('dashboard');
              }}
            >
              Voltar ao Painel Geral
            </Button>
          </div>
        </div>
      );
    }
    return component;
  };

  const renderContent = () => {
    switch (currentView) {
      // 1. Squadra Core Suite
      case 'dashboard':
        // a marca entra pela tarefa (criar/acompanhar campanha), não pelas métricas de prospecção
        if (role === 'creator') return <CreatorWorkReal />;
        return role === 'brand_admin' || role === 'brand' ? <BrandHome onNavigate={setCurrentView} /> : <SquadraDashboard onNavigate={setCurrentView} />;
      case 'creators':
      case 'brand-creators':
        // curadoria: a empresa não vê a base de creators (quem seleciona é a Squad)
        return role === 'brand_admin' || role === 'brand' ? <BrandHome onNavigate={setCurrentView} /> : <SquadraCreators onNavigate={setCurrentView} />;
      case 'retail':
        return <SquadraRetail />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'affiliates':
        return <SquadraAffiliates />;
      case 'reports':
        return <SquadraReports />;
      case 'brands':
        return <SquadraBrands />;
      case 'settings':
        return <SquadraSettings />;

      // 2. Public / Standalone Pages
      case 'public-apply':
        return <SquadraCampaignApply onNavigate={setCurrentView} />;
      case 'reset-password':
        return <SquadraResetPassword onNavigate={setCurrentView} />;
      case 'auth':
        return <AuthPage onNavigate={setCurrentView} />;
      case 'manual':
        return <ClientManualPage onNavigate={setCurrentView} />;
      case 'termos':
      case 'terms':
        return <TermsPage onNavigate={setCurrentView} />;
      case 'privacidade':
      case 'privacy':
        return <PrivacyPage onNavigate={setCurrentView} />;

      // 3. Creator Dedicated Views
      case 'creator-dashboard':
        // painel do creator = próximas ações reais (sem saldos de exemplo)
        return checkPermission('creator', <CreatorWorkReal />);
      case 'creator-campaigns':
        return checkPermission('creator', <CreatorOpportunitiesReal />);
      case 'creator-my-campaigns':
        return checkPermission('creator', <CreatorWorkReal />);
      case 'creator-portfolio':
        return checkPermission('creator', <CreatorPortfolio />);
      case 'creator-earnings':
        return checkPermission('creator', <CreatorEarningsReal />);
      case 'creator-academy':
        return <CreatorAcademy />;
      case 'creator-profile':
        return checkPermission('creator', <CreatorProfilePage />);

      // 4. Brand Dedicated Views
      case 'brand-dashboard':
        return <BrandHome onNavigate={setCurrentView} />;
      case 'brand-campaigns':
        return checkPermission('brand', <CampaignsPage />);
      case 'brand-create-campaign':
        return checkPermission('brand', <CampaignsPage startBuilding key="novo" />);
      case 'brand-applications':
        return <BrandHome onNavigate={setCurrentView} />;
      case 'brand-content':
        return checkPermission('brand', <BrandContent />);
      case 'brand-products':
        return checkPermission('brand', <BrandProducts />);

      // 5. Admin Views
      case 'admin-dashboard':
        return <AdminAuthGuard onNavigate={setCurrentView}><SquadraDashboard onNavigate={setCurrentView} /></AdminAuthGuard>;
      case 'admin-moderation-creators':
      case 'admin-moderation-brands':
      case 'admin-moderation-campaigns':
        return <AdminAuthGuard onNavigate={setCurrentView}><AdminModeration /></AdminAuthGuard>;
      case 'social-bi':
        return <AdminAuthGuard onNavigate={setCurrentView}><SquadraSocialBI /></AdminAuthGuard>;
      case 'admin-finance':
        return <AdminAuthGuard onNavigate={setCurrentView}><AdminFinance /></AdminAuthGuard>;
      case 'admin-academy':
        return <AdminAuthGuard onNavigate={setCurrentView}><CreatorAcademy /></AdminAuthGuard>;

      default:
        return <SquadraDashboard onNavigate={setCurrentView} />;
    }
  };

  // painel só depois de confirmar a sessão (nada de dados ou menus de admin piscando sem login)
  if (isDashboardView && !isSiteView && hasSession !== true) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>;
  }

  if (isSiteView) {
    const pages: Record<string, React.FC<{ actions: SiteActions }>> = {
      landing: LandingPage, sobre: SobrePage, 'para-creators': ParaCreatorsPage, 'para-marcas': ParaMarcasPage, contato: ContatoPage, squad: ArtigoSquadPage, planos: PlanosPage, ferramentas: FerramentasPage,
    };
    const Page = pages[currentView];
    return (
      <SiteLayout currentView={currentView} onNavigate={setCurrentView}>
        {(actions) => <Page actions={actions} />}
      </SiteLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* 1. Floating Demo Quick Role Switcher */}
      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <DemoBanner currentView={currentView} onNavigate={setCurrentView} />
      )}

      {/* 2. Top Header Navigation */}
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      {/* 3. Main Body (With or Without Sidebar depending on view) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {isDashboardView && (
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        )}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${!isDashboardView ? 'w-full' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {/* 4. Footer */}
      <Footer onNavigate={setCurrentView} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
