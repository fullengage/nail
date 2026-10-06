import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, CreatorProfile, BrandProfile, UserRole } from '../types/database';
import { SQUADRA_BRANDS, SQUADRA_CREATORS } from '../data/squadraData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Perfis representativos dos 3 Níveis Autenticados
export const SQUADRA_AUTH_LEVELS: Record<'admin_master' | 'brand_admin' | 'creator', {
  profile: Profile;
  label: string;
  description: string;
  defaultEmail: string;
}> = {
  admin_master: {
    label: '1. Administrador Geral',
    description: 'Gestão global da plataforma, multiempresa, pesos do score e relatórios',
    defaultEmail: 'admin@example.com',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      auth_user_id: 'a0000000-0000-0000-0000-000000000001',
      role: 'admin_master',
      full_name: 'Administrador Geral (Squad UGC)',
      email: 'admin@example.com',
      phone: '',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      status: 'active',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z'
    }
  },
  brand_admin: {
    label: '2. Administrador de Empresa (Contratante)',
    description: 'Contratação de creators, gestão de campanhas, pipeline e aprovação de vídeos',
    defaultEmail: 'empresa@example.com',
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      auth_user_id: 'b0000000-0000-0000-0000-000000000002',
      role: 'brand_admin',
      full_name: 'Diretoria de Marketing (Squadra Nutrition)',
      email: 'empresa@example.com',
      phone: '',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      status: 'active',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z'
    }
  },
  creator: {
    label: '3. UGC / Influenciador (Prestador de Serviço)',
    description: 'Oferta de serviços, submissão de vídeos TikTok/Reels, cupons e recebimento de cachês',
    defaultEmail: 'ugc@example.com',
    profile: {
      id: '00000000-0000-0000-0000-000000000003',
      auth_user_id: 'c0000000-0000-0000-0000-000000000003',
      role: 'creator',
      full_name: 'Bruna Oliveira (UGC Creator)',
      email: 'ugc@example.com',
      phone: '',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      status: 'active',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z'
    }
  }
};

interface SignUpCreatorData {
  fullName: string;
  email: string;
  password?: string;
  instagram: string;
  tiktok?: string;
  city: string;
  state: string;
  specialties: string[];
}

interface SignUpBrandData {
  companyName: string;
  brandName: string;
  cnpj: string;
  email: string;
  password?: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
}

