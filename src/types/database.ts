export type UserRole = 
  | 'admin_master' 
  | 'brand_admin' 
  | 'manager' 
  | 'analyst' 
  | 'creator' 
  | 'brand' 
  | 'admin' 
  | 'brand_manager';

export type UserStatus = 'pending' | 'active' | 'suspended';

export type PipelineStage = 
  | 'discovery'
  | 'invited'
  | 'applied'
  | 'screening'
  | 'squad_approved'
  | 'briefing_sent'
  | 'shipping'
  | 'delivered'
  | 'producing'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'published'
  | 'completed';

export interface ScoreWeights {
  engagement: number;     // ex: 30
  audience: number;       // ex: 20
  nicheMatch: number;     // ex: 25
  deliveryHistory: number;// ex: 15
  quality: number;        // ex: 10
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

export interface RetailPoint {
  id: string;
  organization_id?: string;
  name: string;
  trade_name?: string;
  network?: string;
  cnpj?: string;
  type: 'cosmetics' | 'pharmacy' | 'salon' | 'perfumery' | 'distributor';
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  status: 'active' | 'lead' | 'inactive';
  created_at: string;
}

export interface Shipment {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator_name?: string;
  creator_avatar?: string;
  tracking_code: string;
  carrier: 'Correios' | 'Melhor Envio' | 'Loggi' | 'Total Express';
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered';
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
}

export interface ContentReviewItem {
  id: string;
  content_id: string;
  author_name: string;
  author_role: string;
  comment: string;
  created_at: string;
}

export interface SourceCounts {
  manicures: number;
  tiktok: number;
  instagram: number;
  retail_points: number;
  unique_creators: number;
  tiktok_mined?: number;
  retail_active?: number;
  contact?: number;
  tiktok_shop?: number;
}


export type CampaignType = 
  | 'product_seeding'
  | 'paid_content'
  | 'ugc'
  | 'affiliate'
  | 'live_commerce';

export type CommissionType = 'fixed' | 'percentage' | 'product_only';

export type CampaignStatus = 
  | 'draft'
  | 'pending_approval'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ParticipantStatus = 
  | 'selected'
  | 'product_sent'
  | 'producing'
  | 'submitted'
  | 'approved'
  | 'completed';

export type ContentType = 
  | 'instagram_post'
  | 'instagram_reel'
  | 'story'
  | 'tiktok'
  | 'youtube'
  | 'live'
  | 'ugc';

export type SubmissionStatus = 'submitted' | 'revision_requested' | 'approved';

export type EarningType = 'campaign' | 'affiliate' | 'bonus';

export type EarningStatus = 'pending' | 'approved' | 'paid';

export interface Profile {
  id: string;
  auth_user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: UserStatus;
  terms_accepted_at?: string;
  privacy_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  professional_name: string;
  bio: string;
  city: string;
  state: string;
  instagram: string;
  tiktok: string;
  youtube?: string;
  instagram_followers: number;
  tiktok_followers: number;
  youtube_followers?: number;
  years_experience: number;
  specialties: string[];
  techniques: string[];
  accepts_product_campaigns: boolean;
  accepts_paid_campaigns: boolean;
  accepts_affiliate_campaigns: boolean;
  accepts_live_campaigns: boolean;
  portfolio_cover_url?: string;
  profile_completion: number;
  verification_status: 'verified' | 'pending' | 'unverified';
  operational_score?: number;
  engagement_rate?: number;
  tags?: string[];
  email?: string;
  phone?: string;
  media_kit_url?: string;
  is_featured?: boolean;
  featured_consent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorPortfolioItem {
  id: string;
  creator_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption: string;
  technique?: string;
  is_featured: boolean;
  likes_count?: number;
  created_at: string;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  brand_name: string;
  cnpj: string;
  description: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  logo_url: string;
  cover_url?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  state: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string;
  category: string; // 'esmaltes' | 'gel' | 'alongamento' | 'acessorios' | 'equipamentos' | 'ferramentas' | 'cuidados' | 'cursos'
  image_url: string;
  website_url?: string;
  product_url?: string;
  price?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignRequirements {
  id: string;
  campaign_id: string;
  min_followers: number;
  state?: string;
  city?: string;
  required_specialties: string[];
  requires_instagram: boolean;
  requires_tiktok: boolean;
  requires_video: boolean;
  requires_live: boolean;
}

export interface Campaign {
  id: string;
  brand_id: string;
  brand?: BrandProfile;
  title: string;
  slug: string;
  description: string;
  objective: string;
  campaign_type: CampaignType;
  cover_url: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  creator_slots: number;
  occupied_slots?: number;
  budget: number;
  commission_type: CommissionType;
  commission_value: number;
  requirements_text: string;
  deliverables_text: string;
  status: CampaignStatus;
  requirements?: CampaignRequirements;
  products?: Product[];
  created_at: string;
  updated_at: string;
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator?: CreatorProfile & { user?: Profile };
  campaign?: Campaign;
  message: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at?: string;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator?: CreatorProfile & { user?: Profile };
  campaign?: Campaign;
  status: ParticipantStatus;
  stage?: PipelineStage;
  operational_score?: number;
  /** cachê combinado com este creator nesta campanha (R$) */
  fee?: number;
  notes?: string;
  tracking_code?: string;
  product_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentSubmission {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator?: CreatorProfile & { user?: Profile };
  campaign?: Campaign;
  content_type: ContentType;
  media_url: string;
  published_url: string;
  caption: string;
  status: SubmissionStatus;
  submitted_at: string;
  approved_at?: string;
  metrics?: ContentMetrics;
  reviews?: ContentReviewItem[];
}

export interface ContentMetrics {
  id: string;
  submission_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  sales: number;
  revenue: number;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  campaign_id: string;
  creator_id: string;
  product_id: string;
  product?: Product;
  campaign?: Campaign;
  creator?: CreatorProfile;
  code: string;
  url: string;
  commission_percentage: number;
  clicks: number;
  orders: number;
  revenue: number;
  commission_generated: number;
  created_at: string;
}

export interface AffiliateProposal {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
  description: string;
  product_name: string;
  product_image_url: string;
  product_price: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  default_coupon: string;
  store_url: string;
  rules: string;
  benefits: string;
  status: 'active' | 'paused';
  total_affiliates_count: number;
  total_sales_count: number;
  created_at: string;
}

export interface AffiliateApplication {
  id: string;
  proposal_id: string;
  proposal_title: string;
  creator_id: string;
  creator?: CreatorProfile;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_coupon?: string;
  created_at: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  campaign_id?: string;
  campaign_title?: string;
  earning_type: EarningType;
  amount: number;
  status: EarningStatus;
  created_at: string;
  paid_at?: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  content: string;
  duration_minutes: number;
  position: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  category: string;
  published: boolean;
  instructor_name: string;
  instructor_avatar: string;
  lessons: CourseLesson[];
  total_duration_hours?: number;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  creator_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'application' | 'campaign' | 'payment' | 'system' | 'content';
  read: boolean;
  link?: string;
  created_at: string;
}

export interface BrandLead {
  id?: string;
  name: string;
  company: string;
  role?: string;
  email: string;
  whatsapp: string;
  category?: string;
  sales_channel?: string;
  budget_tier?: string;
  origin?: string;
  notes?: string;
  created_at?: string;
}

export interface CreatorWaitlistEntry {
  id?: string;
  name: string;
  city?: string;
  state?: string;
  techniques?: string[];
  instagram: string;
  whatsapp: string;
  created_at?: string;
}
