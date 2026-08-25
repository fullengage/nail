import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Campaign,
  CampaignApplication,
  CampaignParticipant,
  ContentSubmission,
  Product,
  CreatorEarning,
  Course,
  CreatorPortfolioItem,
  AppNotification,
  CreatorProfile,
  BrandProfile
} from '../types/database';
import {
  MOCK_CAMPAIGNS,
  MOCK_APPLICATIONS,
  MOCK_PARTICIPANTS,
  MOCK_SUBMISSIONS,
  MOCK_PRODUCTS,
  MOCK_EARNINGS,
  MOCK_COURSES,
  MOCK_PORTFOLIO,
  MOCK_NOTIFICATIONS,
  MOCK_CREATORS,
  MOCK_BRANDS,
} from '../data/mockData';

interface DataContextType {
  campaigns: Campaign[];
  applications: CampaignApplication[];
  participants: CampaignParticipant[];
  submissions: ContentSubmission[];
  products: Product[];
  earnings: CreatorEarning[];
  courses: Course[];
  portfolio: CreatorPortfolioItem[];
  notifications: AppNotification[];
  creators: CreatorProfile[];
  brands: BrandProfile[];
  
  // Actions for Creator Flow
  applyToCampaign: (campaignId: string, message: string) => boolean;
  submitContent: (campaignId: string, contentType: any, mediaUrl: string, publishedUrl: string, caption: string) => boolean;
  addPortfolioItem: (mediaUrl: string, caption: string, technique: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  
  // Actions for Brand Flow
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => void;
  approveApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  approveContentSubmission: (submissionId: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  
  // Notifications
  markNotificationAsRead: (notificationId: string) => void;
  
  // Reset Demo
  resetToDemoDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('ncp_campaigns');
    return saved ? JSON.parse(saved) : MOCK_CAMPAIGNS;
  });

  const [applications, setApplications] = useState<CampaignApplication[]>(() => {
    const saved = localStorage.getItem('ncp_applications');
    return saved ? JSON.parse(saved) : MOCK_APPLICATIONS;
  });

  const [participants, setParticipants] = useState<CampaignParticipant[]>(() => {
    const saved = localStorage.getItem('ncp_participants');
    return saved ? JSON.parse(saved) : MOCK_PARTICIPANTS;
  });

