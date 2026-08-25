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
import { supabaseService } from '../services/supabaseService';

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
  requestPixWithdrawal: (creatorId: string, pixKey: string) => void;
  
  // Actions for Brand Flow
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => void;
  approveApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  approveContentSubmission: (submissionId: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  inviteCreatorToCampaign: (creatorId: string, campaignId: string) => void;
  
  // Actions for Admin
  processAllPixPayouts: () => void;
  validateCreator: (creatorId: string) => void;
  validateBrand: (brandId: string) => void;
  validateCampaign: (campaignId: string) => void;

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

  const [creators, setCreators] = useState<CreatorProfile[]>(MOCK_CREATORS);
  const [brands, setBrands] = useState<BrandProfile[]>(MOCK_BRANDS);

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

  // Demo Action 1: Creator Applies to Campaign
  const applyToCampaign = (campaignId: string, message: string) => {
    const existing = applications.find(
      (a) => a.campaign_id === campaignId && a.creator_id === 'creator-1'
    );
    if (existing) return false;

    const newApp: CampaignApplication = {
      id: `app-${Date.now()}`,
      campaign_id: campaignId,
      creator_id: 'creator-1',
      message,
      status: 'pending',
      applied_at: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    // Send notification to Brand
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-b1',
      title: '💅 Nova Candidatura Recebida!',
      message: 'Camila Nails candidatou-se à sua campanha. Revise o perfil e portfólio.',
      type: 'application',
      read: false,
      link: '/brand/applications',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    supabaseService.applyToCampaign(campaignId, 'creator-1', message);
    return true;
  };

  // Demo Action 2: Creator Submits Content
  const submitContent = (
    campaignId: string,
    contentType: any,
    mediaUrl: string,
    publishedUrl: string,
    caption: string
  ) => {
    const newSub: ContentSubmission = {
      id: `sub-${Date.now()}`,
      campaign_id: campaignId,
      creator_id: 'creator-1',
      content_type: contentType,
      media_url: mediaUrl,
      published_url: publishedUrl,
      caption,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    setSubmissions((prev) => [newSub, ...prev]);

    // Update participant status to submitted
    setParticipants((prev) =>
      prev.map((p) =>
        p.campaign_id === campaignId && p.creator_id === 'creator-1'
          ? { ...p, status: 'submitted', updated_at: new Date().toISOString() }
          : p
      )
    );

    // Notify Brand
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-b1',
      title: '🎬 Novo Conteúdo Enviado para Aprovação',
      message: 'Camila Nails enviou o Reels produzido para a campanha. Analise a entrega e libere o cachê.',
      type: 'content',
      read: false,
      link: '/brand/content',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return true;
  };

  // Add Portfolio Item
  const addPortfolioItem = (mediaUrl: string, caption: string, technique: string) => {
    const newItem: CreatorPortfolioItem = {
      id: `port-${Date.now()}`,
      creator_id: 'creator-1',
      media_type: 'image',
      media_url: mediaUrl,
      caption,
      technique,
      is_featured: false,
      likes_count: Math.floor(Math.random() * 200) + 150,
      created_at: new Date().toISOString(),
    };
    setPortfolio((prev) => [newItem, ...prev]);
  };

  // Complete lesson in Academy
  const markLessonComplete = (courseId: string, lessonId: string) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          lessons: course.lessons.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, completed: true } : lesson
          ),
        };
      })
    );
  };

  // Creator PIX Withdrawal Request
  const requestPixWithdrawal = (creatorId: string, pixKey: string) => {
    setEarnings((prev) =>
      prev.map((e) =>
        e.creator_id === creatorId && e.status === 'approved'
          ? { ...e, status: 'paid', paid_at: new Date().toISOString() }
          : e
      )
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '💸 Saque PIX Solicitado!',
      message: `Sua solicitação de saque para a chave ${pixKey} foi recebida e está em processamento bancário.`,
      type: 'payment',
      read: false,
      link: '/creator/earnings',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Demo Action 3: Brand Creates Campaign
  const createCampaign = (campData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    const newCamp: Campaign = {
      ...campData,
      id: `cp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    supabaseService.createCampaign(newCamp);
  };

  // Demo Action 4: Brand Approves Application
  const approveApplication = (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'approved' } : a))
    );

    // Add to participants if not already
    const existingPart = participants.find(
      (p) => p.campaign_id === app.campaign_id && p.creator_id === app.creator_id
    );

    if (!existingPart) {
      const newPart: CampaignParticipant = {
        id: `part-${Date.now()}`,
        campaign_id: app.campaign_id,
        creator_id: app.creator_id,
        status: 'producing',
        tracking_code: 'BR123456789SP',
        product_sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setParticipants((prev) => [newPart, ...prev]);
    }

    // Increment occupied slots
    setCampaigns((prev) =>
      prev.map((c) => (c.id === app.campaign_id ? { ...c, occupied_slots: (c.occupied_slots || 0) + 1 } : c))
    );

    // Notify Creator
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '🎉 Parabéns! Você foi selecionada!',
      message: 'A marca aprovou sua candidatura. O kit de produtos foi enviado via Correios.',
      type: 'campaign',
      read: false,
      link: '/creator/my-campaigns',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Brand Rejects Application
  const rejectApplication = (applicationId: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'rejected' } : a))
    );
  };

  // Demo Action 5: Brand Approves Content & Releases Payment
  const approveContentSubmission = (submissionId: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'approved' } : s))
    );

    // Update participant
    setParticipants((prev) =>
      prev.map((p) =>
        p.campaign_id === sub.campaign_id && p.creator_id === sub.creator_id
          ? { ...p, status: 'completed', updated_at: new Date().toISOString() }
          : p
      )
    );

    // Release Earnings to Creator
    const camp = campaigns.find((c) => c.id === sub.campaign_id);
    const amount = camp?.commission_value || 350;

    const newEarning: CreatorEarning = {
      id: `earn-${Date.now()}`,
      creator_id: sub.creator_id,
      campaign_id: sub.campaign_id,
      earning_type: 'campaign',
      amount,
      status: 'approved', // Liberado para saque
      created_at: new Date().toISOString(),
    };
    setEarnings((prev) => [newEarning, ...prev]);

    // Notify Creator
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '✨ Conteúdo aprovado e cachê liberado!',
      message: `A marca aprovou seu Reels com sucesso! O valor de R$ ${amount.toFixed(2)} foi liberado no seu saldo PIX.`,
      type: 'payment',
      read: false,
      link: '/creator/earnings',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Add Product
  const addProduct = (prodData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  // Brand Invites Creator
  const inviteCreatorToCampaign = (creatorId: string, campaignId: string) => {
    const camp = campaigns.find((c) => c.id === campaignId) || campaigns[0];
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '💌 Convite VIP de Parceria da Marca!',
      message: `A marca convidou você com exclusividade para participar da campanha: "${camp.title}".`,
      type: 'campaign',
      read: false,
      link: '/creator/campaigns',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Admin Processes All PIX Payouts
  const processAllPixPayouts = () => {
    setEarnings((prev) =>
      prev.map((e) =>
        e.status === 'approved' ? { ...e, status: 'paid', paid_at: new Date().toISOString() } : e
      )
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'user-c1',
      title: '💰 Lote PIX Concluído!',
      message: 'Todos os cachês e comissões aprovados foram transferidos via PIX com sucesso.',
      type: 'payment',
      read: false,
      link: '/creator/earnings',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const validateCreator = (creatorId: string) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId ? { ...c, verification_status: 'verified' } : c))
    );
  };

  const validateBrand = (brandId: string) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === brandId ? { ...b, status: 'active' } : b))
    );
  };

  const validateCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'open' } : c))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
    setCreators(MOCK_CREATORS);
    setBrands(MOCK_BRANDS);
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
        requestPixWithdrawal,
        createCampaign,
        approveApplication,
        rejectApplication,
        approveContentSubmission,
        addProduct,
        inviteCreatorToCampaign,
        processAllPixPayouts,
        validateCreator,
        validateBrand,
        validateCampaign,
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
