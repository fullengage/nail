import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  BrandProfile,
  RetailPoint,
  Shipment,
  SourceCounts,
  ScoreWeights,
  PipelineStage
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
import {
  SQUADRA_SOURCE_COUNTS,
  DEFAULT_SCORE_WEIGHTS,
  SQUADRA_BRANDS,
  SQUADRA_CREATORS,
  SQUADRA_RETAIL_POINTS,
  SQUADRA_CAMPAIGNS,
  SQUADRA_PARTICIPANTS,
  SQUADRA_SHIPMENTS,
  SQUADRA_SUBMISSIONS
} from '../data/squadraData';
import { supabaseService } from '../services/supabaseService';

// ids reais do banco são uuid; ids locais (demo/offline) não vão para o Supabase
const isUuid = (v?: string) => !!v && /^[0-9a-f-]{36}$/i.test(v);

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
  retailPoints: RetailPoint[];
  shipments: Shipment[];
  sourceCounts: SourceCounts;
  scoreWeights: ScoreWeights;
  selectedBrandId: string;
  
  // Actions for Creator Flow
  applyToCampaign: (campaignId: string, message: string) => boolean;
  submitContent: (campaignId: string, contentType: any, mediaUrl: string, publishedUrl: string, caption: string) => boolean;
  addPortfolioItem: (mediaUrl: string, caption: string, technique: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  requestPixWithdrawal: (creatorId: string, pixKey: string) => void;
  
  // Actions for Brand Flow
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  approveApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  approveContentSubmission: (submissionId: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  inviteCreatorToCampaign: (creatorId: string, campaignId: string) => void;
  
  // Actions for Squadra Platform
  setSelectedBrandId: (brandId: string) => void;
  setScoreWeights: (weights: ScoreWeights) => void;
  updateCreatorStage: (campaignId: string, creatorId: string, newStage: PipelineStage) => void;
  addCreatorTags: (creatorIds: string[], tags: string[]) => void;
  createSquadFromCreators: (campaignId: string, creatorIds: string[], fee?: number) => { added: number; duplicates: number; noSlot: number };
  advanceSquadStage: (campaignId: string, fromStage: PipelineStage, toStage: PipelineStage) => number;
  importCreatorsCsv: (newCreators: Partial<CreatorProfile>[]) => { added: number; updated: number; duplicates: number };
  addRetailPoint: (retail: Omit<RetailPoint, 'id' | 'created_at'>) => void;
  deleteRetailPoint: (id: string) => void;
  importRetailPointsCsv: (points: Partial<RetailPoint>[]) => number;
  addCreator: (creator: Partial<CreatorProfile>) => void;
  deleteCreator: (id: string) => void;
  addReviewComment: (contentId: string, comment: string, authorName: string) => void;

  // Actions for Admin
  processAllPixPayouts: () => void;
  validateCreator: (creatorId: string) => void;
  validateBrand: (brandId: string) => void;
  validateCampaign: (campaignId: string) => void;

  // Notifications
  markNotificationAsRead: (notificationId: string) => void;
  
  // Brand Actions & Clean Mockups
  addBrand: (brand: Omit<BrandProfile, 'id' | 'created_at'>) => void;
  updateBrand: (id: string, updates: Partial<BrandProfile>) => void;
  deleteBrand: (id: string) => void;
  cleanMockData: () => void;

  // Reset Demo
  resetToDemoDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    return localStorage.getItem('squadra_selected_brand') || 'brand-1';
  });

  const [scoreWeights, setScoreWeightsState] = useState<ScoreWeights>(() => {
    const saved = localStorage.getItem('squadra_score_weights');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_SCORE_WEIGHTS;
  });

  const [creators, setCreators] = useState<CreatorProfile[]>(() => {
    const saved = localStorage.getItem('squadra_creators_v2');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.length >= 100) return parsed;
      } catch (e) { /* ignore */ }
    }
    return SQUADRA_CREATORS;
  });

  const [retailPoints, setRetailPoints] = useState<RetailPoint[]>(() => {
    const saved = localStorage.getItem('squadra_retail_points');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SQUADRA_RETAIL_POINTS;
  });

  // Contadores dinâmicos calculados em tempo real com base no estado real de creators e PDVs
  const sourceCounts = useMemo<SourceCounts>(() => {
    const baselineManicures = 17000;
    const baselineCreators = 808;
    const baselineTiktokLeads = 799;
    const baselineInstagramUgc = 560;
    const baselineRetailActive = 1000;
    const baselineRetailTotal = 8059;

    const totalCreators = creators.length;
    const creatorsWithTiktok = creators.filter((c) => !!c.tiktok && c.tiktok.trim() !== '').length;
    const creatorsWithInsta = creators.filter((c) => !!c.instagram && c.instagram.trim() !== '').length;

    // Delta em relação aos 808 da base inicial
    const tiktokDelta = creatorsWithTiktok - baselineCreators;
    const instaDelta = creatorsWithInsta - 169;

    const tiktok = Math.max(0, baselineTiktokLeads + tiktokDelta);
    const instagram = Math.max(0, baselineInstagramUgc + (instaDelta > 0 ? instaDelta : Math.min(0, totalCreators - baselineCreators)));

    // PDVs em tempo real (base inicial = 200 itens que representam 1000 no catálogo ativo)
    const retailDelta = retailPoints.length - 200;
    const retail_active = Math.max(0, baselineRetailActive + retailDelta);
    const retail_points = Math.max(0, baselineRetailTotal + retailDelta);

    // Creators Únicos: 17.000 manicures + tiktok + instagram + novos cadastros únicos
    // No baseline: 17.000 + 799 + 560 = 18.359
    const uniqueDelta = totalCreators - baselineCreators;
    const unique_creators = Math.max(0, baselineManicures + baselineTiktokLeads + baselineInstagramUgc + uniqueDelta);

    return {
      manicures: baselineManicures,
      tiktok,
      instagram,
      retail_points,
      unique_creators,
      tiktok_mined: totalCreators,
      retail_active
    };
  }, [creators, retailPoints]);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('squadra_campaigns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0 && !parsed[0].title?.includes('Gel Diamante') && !parsed[0].title?.includes('Micromotores')) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return SQUADRA_CAMPAIGNS;
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('squadra_shipments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SQUADRA_SHIPMENTS;
  });

  const [applications, setApplications] = useState<CampaignApplication[]>(() => {
    const saved = localStorage.getItem('squadra_applications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_APPLICATIONS;
  });

  const [participants, setParticipants] = useState<CampaignParticipant[]>(() => {
    const saved = localStorage.getItem('squadra_participants');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SQUADRA_PARTICIPANTS;
  });

  const [submissions, setSubmissions] = useState<ContentSubmission[]>(() => {
    const saved = localStorage.getItem('squadra_submissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SQUADRA_SUBMISSIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ncp_products');
    if (saved) return JSON.parse(saved);
    return MOCK_PRODUCTS;
  });

  const [earnings, setEarnings] = useState<CreatorEarning[]>(() => {
    const saved = localStorage.getItem('ncp_earnings');
    if (saved) return JSON.parse(saved);
    return MOCK_EARNINGS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('ncp_courses');
    if (saved) return JSON.parse(saved);
    return MOCK_COURSES;
  });

  const [portfolio, setPortfolio] = useState<CreatorPortfolioItem[]>(() => {
    const saved = localStorage.getItem('ncp_portfolio');
    if (saved) return JSON.parse(saved);
    return MOCK_PORTFOLIO;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ncp_notifications');
    if (saved) return JSON.parse(saved);
    return MOCK_NOTIFICATIONS;
  });

  const [brands, setBrands] = useState<BrandProfile[]>(() => {
    const saved = localStorage.getItem('squadra_brands');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0 && !parsed[0].company_name?.includes('GlamGel') && !parsed[0].company_name?.includes('BellaVitta')) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return SQUADRA_BRANDS;
  });

  // When Supabase is configured, sync in background
  useEffect(() => {
    supabaseService.getCampaigns().then((data) => {
      if (data && data.length > 0) {
        setCampaigns(data);
        // com campanhas reais, o squad também vem do banco (public.campaign_creators)
        supabaseService.getParticipants().then((parts) => {
          if (parts) setParticipants(parts);
        });
      }
    });
    supabaseService.getCreators().then((data) => {
      if (data && data.length >= 100) setCreators(data);
    });
    // PDVs reais do banco substituem os de demonstração assim que existir pelo menos um
    supabaseService.getRetailPoints().then((data) => {
      if (data && data.length > 0) setRetailPoints(data);
    });
    supabaseService.getBrands().then((data) => {
      if (data && data.length > 0) setBrands(data);
    });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('squadra_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('squadra_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('squadra_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('squadra_submissions', JSON.stringify(submissions));
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

  useEffect(() => {
    localStorage.setItem('squadra_creators_v2', JSON.stringify(creators));
  }, [creators]);

  useEffect(() => {
    localStorage.setItem('squadra_retail_points', JSON.stringify(retailPoints));
  }, [retailPoints]);

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
  // Grava no Supabase (public.campaigns) e usa o id do banco; sem conexão, fica local
  const createCampaign = async (campData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    const saved = await supabaseService.createCampaign(campData);
    const newCamp: Campaign = saved
      ? { ...campData, ...saved }
      : { ...campData, id: `cp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setCampaigns((prev) => [newCamp, ...prev]);
    return newCamp.id;
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

  // Squadra: Alterar Marca Ativa
  const setSelectedBrandIdHandler = (brandId: string) => {
    setSelectedBrandId(brandId);
    localStorage.setItem('squadra_selected_brand', brandId);
  };

  // Squadra: Alterar Pesos da Pontuação Operacional
  const setScoreWeights = (weights: ScoreWeights) => {
    setScoreWeightsState(weights);
    localStorage.setItem('squadra_score_weights', JSON.stringify(weights));
  };

  // Squadra: Movimentar Etapa do Pipeline (14 etapas)
  const updateCreatorStage = (campaignId: string, creatorId: string, newStage: PipelineStage) => {
    if (isUuid(campaignId) && isUuid(creatorId)) {
      supabaseService.updateParticipantStage(campaignId, { creatorId }, newStage, newStage === 'completed' ? 'completed' : newStage === 'approved' ? 'approved' : undefined);
    }
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.campaign_id === campaignId && p.creator_id === creatorId) {
          const updated = {
            ...p,
            stage: newStage,
            status: newStage === 'completed' ? 'completed' : newStage === 'approved' ? 'approved' : p.status,
            updated_at: new Date().toISOString()
          };
          return updated;
        }
        return p;
      })
    );
  };

  // Squadra: Adicionar Tags em Massa a Creators
  const addCreatorTags = (creatorIds: string[], tags: string[]) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (creatorIds.includes(c.id)) {
          const currentTags = c.tags || [];
          const combined = Array.from(new Set([...currentTags, ...tags]));
          return { ...c, tags: combined };
        }
        return c;
      })
    );
  };

  // Squadra: Criar Squad a partir de Creators Selecionados
  const createSquadFromCreators = (campaignId: string, creatorIds: string[], fee?: number) => {
    const newParticipants: CampaignParticipant[] = [];
    const camp = campaigns.find((c) => c.id === campaignId);
    // respeita as vagas da campanha: não deixa o squad passar do limite
    let freeSlots = camp ? Math.max(0, (camp.creator_slots || 0) - (camp.occupied_slots || 0)) : Infinity;
    let duplicates = 0;
    let noSlot = 0;
    creatorIds.forEach((cId) => {
      const creatorObj = creators.find((c) => c.id === cId);
      const handle = (creatorObj?.tiktok || '').toLowerCase();
      // evita duplicar quem já está no squad mesmo se o id mudou (local x Supabase)
      const alreadyIn = participants.some(
        (p) => p.campaign_id === campaignId && (p.creator_id === cId || (!!handle && (p.creator?.tiktok || '').toLowerCase() === handle))
      );
      if (alreadyIn) {
        duplicates++;
      } else if (freeSlots <= 0) {
        noSlot++;
      } else {
        freeSlots--;
        newParticipants.push({
          id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          campaign_id: campaignId,
          creator_id: cId,
          creator: creatorObj,
          stage: 'squad_approved',
          status: 'selected',
          operational_score: creatorObj?.operational_score ?? 0,
          fee: fee ?? camp?.commission_value ?? 0,
          notes: 'Adicionado via seleção em massa no painel de Creators.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    if (newParticipants.length > 0) {
      setParticipants((prev) => [...newParticipants, ...prev]);
      if (isUuid(campaignId)) {
        const toSave = newParticipants.filter((p) => isUuid(p.creator_id));
        supabaseService.addParticipants(toSave).then((saved) => {
          if (!saved) return;
          // troca os ids locais pelos do banco
          const idMap = new Map(toSave.map((p, i) => [p.id, saved[i]?.id || p.id]));
          setParticipants((prev) => prev.map((p) => (idMap.has(p.id) ? { ...p, id: idMap.get(p.id)! } : p)));
        });
        supabaseService.updateCampaign(campaignId, { occupied_slots: (camp?.occupied_slots || 0) + newParticipants.length });
      }
      // Update occupied slots
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, occupied_slots: (c.occupied_slots || 0) + newParticipants.length } : c
        )
      );
    }
    return { added: newParticipants.length, duplicates, noSlot };
  };

  // Avança em lote todos os creators de uma etapa para a próxima (ex.: enviar briefing para o squad inteiro)
  const advanceSquadStage = (campaignId: string, fromStage: PipelineStage, toStage: PipelineStage) => {
    if (isUuid(campaignId)) {
      supabaseService.updateParticipantStage(campaignId, { fromStage }, toStage, toStage === 'completed' ? 'completed' : toStage === 'approved' ? 'approved' : undefined);
    }
    const count = participants.filter((p) => p.campaign_id === campaignId && p.stage === fromStage).length;
    setParticipants((prev) =>
      prev.map((p) =>
        p.campaign_id === campaignId && p.stage === fromStage
          ? { ...p, stage: toStage, status: toStage === 'completed' ? 'completed' : toStage === 'approved' ? 'approved' : p.status, updated_at: new Date().toISOString() }
          : p
      )
    );
    return count;
  };

  // Squadra: Importar CSV de Creators com Deduplicação por telefone / e-mail / @
  const importCreatorsCsv = (newItems: Partial<CreatorProfile>[]) => {
    let added = 0;
    let updated = 0;
    let duplicates = 0;

    setCreators((prev) => {
      const existingHandles = new Set(prev.map((c) => (c.tiktok || '').toLowerCase().trim()));
      const existingEmails = new Set(prev.map((c) => (c.email || '').toLowerCase().trim()));
      const existingPhones = new Set(prev.map((c) => (c.phone || '').replace(/\D/g, '')));

      const toAdd: CreatorProfile[] = [];

      newItems.forEach((item, idx) => {
        const handle = (item.tiktok || item.instagram || '').toLowerCase().trim();
        const email = (item.email || '').toLowerCase().trim();
        const phone = (item.phone || '').replace(/\D/g, '');

        const isDup =
          (handle && existingHandles.has(handle)) ||
          (email && existingEmails.has(email)) ||
          (phone && phone.length > 8 && existingPhones.has(phone));

        if (isDup) {
          duplicates++;
        } else {
          added++;
          toAdd.push({
            id: `creator-imp-${Date.now()}-${idx}`,
            user_id: `user-imp-${idx}`,
            professional_name: item.professional_name || item.tiktok || item.instagram || '',
            bio: item.bio || '',
            city: item.city || '',
            state: item.state || '',
            instagram: item.instagram || '',
            tiktok: item.tiktok || '',
            youtube: item.youtube || '',
            instagram_followers: item.instagram_followers || 0,
            tiktok_followers: item.tiktok_followers || 0,
            youtube_followers: item.youtube_followers || 0,
            years_experience: 0,
            specialties: item.specialties || [],
            techniques: item.techniques || [],
            accepts_product_campaigns: true,
            accepts_paid_campaigns: true,
            accepts_affiliate_campaigns: true,
            accepts_live_campaigns: false,
            portfolio_cover_url: '',
            profile_completion: 0,
            verification_status: 'unverified',
            operational_score: item.operational_score || 0,
            engagement_rate: item.engagement_rate || 0,
            tags: item.tags || ['Importado'],
            email: item.email || '',
            phone: item.phone || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      return [...toAdd, ...prev];
    });

    return { added, updated, duplicates };
  };

  // Squadra: Adicionar e Importar PDVs (Retail Points)
  // PDVs ficam salvos no Supabase; o id local é trocado pelo do banco quando a gravação volta
  const persistRetail = (local: RetailPoint[]) => {
    supabaseService.saveRetailPoints(local.map(({ id: _id, created_at: _c, ...rest }) => rest)).then((saved) => {
      if (!saved) return;
      const ids = new Set(local.map((p) => p.id));
      setRetailPoints((prev) => [...saved, ...prev.filter((p) => !ids.has(p.id))]);
    });
  };

  const addRetailPoint = (retail: Omit<RetailPoint, 'id' | 'created_at'>) => {
    const newPoint: RetailPoint = {
      ...retail,
      id: `retail-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setRetailPoints((prev) => [newPoint, ...prev]);
    persistRetail([newPoint]);
  };

  const importRetailPointsCsv = (points: Partial<RetailPoint>[]) => {
    // só o que veio no arquivo (ou da Receita via BrasilAPI); nada de valor padrão inventado.
    // Deduplica por CNPJ contra a base atual.
    const known = new Set(retailPoints.map((r) => (r.cnpj || '').replace(/\D/g, '')).filter(Boolean));
    const valid: RetailPoint[] = [];
    points.forEach((p, idx) => {
      const key = (p.cnpj || '').replace(/\D/g, '');
      if (!p.name || (key && known.has(key))) return;
      if (key) known.add(key);
      valid.push({
        id: `retail-imp-${Date.now()}-${idx}`,
        name: p.name,
        trade_name: p.trade_name || p.name,
        network: p.network || p.name,
        cnpj: p.cnpj || '',
        type: p.type || 'cosmetics',
        city: p.city || '',
        state: p.state || '',
        address: p.address || '',
        phone: p.phone || '',
        email: p.email || '',
        manager_name: p.manager_name || '',
        status: p.status || 'active',
        created_at: new Date().toISOString()
      });
    });
    setRetailPoints((prev) => [...valid, ...prev]);
    persistRetail(valid);
    return valid.length;
  };

  const deleteRetailPoint = (id: string) => {
    setRetailPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const addCreator = (newCreator: Partial<CreatorProfile>) => {
    const creator: CreatorProfile = {
      id: `creator-${Date.now()}`,
      user_id: '',
      professional_name: newCreator.professional_name || newCreator.tiktok || 'Novo Creator',
      bio: newCreator.bio || '',
      city: newCreator.city || '',
      state: newCreator.state || '',
      instagram: newCreator.instagram || '',
      tiktok: newCreator.tiktok || '',
      youtube: newCreator.youtube || '',
      instagram_followers: Number(newCreator.instagram_followers || 0),
      tiktok_followers: Number(newCreator.tiktok_followers || 0),
      youtube_followers: Number(newCreator.youtube_followers || 0),
      years_experience: 0,
      specialties: newCreator.specialties && newCreator.specialties.length > 0 ? newCreator.specialties : ['Geral'],
      techniques: newCreator.techniques || [],
      accepts_product_campaigns: true,
      accepts_paid_campaigns: true,
      accepts_affiliate_campaigns: true,
      accepts_live_campaigns: false,
      portfolio_cover_url: newCreator.portfolio_cover_url || '',
      profile_completion: 100,
      verification_status: 'verified',
      operational_score: Number(newCreator.operational_score || 85),
      engagement_rate: Number(newCreator.engagement_rate || 4.2),
      tags: newCreator.tags || ['Novo'],
      email: newCreator.email || '',
      phone: newCreator.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCreators((prev) => [creator, ...prev]);
  };

  const deleteCreator = (id: string) => {
    setCreators((prev) => prev.filter((c) => c.id !== id));
  };

  // Squadra: Adicionar Comentário de Revisão
  const addReviewComment = (contentId: string, comment: string, authorName: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === contentId) {
          const newReview = {
            id: `rev-${Date.now()}`,
            content_id: contentId,
            author_name: authorName,
            author_role: 'brand_admin',
            comment,
            created_at: new Date().toISOString()
          };
          return {
            ...sub,
            reviews: [...(sub.reviews || []), newReview]
          };
        }
        return sub;
      })
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const resetToDemoDefaults = () => {
    localStorage.removeItem('squadra_campaigns');
    localStorage.removeItem('squadra_creators_v2');
    localStorage.removeItem('squadra_retail_points');
    localStorage.removeItem('squadra_shipments');
    localStorage.removeItem('squadra_participants');
    localStorage.removeItem('squadra_submissions');
    localStorage.removeItem('squadra_score_weights');
    setCampaigns(SQUADRA_CAMPAIGNS);
    setCreators(SQUADRA_CREATORS);
    setRetailPoints(SQUADRA_RETAIL_POINTS);
    setShipments(SQUADRA_SHIPMENTS);
    setParticipants(SQUADRA_PARTICIPANTS);
    setSubmissions(SQUADRA_SUBMISSIONS);
    setScoreWeightsState(DEFAULT_SCORE_WEIGHTS);
  };

  const addBrand = (newBrand: Omit<BrandProfile, 'id' | 'created_at'>) => {
    const brand: BrandProfile = {
      ...newBrand,
      id: `brand-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setBrands(prev => {
      const next = [brand, ...prev];
      localStorage.setItem('squadra_brands', JSON.stringify(next));
      return next;
    });
  };

  const updateBrand = (id: string, updates: Partial<BrandProfile>) => {
    setBrands(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      localStorage.setItem('squadra_brands', JSON.stringify(next));
      return next;
    });
  };

  const deleteBrand = (id: string) => {
    setBrands(prev => {
      const next = prev.filter(b => b.id !== id);
      localStorage.setItem('squadra_brands', JSON.stringify(next));
      return next;
    });
    if (selectedBrandId === id) {
      const remaining = brands.filter(b => b.id !== id);
      if (remaining.length > 0) setSelectedBrandIdHandler(remaining[0].id);
    }
  };

  const cleanMockData = () => {
    localStorage.removeItem('squadra_brands');
    localStorage.removeItem('squadra_campaigns');
    localStorage.removeItem('squadra_creators_v2');
    localStorage.removeItem('squadra_retail_points');
    localStorage.removeItem('squadra_shipments');
    localStorage.removeItem('squadra_participants');
    localStorage.removeItem('squadra_submissions');
    localStorage.removeItem('squadra_score_weights');
    localStorage.removeItem('ncp_campaigns');
    localStorage.removeItem('ncp_creators');
    localStorage.removeItem('ncp_brands');
    localStorage.removeItem('ncp_products');
    localStorage.removeItem('ncp_portfolio');

    setBrands(SQUADRA_BRANDS);
    setSelectedBrandIdHandler(SQUADRA_BRANDS[0].id);
    setCampaigns(SQUADRA_CAMPAIGNS);
    setCreators(SQUADRA_CREATORS);
    setRetailPoints(SQUADRA_RETAIL_POINTS);
    setShipments(SQUADRA_SHIPMENTS);
    setParticipants(SQUADRA_PARTICIPANTS);
    setSubmissions(SQUADRA_SUBMISSIONS);
    setScoreWeightsState(DEFAULT_SCORE_WEIGHTS);
  };

  // Fonte única: participantes de campanha sempre apontam para o creator ATUAL (mesmos valores da tela de Creators).
  // Liga por id e, se o id mudou (dados locais x Supabase), pelo @ do TikTok.
  const liveParticipants = useMemo(() => {
    const byId = new Map(creators.map((c) => [c.id, c]));
    const byHandle = new Map(creators.map((c) => [(c.tiktok || '').toLowerCase(), c]));
    return participants.map((p) => {
      const c = byId.get(p.creator_id) || byHandle.get((p.creator?.tiktok || '').toLowerCase());
      return c ? { ...p, creator: c, operational_score: c.operational_score } : p;
    });
  }, [participants, creators]);

  return (
    <DataContext.Provider
      value={{
        campaigns,
        applications,
        participants: liveParticipants,
        submissions,
        products,
        earnings,
        courses,
        portfolio,
        notifications,
        creators,
        brands,
        retailPoints,
        shipments,
        sourceCounts,
        scoreWeights,
        selectedBrandId,
        setSelectedBrandId: setSelectedBrandIdHandler,
        setScoreWeights,
        updateCreatorStage,
        addCreatorTags,
        createSquadFromCreators,
        advanceSquadStage,
        importCreatorsCsv,
        addRetailPoint,
        deleteRetailPoint,
        importRetailPointsCsv,
        addCreator,
        deleteCreator,
        addReviewComment,
        addBrand,
        updateBrand,
        deleteBrand,
        cleanMockData,
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
