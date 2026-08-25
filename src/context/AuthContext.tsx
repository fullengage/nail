import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, CreatorProfile, BrandProfile, UserRole } from '../types/database';
import { MOCK_PROFILES, MOCK_CREATORS, MOCK_BRANDS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signUpCreator: (data: SignUpCreatorData) => Promise<{ success: boolean; message?: string }>;
  signUpBrand: (data: SignUpBrandData) => Promise<{ success: boolean; message?: string }>;
  loginAsDemoUser: (role: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateCreatorProfile: (data: Partial<CreatorProfile>) => void;
  updateBrandProfile: (data: Partial<BrandProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('ncp_active_role');
    return (savedRole as UserRole) || 'creator';
  });

  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('ncp_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_PROFILES.find((p) => p.role === 'creator') || MOCK_PROFILES[0];
  });

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(() => {
    const saved = localStorage.getItem('ncp_creator_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_CREATORS[0];
  });

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(() => {
    const saved = localStorage.getItem('ncp_brand_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_BRANDS[0];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('ncp_active_user', JSON.stringify(user));
    else localStorage.removeItem('ncp_active_user');
  }, [user]);

  // Login Function (Supabase Auth + Local fallback)
  const login = async (email: string, password = 'password123'): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        // Try authenticating with Supabase Auth or query ncp_profiles
        const { data: profile, error } = await supabase
          .from('ncp_profiles')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (profile) {
          setUser(profile as Profile);
          setRoleState(profile.role);
          localStorage.setItem('ncp_active_role', profile.role);

          if (profile.role === 'creator') {
            const { data: cData } = await supabase
              .from('ncp_creator_profiles')
              .select('*')
              .eq('user_id', profile.id)
              .maybeSingle();
            if (cData) setCreatorProfile(cData as CreatorProfile);
          } else if (profile.role === 'brand') {
            const { data: bData } = await supabase
              .from('ncp_brand_profiles')
              .select('*')
              .eq('user_id', profile.id)
              .maybeSingle();
            if (bData) setBrandProfile(bData as BrandProfile);
          }

          setIsLoading(false);
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Supabase query fallback:', e.message);
      }
    }

    // Fallback Mock Profile Match
    const foundProfile = MOCK_PROFILES.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (foundProfile) {
      setUser(foundProfile);
      setRoleState(foundProfile.role);
      localStorage.setItem('ncp_active_role', foundProfile.role);
      setIsLoading(false);
      return { success: true };
    }

    // Generic demo login
    loginAsDemoUser(role);
    setIsLoading(false);
    return { success: true };
  };

  // Sign Up Creator
  const signUpCreator = async (data: SignUpCreatorData): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const newUserId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      auth_user_id: `auth-${Date.now()}`,
      role: 'creator',
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newCreatorProfile: CreatorProfile = {
      id: `creator-${Date.now()}`,
      user_id: newUserId,
      professional_name: data.fullName,
      bio: `Nail designer apaixonada por ${data.specialties.join(', ')}. Atendendo em ${data.city}/${data.state}.`,
      city: data.city,
      state: data.state,
      instagram: data.instagram.startsWith('@') ? data.instagram : `@${data.instagram}`,
      tiktok: data.tiktok || '',
      instagram_followers: 5000,
      tiktok_followers: 2500,
      years_experience: 3,
      specialties: data.specialties,
      techniques: ['Francesa', 'Esmaltação em Gel'],
      accepts_product_campaigns: true,
      accepts_paid_campaigns: true,
      accepts_affiliate_campaigns: true,
      accepts_live_campaigns: true,
      portfolio_cover_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800',
      profile_completion: 85,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('ncp_profiles').insert(newProfile);
        await supabase.from('ncp_creator_profiles').insert(newCreatorProfile);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    setUser(newProfile);
    setCreatorProfile(newCreatorProfile);
    setRoleState('creator');
    localStorage.setItem('ncp_active_role', 'creator');
    setIsLoading(false);
    return { success: true };
  };

  // Sign Up Brand
  const signUpBrand = async (data: SignUpBrandData): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const newUserId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      auth_user_id: `auth-${Date.now()}`,
      role: 'brand',
      full_name: data.contactName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      avatar_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newBrandProfile: BrandProfile = {
      id: `brand-${Date.now()}`,
      user_id: newUserId,
      company_name: data.companyName,
      brand_name: data.brandName,
      cnpj: data.cnpj,
      description: `Marca ${data.brandName} cadastrada no Nail Club Pro.`,
      logo_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      contact_name: data.contactName,
      contact_email: data.email,
      contact_phone: data.phone,
      city: data.city,
      state: data.state,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('ncp_profiles').insert(newProfile);
        await supabase.from('ncp_brand_profiles').insert(newBrandProfile);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    setUser(newProfile);
    setBrandProfile(newBrandProfile);
    setRoleState('brand');
    localStorage.setItem('ncp_active_role', 'brand');
    setIsLoading(false);
    return { success: true };
  };

  const loginAsDemoUser = (targetRole: UserRole) => {
    setRoleState(targetRole);
    localStorage.setItem('ncp_active_role', targetRole);

    if (targetRole === 'creator') {
      const profile = MOCK_PROFILES.find((p) => p.id === 'user-c1') || MOCK_PROFILES[0];
      setUser(profile);
      setCreatorProfile(MOCK_CREATORS[0]);
    } else if (targetRole === 'brand') {
      const profile = MOCK_PROFILES.find((p) => p.id === 'user-b1') || MOCK_PROFILES[10];
      setUser(profile);
      setBrandProfile(MOCK_BRANDS[0]);
    } else if (targetRole === 'admin') {
      const profile = MOCK_PROFILES.find((p) => p.role === 'admin') || MOCK_PROFILES[13];
      setUser(profile);
    }
  };

  const setRole = (newRole: UserRole) => {
    loginAsDemoUser(newRole);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ncp_active_user');
  };

  const updateCreatorProfile = (data: Partial<CreatorProfile>) => {
    if (!creatorProfile) return;
    const updated = { ...creatorProfile, ...data, updated_at: new Date().toISOString() };
    setCreatorProfile(updated);
    localStorage.setItem('ncp_creator_profile', JSON.stringify(updated));
  };

  const updateBrandProfile = (data: Partial<BrandProfile>) => {
    if (!brandProfile) return;
    const updated = { ...brandProfile, ...data, updated_at: new Date().toISOString() };
    setBrandProfile(updated);
    localStorage.setItem('ncp_brand_profile', JSON.stringify(updated));
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
        login,
        signUpCreator,
        signUpBrand,
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
