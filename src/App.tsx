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
import { AuthPage } from './pages/auth/AuthPage';

// Creator Pages
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { CreatorCampaigns } from './pages/creator/CreatorCampaigns';
import { CreatorMyCampaigns } from './pages/creator/CreatorMyCampaigns';
import { CreatorPortfolio } from './pages/creator/CreatorPortfolio';
import { CreatorEarnings } from './pages/creator/CreatorEarnings';
import { CreatorAcademy } from './pages/creator/CreatorAcademy';
import { CreatorProfilePage } from './pages/creator/CreatorProfile';

// Brand Pages
import { BrandDashboard } from './pages/brand/BrandDashboard';
import { BrandCampaigns } from './pages/brand/BrandCampaigns';
import { BrandCreators } from './pages/brand/BrandCreators';
import { BrandApplications } from './pages/brand/BrandApplications';
import { BrandContent } from './pages/brand/BrandContent';
import { BrandProducts } from './pages/brand/BrandProducts';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminModeration } from './pages/admin/AdminModeration';
import { AdminFinance } from './pages/admin/AdminFinance';

import { ShieldAlert } from 'lucide-react';
import { Button } from './components/ui/Button';

const MainApp: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const isDashboardView = currentView !== 'landing' && currentView !== 'auth';

  // Permission Guard Function
  const checkPermission = (requiredRole: 'creator' | 'brand' | 'admin', component: React.ReactNode) => {
    if (role !== requiredRole && role !== 'admin') {
      return (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">Acesso Restrito por Perfil</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta área é exclusiva para contas de <strong>{requiredRole === 'creator' ? 'Nail Creators' : requiredRole === 'brand' ? 'Marcas Parceiras' : 'Administradores'}</strong>. Seu perfil atual é <strong>{role.toUpperCase()}</strong>.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => {
                if (role === 'creator') setCurrentView('creator-dashboard');
                else if (role === 'brand') setCurrentView('brand-dashboard');
                else setCurrentView('admin-dashboard');
              }}
            >
              Voltar ao Meu Painel ({role})
            </Button>
          </div>
        </div>
      );
    }
    return component;
  };

  const renderContent = () => {
    switch (currentView) {
      // Landing & Auth
      case 'landing':
        return <LandingPage onNavigate={setCurrentView} />;
      case 'auth':
        return <AuthPage onNavigate={setCurrentView} />;

      // Creator Routes (Protected for Creator or Admin)
      case 'creator-dashboard':
        return checkPermission('creator', <CreatorDashboard onNavigate={setCurrentView} />);
      case 'creator-campaigns':
        return checkPermission('creator', <CreatorCampaigns />);
      case 'creator-my-campaigns':
        return checkPermission('creator', <CreatorMyCampaigns />);
      case 'creator-portfolio':
        return checkPermission('creator', <CreatorPortfolio />);
      case 'creator-earnings':
        return checkPermission('creator', <CreatorEarnings />);
      case 'creator-academy':
        return <CreatorAcademy />;
      case 'creator-profile':
        return checkPermission('creator', <CreatorProfilePage />);

      // Brand Routes (Protected for Brand or Admin)
      case 'brand-dashboard':
        return checkPermission('brand', <BrandDashboard onNavigate={setCurrentView} />);
      case 'brand-campaigns':
        return checkPermission('brand', <BrandCampaigns onNavigate={setCurrentView} />);
      case 'brand-create-campaign':
        return checkPermission('brand', <BrandCampaigns onNavigate={setCurrentView} openCreateWizard={true} />);
      case 'brand-creators':
        return checkPermission('brand', <BrandCreators />);
      case 'brand-applications':
        return checkPermission('brand', <BrandApplications />);
      case 'brand-content':
        return checkPermission('brand', <BrandContent />);
      case 'brand-products':
        return checkPermission('brand', <BrandProducts />);

      // Admin Routes (Protected strictly for Admin)
      case 'admin-dashboard':
        return checkPermission('admin', <AdminDashboard onNavigate={setCurrentView} />);
      case 'admin-moderation-creators':
      case 'admin-moderation-brands':
      case 'admin-moderation-campaigns':
        return checkPermission('admin', <AdminModeration />);
      case 'admin-finance':
        return checkPermission('admin', <AdminFinance />);
      case 'admin-academy':
        return checkPermission('admin', <CreatorAcademy />);

      default:
        return <LandingPage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* 1. Floating Demo Quick Role Switcher */}
      <DemoBanner currentView={currentView} onNavigate={setCurrentView} />

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
      <Footer />
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
