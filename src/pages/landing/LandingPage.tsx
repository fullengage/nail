import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { FoundingBrandModal } from '../../components/landing/FoundingBrandModal';
import { CreatorWaitlistModal } from '../../components/landing/CreatorWaitlistModal';
import { supabaseService } from '../../services/supabaseService';
import { Campaign, CreatorProfile } from '../../types/database';
import { formatNumber } from '../../lib/utils';
import {
  Sparkles,
  Crown,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Gift,
  Building2,
  UserPlus,
  Calendar,
  GraduationCap
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);

  // Dynamic public data from DB
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [camps, creators] = await Promise.all([
          supabaseService.getPublicCampaigns(),
          supabaseService.getFeaturedCreators(),
        ]);
        if (isMounted) {
          setPublicCampaigns(camps || []);
          setFeaturedCreators(creators || []);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados da landing:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Modals for Piloto */}
      <FoundingBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />

      <CreatorWaitlistModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (Copy & CTA) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>A 1ª Plataforma de Creator Commerce de Unhas do Brasil</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-foreground leading-[1.1]">
                Transforme seu talento em <span className="gradient-text">influência</span> e faturamento.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Conectamos <strong>Nail Designers & Manicures</strong> a marcas pioneiras de cosméticos. 
                Receba produtos para testar, feche parcerias com cachê garantido via PIX e monetize sua autoridade técnica.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => setIsCreatorModalOpen(true)}
                  className="w-full sm:w-auto shadow-lg shadow-primary/30"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-amber-300" />
                  Quero ser Nail Creator
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Building2 className="w-4 h-4 mr-2 text-amber-500" />
                  Programa Marcas Fundadoras
                </Button>
              </div>

              {/* Verified Market Data Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border/80 text-left">
                <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-primary">~70%</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    dos esmaltes no Brasil são aplicados em salão
                  </p>
                  <span className="text-[9px] text-muted-foreground/80 block mt-1">
                    Fonte: Fiabila / Beauty News (2025)
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-amber-500">3 Vagas</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Programa Piloto de Marcas Fundadoras
                  </p>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
                    Inscrições abertas
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">Até 45</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Nail Creators selecionadas para a 1ª fase
                  </p>
                  <span className="text-[9px] text-primary font-semibold block mt-1">
                    Curadoria em andamento
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (Hero Visual Composition) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=80"
                    alt="Nail Creator produzindo conteúdo"
                    className="w-full h-[450px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Floating Notification Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-card/95 backdrop-blur px-3.5 py-2 rounded-2xl shadow-xl border border-border flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      💰
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground font-semibold">Cachê Aprovado</p>
                      <p className="text-xs font-bold text-foreground">Repasse Direto via PIX</p>
                    </div>
                  </div>

                  {/* Bottom Info Card */}
                  <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/90 dark:bg-card/90 backdrop-blur border border-white/20 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">Creator Commerce Especializado</p>
                        <p className="text-[11px] text-primary font-semibold">UGC de Alta Conversão • Parcerias Reais</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION: DE MANICURE A CREATOR */}
      <section id="como-funciona-manicure" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="gold">Para a Profissional</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
            De Manicure a Creator Reconhecida
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Você não precisa de milhões de seguidores. Se você tem técnica refinada e produz conteúdo real de unhas, as marcas querem investir no seu talento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated" className="space-y-4 text-left border-primary/20">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">Receba Produtos Gratuitos</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Receba em casa os lançamentos de esmaltes, géis construtores, cabines LED e ferramentas profissionais sem custo para testar e avaliar.
            </p>
          </Card>

          <Card variant="elevated" className="space-y-4 text-left border-primary/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">Cachês Garantidos & UGC</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Grave vídeos de unboxing, aplicação e tutoriais de nail art. Receba cachês diretos na sua conta bancária a cada entrega validada.
            </p>
          </Card>

          <Card variant="elevated" className="space-y-4 text-left border-primary/20">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">Comissões de Afiliada</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tenha links e cupons exclusivos para indicar seus produtos favoritos e lucrar comissões sobre as vendas geradas pela sua audiência.
            </p>
          </Card>
        </div>

        {/* 5 Steps for Creator */}
        <div className="mt-12 p-8 rounded-3xl bg-card border border-border/80 shadow-md">
          <h4 className="text-center font-bold text-sm uppercase tracking-wider text-muted-foreground mb-8">
            Como Funciona o Ciclo da Creator
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 text-center">
            {[
              { step: '1', title: 'Inscreva-se', desc: 'Preencha seus dados na lista de espera prioritária.' },
              { step: '2', title: 'Curadoria', desc: 'Avaliamos sua técnica, portfólio e engajamento.' },
              { step: '3', title: 'Campanhas', desc: 'Seja convidada para as campanhas das marcas piloto.' },
              { step: '4', title: 'Produção', desc: 'Crie vídeos e fotos com as diretrizes do briefing.' },
              { step: '5', title: 'Recebimento', desc: 'Cachê liberado via PIX com total transparência.' },
            ].map((item) => (
              <div key={item.step} className="space-y-2 relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-extrabold flex items-center justify-center mx-auto shadow-md">
                  {item.step}
                </div>
                <h5 className="font-bold text-sm text-foreground">{item.title}</h5>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED CAMPAIGNS SHOWCASE */}
      <section id="campanhas" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="gold">Oportunidades em Aberto</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
              Campanhas em Destaque
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Oportunidades reais com marcas parceiras do ecossistema.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsCreatorModalOpen(true)}>
            Quero Participar <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>

        {/* Dynamic Display: Real campaigns from DB or Honest Empty State */}
        {isLoadingData ? (
          <div className="py-12 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 animate-spin text-primary" />
            <span>Consultando oportunidades abertas...</span>
          </div>
        ) : publicCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicCampaigns.slice(0, 3).map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                onApply={() => setIsCreatorModalOpen(true)}
              />
            ))}
          </div>
        ) : (
          <Card variant="elevated" className="p-10 text-center space-y-4 border-dashed border-2 border-border/80">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-foreground">A primeira campanha abre em breve</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Estamos finalizando o onboarding das 3 marcas fundadoras do piloto. Cadastre-se na lista de espera para ser notificada assim que as primeiras vagas forem publicadas.
              </p>
            </div>
            <Button onClick={() => setIsCreatorModalOpen(true)} className="shadow-md">
              <Sparkles className="w-4 h-4 mr-2" />
              Entrar na Lista de Espera de Creators
            </Button>
          </Card>
        )}
      </section>

      {/* 4. VALUE PROPOSITION: PARA MARCAS */}
      <section id="como-funciona-marcas" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6 text-left">
              <Badge variant="gold">Para Empresas & Marcas de Cosméticos</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight">
                Sua marca nas mãos de quem realmente <span className="gradient-text">decide a compra</span> no salão.
              </h2>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Pare de queimar verba com influenciadores genéricos. Encontre manicures especialistas por cidade, técnica (gel, fibra, nail art) e volume de audiência para criar UGC de alta conversão.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/90">Curadoria de manicures reais e verificadas</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/90">Direitos de imagem de UGC para anúncios</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/90">Gestão de entregas e moderação centralizada</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/90">Métricas de engajamento, cliques e vendas</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="shadow-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Candidate sua Marca para o Piloto (3 Vagas)
                </Button>
              </div>
            </div>

            {/* Brand Process Steps */}
            <div className="lg:col-span-5 space-y-3">
              {[
                { n: '1', title: 'Candidatura da Marca', text: 'Insira produtos, categoria e objetivo da campanha.' },
                { n: '2', title: 'Seleção das Creators', text: 'Apresentamos perfis compatíveis com sua marca.' },
                { n: '3', title: 'Envio & Produção', text: 'Envie os kits e acompanhe a gravação do conteúdo.' },
                { n: '4', title: 'Aprovação do Material', text: 'Valide vídeos e fotos antes da liberação do cachê.' },
                { n: '5', title: 'Direitos & Métricas', text: 'Use os vídeos em tráfego pago e acompanhe resultados.' },
              ].map((step) => (
                <div key={step.n} className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.n}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{step.title}</p>
                    <p className="text-[11px] text-white/60">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOP CREATORS VITRINE (Strict Rule: Only show if DB has creators with is_featured=true and consent) */}
      {featuredCreators.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <Badge variant="purple">Nossos Talentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
              Conheça Nossas Top Nail Creators
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Profissionais apaixonadas por unhas com audiências engajadas prontas para a sua campanha.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCreators.slice(0, 4).map((creator) => (
              <Card key={creator.id} variant="elevated" className="text-left space-y-3 p-4 group">
                <div className="relative h-48 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={creator.portfolio_cover_url || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500'}
                    alt={creator.professional_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="gold" size="sm">
                      {formatNumber(creator.instagram_followers)} seguidores
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground truncate">{creator.professional_name}</h4>
                  <p className="text-xs text-primary font-semibold">{creator.instagram}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{creator.city}/{creator.state}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {(creator.specialties || []).slice(0, 2).map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] bg-secondary rounded-md text-secondary-foreground font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 6. NAIL ACADEMY SECTION (Honest "Em Breve" Card) */}
      <section id="academy" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-left">
              <Badge variant="gold">Capacitação Gratuita — Em Breve</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
                Nail Academy: Aprenda a Criar Conteúdo que as Marcas Amam
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Estamos estruturando videoaulas e guias práticos com técnicas de iluminação caseira com celular, enquadramento das mãos, roteiros magnéticos de Reels, edição ágil no CapCut e como precificar seus conteúdos UGC.
              </p>
              <div className="pt-2">
                <Button onClick={() => setIsCreatorModalOpen(true)}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Quero Acesso Antecipado à Academy
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4 p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-sm text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                ✨
              </div>
              <h4 className="text-sm font-bold text-foreground">Acesso 100% Gratuito</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As creators inscritas no piloto terão acesso livre e antecipado aos primeiros módulos de capacitação prática.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Pronta para dar o próximo passo na sua carreira de unhas?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Junte-se ao piloto do NAIL CLUB PRO e conecte-se hoje mesmo a marcas que valorizam sua técnica e sua autoridade.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => setIsCreatorModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Entrar na Lista de Espera de Creators
          </Button>
          <Button size="lg" variant="outline" onClick={() => setIsBrandModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-2 text-amber-500" />
            Candidate sua Marca (3 Vagas)
          </Button>
        </div>
      </section>

    </div>
  );
};