interface AuthContextType {
  user: Profile | null;
  creatorProfile: CreatorProfile | null;
  brandProfile: BrandProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSession: boolean | null; // null = conferindo; false = sem sessão do Supabase
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signUpCreator: (data: SignUpCreatorData) => Promise<{ success: boolean; message?: string }>;
  signUpBrand: (data: SignUpBrandData) => Promise<{ success: boolean; message?: string }>;
  loginAsLevel: (level: 'admin_master' | 'brand_admin' | 'creator') => void;
  loginAsDemoUser: (role: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateCreatorProfile: (data: Partial<CreatorProfile>) => void;
  updateBrandProfile: (data: Partial<BrandProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// fora do modo demonstração, nada de papel ou usuário vindo do localStorage
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
// caches antigos que podiam guardar contatos ou um "admin" falso
const LEGACY_KEYS = ['squadra_active_user', 'squadra_active_role', 'squadra_creator_profile', 'squadra_brand_profile', 'squadra_creators_v2', 'ncp_admin_unlocked'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (!IS_DEMO) {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      return 'creator'; // menor privilégio até o perfil do banco carregar (o painel exige sessão)
    }
    const savedRole = localStorage.getItem('squadra_active_role');
    if (savedRole === 'admin_master' || savedRole === 'brand_admin' || savedRole === 'creator') return savedRole;
    return 'admin_master';
  });
  // null = conferindo; false = sem sessão (painel vai para /entrar); true = logado no Supabase
  const [hasSession, setHasSession] = useState<boolean | null>(IS_DEMO ? true : null);

  const [user, setUser] = useState<Profile | null>(() => {
    if (!IS_DEMO) return null;
    const saved = localStorage.getItem('squadra_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return SQUADRA_AUTH_LEVELS.admin_master.profile;
  });

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(() => {
    if (!IS_DEMO) return null;
    const saved = localStorage.getItem('squadra_creator_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return SQUADRA_CREATORS[0] || null;
  });

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(() => {
    if (!IS_DEMO) return null;
    const saved = localStorage.getItem('squadra_brand_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return SQUADRA_BRANDS[0] || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // sessão real: perfil e papel vêm de public.profiles (auth_user_id = usuário logado)
  useEffect(() => {
    if (IS_DEMO) return;
    if (!isSupabaseConfigured || !supabase) { setHasSession(false); return; }
    const applySession = async (authId: string | null) => {
      if (!authId) { setUser(null); setRoleState('creator'); setHasSession(false); return; }
      const { data: prof } = await supabase!.from('profiles').select('*').eq('auth_user_id', authId).maybeSingle();
      if (prof) { setUser(prof as Profile); setRoleState((prof as Profile).role); }
      setHasSession(!!prof);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { applySession(session?.user?.id ?? null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Sync to localStorage (só no modo demonstração)
  useEffect(() => {
    if (!IS_DEMO) return;
    if (user) {
      localStorage.setItem('squadra_active_user', JSON.stringify(user));
      localStorage.setItem('squadra_active_role', user.role);
    } else {
      localStorage.removeItem('squadra_active_user');
      localStorage.removeItem('squadra_active_role');
    }
  }, [user]);

  // Login Function (Supabase Auth + Database Profile Sync)
  // atalho sem senha (e-mail com admin/empresa/creator) só existe em modo demonstração
  const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
  const login = async (email: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Tentar login direto via Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        // senha errada não entra (antes o perfil era carregado só pelo e-mail)
        if (authErr || !authData?.user) {
          if (!DEMO) {
            setIsLoading(false);
            return { success: false, message: 'E-mail ou senha incorretos.' };
          }
          throw new Error(authErr?.message || 'sem sessão');
        }

        // 2. Buscar perfil na tabela public.profiles
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile) {
          const typedProfile = profile as Profile;
          setUser(typedProfile);
          setRoleState(typedProfile.role);

          // Se for creator, busca na tabela public.creators
          if (typedProfile.role === 'creator') {
            // contatos são protegidos no banco: o creator lê o próprio cadastro pela função my_creator
            const { data: cData } = await supabase.rpc('my_creator').maybeSingle();
            if (cData) {
              setCreatorProfile(cData as CreatorProfile);
              localStorage.setItem('squadra_creator_profile', JSON.stringify(cData));
            } else {
              setCreatorProfile(SQUADRA_CREATORS[0]);
            }
          } else if (typedProfile.role === 'brand_admin' || typedProfile.role === 'brand') {
            const { data: bData } = await supabase
              .from('brands')
              .select('*')
              .limit(1)
              .maybeSingle();
            if (bData) {
              setBrandProfile(bData as BrandProfile);
              localStorage.setItem('squadra_brand_profile', JSON.stringify(bData));
            } else {
              setBrandProfile(SQUADRA_BRANDS[0]);
            }
          }

          setIsLoading(false);
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Falha na autenticação remota Supabase:', e.message);
      }
    }

    if (!DEMO) {
      setIsLoading(false);
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    // 3. Fallback de demonstração para os 3 níveis locais (só com VITE_DEMO_MODE=true)
    if (cleanEmail.includes('admin')) {
      loginAsLevel('admin_master');
      setIsLoading(false);
      return { success: true };
    } else if (cleanEmail.includes('empresa') || cleanEmail.includes('marca') || cleanEmail.includes('brand')) {
      loginAsLevel('brand_admin');
      setIsLoading(false);
      return { success: true };
    } else if (cleanEmail.includes('ugc') || cleanEmail.includes('creator')) {
      loginAsLevel('creator');
      setIsLoading(false);
      return { success: true };
    }

    // Default: autentica no nível do papel ativo
    loginAsLevel(role === 'brand_admin' || role === 'brand' ? 'brand_admin' : role === 'creator' ? 'creator' : 'admin_master');
    setIsLoading(false);
    return { success: true };
  };

  // Alternador Rápido entre os 3 Níveis Autenticados (só demonstração: em produção o papel vem do banco)
  const loginAsLevel = (level: 'admin_master' | 'brand_admin' | 'creator') => {
    if (!IS_DEMO) return;
    const config = SQUADRA_AUTH_LEVELS[level];
    setUser(config.profile);
    setRoleState(level);
    localStorage.setItem('squadra_active_role', level);
    localStorage.setItem('squadra_active_user', JSON.stringify(config.profile));

    if (level === 'brand_admin') {
      setBrandProfile(SQUADRA_BRANDS[0]);
      localStorage.setItem('squadra_brand_profile', JSON.stringify(SQUADRA_BRANDS[0]));
    } else if (level === 'creator') {
      setCreatorProfile(SQUADRA_CREATORS[0]);
      localStorage.setItem('squadra_creator_profile', JSON.stringify(SQUADRA_CREATORS[0]));
    }
  };

  const loginAsDemoUser = (targetRole: UserRole) => {
    if (targetRole === 'admin' || targetRole === 'admin_master') {
      loginAsLevel('admin_master');
    } else if (targetRole === 'brand' || targetRole === 'brand_admin') {
      loginAsLevel('brand_admin');
    } else {
      loginAsLevel('creator');
    }
  };

  const setRole = (newRole: UserRole) => {
    loginAsDemoUser(newRole);
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    if (!IS_DEMO) { setRoleState('creator'); setHasSession(false); }
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  };

  // Sign Up Creator
  const signUpCreator = async (data: SignUpCreatorData): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const newUserId = `user-c-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      auth_user_id: `auth-${Date.now()}`,
      role: 'creator',
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      status: 'active',
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newCreatorProfile: CreatorProfile = {
      id: `creator-${Date.now()}`,
      user_id: newUserId,
      professional_name: data.fullName,
      bio: `Criador(a) UGC focado(a) em ${data.specialties.join(', ')}. Cidade: ${data.city}/${data.state}.`,
      city: data.city,
      state: data.state,
      instagram: data.instagram.startsWith('@') ? data.instagram : `@${data.instagram}`,
      tiktok: data.tiktok || '',
      instagram_followers: 15000,
      tiktok_followers: 25000,
      years_experience: 2,
      specialties: data.specialties,
      techniques: ['Resenhas', 'Unboxing', 'Rotina'],
      accepts_product_campaigns: true,
      accepts_paid_campaigns: true,
      accepts_affiliate_campaigns: true,
      accepts_live_campaigns: false,
      portfolio_cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
      profile_completion: 80,
      verification_status: 'pending',
      operational_score: 85,
      engagement_rate: 4.8,
      tags: ['UGC', 'Novo Creator'],
      email: data.email,
      phone: '',
      media_kit_url: '',
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').insert(newProfile);
        await supabase.from('creators').insert(newCreatorProfile);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    setUser(newProfile);
    setCreatorProfile(newCreatorProfile);
    setRoleState('creator');
    setIsLoading(false);
    return { success: true };
  };

  // Sign Up Brand
  const signUpBrand = async (data: SignUpBrandData): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const newUserId = `user-b-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      auth_user_id: `auth-${Date.now()}`,
      role: 'brand_admin',
      full_name: data.contactName,
      email: data.email.toLowerCase(),
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      status: 'active',
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newBrandProfile: BrandProfile = {
      id: `brand-${Date.now()}`,
      user_id: newUserId,
      company_name: data.companyName,
      brand_name: data.brandName,
      cnpj: data.cnpj,
      description: `Marca ${data.brandName} cadastrada na plataforma Squad UGC.`,
      logo_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300',
      contact_name: data.contactName,
      contact_email: data.email,
      contact_phone: data.phone,
      city: data.city,
      state: data.state,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').insert(newProfile);
        await supabase.from('brands').insert(newBrandProfile);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    setUser(newProfile);
    setBrandProfile(newBrandProfile);
    setRoleState('brand_admin');
    setIsLoading(false);
    return { success: true };
  };

  const updateCreatorProfile = (data: Partial<CreatorProfile>) => {
    if (!creatorProfile) return;
    const updated = { ...creatorProfile, ...data, updated_at: new Date().toISOString() };
    setCreatorProfile(updated);
    localStorage.setItem('squadra_creator_profile', JSON.stringify(updated));
  };

  const updateBrandProfile = (data: Partial<BrandProfile>) => {
    if (!brandProfile) return;
    const updated = { ...brandProfile, ...data, updated_at: new Date().toISOString() };
    setBrandProfile(updated);
    localStorage.setItem('squadra_brand_profile', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        creatorProfile,
        brandProfile,
        role,
        isAuthenticated: !!user,
        isLoading,
        hasSession,
        login,
        signUpCreator,
        signUpBrand,
        loginAsLevel,
        loginAsDemoUser,
        logout,
        setRole,
        updateCreatorProfile,
        updateBrandProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