  const [submissions, setSubmissions] = useState<ContentSubmission[]>(() => {
    const saved = localStorage.getItem('ncp_submissions');
    return saved ? JSON.parse(saved) : MOCK_SUBMISSIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ncp_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [earnings, setEarnings] = useState<CreatorEarning[]>(() => {
    const saved = localStorage.getItem('ncp_earnings');
    return saved ? JSON.parse(saved) : MOCK_EARNINGS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('ncp_courses');
    return saved ? JSON.parse(saved) : MOCK_COURSES;
  });

  const [portfolio, setPortfolio] = useState<CreatorPortfolioItem[]>(() => {
    const saved = localStorage.getItem('ncp_portfolio');
    return saved ? JSON.parse(saved) : MOCK_PORTFOLIO;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ncp_notifications');
    return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
  });

  const [creators] = useState<CreatorProfile[]>(MOCK_CREATORS);
  const [brands] = useState<BrandProfile[]>(MOCK_BRANDS);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ncp_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('ncp_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('ncp_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('ncp_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('ncp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ncp_earnings', JSON.stringify(earnings));
  }, [earnings]);

  useEffect(() => {
    localStorage.setItem('ncp_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('ncp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Demo Action: Apply to Campaign
  const applyToCampaign = (campaignId: string, message: string): boolean => {
    const creatorId = 'creator-1';
    
    // Check if already applied
    const exists = applications.some(a => a.campaign_id === campaignId && a.creator_id === creatorId);
    if (exists) return false;

    const newApp: CampaignApplication = {
      id: `app-${Date.now()}`,
      campaign_id: campaignId,
      creator_id: creatorId,
      message,
      status: 'pending',
      applied_at: new Date().toISOString(),
    };

    setApplications(prev => [newApp, ...prev]);

    // Add notification to brand
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-b1',
      title: '📥 Nova candidatura recebida!',
      message: `Camila Nails (@camilanails_art) se candidatou à sua campanha.`,
      type: 'application',
      read: false,
      link: '/brand/applications',
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    return true;
  };

  // Demo Action: Submit Content
  const submitContent = (
    campaignId: string,
    contentType: any,
    mediaUrl: string,
    publishedUrl: string,
    caption: string
  ): boolean => {
    const creatorId = 'creator-1';

    const newSub: ContentSubmission = {
      id: `sub-${Date.now()}`,
      campaign_id: campaignId,
      creator_id: creatorId,
      content_type: contentType,
      media_url: mediaUrl,
      published_url: publishedUrl,
      caption,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      metrics: {
        id: `met-${Date.now()}`,
        submission_id: `sub-${Date.now()}`,
        views: 12400,
        likes: 950,
        comments: 84,
        shares: 120,
        saves: 340,
        clicks: 210,
        sales: 14,
        revenue: 1260.00,
        updated_at: new Date().toISOString(),
      }
    };

    setSubmissions(prev => [newSub, ...prev]);

    // Update participant status to submitted
    setParticipants(prev =>
      prev.map(p =>
        p.campaign_id === campaignId && p.creator_id === creatorId
          ? { ...p, status: 'submitted', updated_at: new Date().toISOString() }
          : p
      )
    );

    // Notify brand
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-b1',
      title: '🎬 Conteúdo enviado para aprovação!',
      message: 'Camila Nails enviou o conteúdo da campanha. Confira na aba de conteúdos.',
      type: 'content',
      read: false,
      link: '/brand/content',
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    return true;
  };

  // Demo Action: Add Portfolio Item
  const addPortfolioItem = (mediaUrl: string, caption: string, technique: string) => {
    const newItem: CreatorPortfolioItem = {
      id: `port-${Date.now()}`,
      creator_id: 'creator-1',
      media_type: 'image',
      media_url: mediaUrl,
      caption,
      technique,
      is_featured: false,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };
    setPortfolio(prev => [newItem, ...prev]);
  };

  // Demo Action: Mark Lesson Complete
  const markLessonComplete = (_courseId: string, _lessonId: string) => {
    // In demo mode, simply acknowledge progress
  };

  // Demo Action: Create Campaign
  const createCampaign = (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      occupied_slots: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  // Demo Action: Approve Application (Flow 2)
  const approveApplication = (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    setApplications(prev =>
      prev.map(a => (a.id === applicationId ? { ...a, status: 'approved', reviewed_at: new Date().toISOString() } : a))
    );

    // Create participant entry
    const newPart: CampaignParticipant = {
      id: `part-${Date.now()}`,
      campaign_id: app.campaign_id,
      creator_id: app.creator_id,
      status: 'selected',
      tracking_code: `BR${Math.floor(100000000 + Math.random() * 900000000)}SP`,
      product_sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setParticipants(prev => {
      const filtered = prev.filter(p => !(p.campaign_id === app.campaign_id && p.creator_id === app.creator_id));
      return [newPart, ...filtered];
    });

    // Notify Creator
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '🎉 Sua candidatura foi APROVADA!',
      message: `A marca aprovou sua participação na campanha. Verifique em "Minhas Campanhas".`,
      type: 'campaign',
      read: false,
      link: '/creator/my-campaigns',
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Demo Action: Reject Application
  const rejectApplication = (applicationId: string) => {
    setApplications(prev =>
      prev.map(a => (a.id === applicationId ? { ...a, status: 'rejected', reviewed_at: new Date().toISOString() } : a))
    );
  };

  // Demo Action: Approve Content (Flow 4)
  const approveContentSubmission = (submissionId: string) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    setSubmissions(prev =>
      prev.map(s => (s.id === submissionId ? { ...s, status: 'approved', approved_at: new Date().toISOString() } : s))
    );

    // Update participant to completed
    setParticipants(prev =>
      prev.map(p =>
        p.campaign_id === sub.campaign_id && p.creator_id === sub.creator_id
          ? { ...p, status: 'completed', updated_at: new Date().toISOString() }
          : p
      )
    );

    // Add earning entry
    const newEarning: CreatorEarning = {
      id: `earn-${Date.now()}`,
      creator_id: sub.creator_id,
      campaign_id: sub.campaign_id,
      campaign_title: 'Campanha Concluída com Sucesso',
      earning_type: 'campaign',
      amount: 350.00,
      status: 'approved',
      created_at: new Date().toISOString(),
    };
    setEarnings(prev => [newEarning, ...prev]);

    // Notify Creator
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '✨ Conteúdo aprovado e comissão liberada!',
      message: 'A marca aprovou seu Reels com elogios! Seu cachê foi liberado no extrato.',
      type: 'payment',
      read: false,
      link: '/creator/earnings',
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Demo Action: Add Product
  const addProduct = (prodData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const resetToDemoDefaults = () => {
    localStorage.removeItem('ncp_campaigns');
    localStorage.removeItem('ncp_applications');
    localStorage.removeItem('ncp_participants');
    localStorage.removeItem('ncp_submissions');
    localStorage.removeItem('ncp_products');
    localStorage.removeItem('ncp_earnings');
    localStorage.removeItem('ncp_portfolio');
    localStorage.removeItem('ncp_notifications');
    setCampaigns(MOCK_CAMPAIGNS);
    setApplications(MOCK_APPLICATIONS);
    setParticipants(MOCK_PARTICIPANTS);
    setSubmissions(MOCK_SUBMISSIONS);
    setProducts(MOCK_PRODUCTS);
    setEarnings(MOCK_EARNINGS);
    setPortfolio(MOCK_PORTFOLIO);
    setNotifications(MOCK_NOTIFICATIONS);
  };

  return (
    <DataContext.Provider
      value={{
        campaigns,
        applications,
        participants,
        submissions,
        products,
        earnings,
        courses,
        portfolio,
        notifications,
        creators,
        brands,
        applyToCampaign,
        submitContent,
        addPortfolioItem,
        markLessonComplete,
        createCampaign,
        approveApplication,
        rejectApplication,
        approveContentSubmission,
        addProduct,
        markNotificationAsRead,
        resetToDemoDefaults,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
