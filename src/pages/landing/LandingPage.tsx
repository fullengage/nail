import React, { useState, useEffect } from 'react';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { supabaseService } from '../../services/supabaseService';
import { Campaign, CreatorProfile } from '../../types/database';
import { formatNumber } from '../../lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LIME, INK, HEAVY, SERIF, PILL, Marquee, SiteActions } from '../site/SiteLayout';
import { NavLink } from '../../components/common/NavLink';

// Home do site institucional (estilo theugcclub.com)
export const LandingPage: React.FC<{ actions: SiteActions }> = ({ actions }) => {
  const { openCreator, openBrand, onNavigate } = actions;
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([supabaseService.getPublicCampaigns(), supabaseService.getFeaturedCreators()])
      .then(([camps, creators]) => {
        if (!isMounted) return;
        setPublicCampaigns(camps || []);
        setFeaturedCreators(creators || []);
      })
      .catch((err) => console.warn('Erro ao carregar dados da landing:', err))
      .finally(() => isMounted && setIsLoadingData(false));
    return () => {
      isMounted = false;
    };
  }, []);

  // Garante que a Home sempre exibe campanhas ativas e creators de destaque reais (sem lista de espera)
  // só campanhas reais publicadas (nada de exemplo aparecendo como se fosse real)
  const displayCampaigns = publicCampaigns;
  const displayCreators = featuredCreators;

  return (
    <div>

      {/* 1. HERO */}
      <Marquee className="bg-black text-white" items={['entre para o squad hoje', 'transforme suas lives e vídeos em renda de verdade']} />
      <section className={`${LIME} px-4 sm:px-8 lg:px-14 pt-8 pb-12 lg:pb-16`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <h1 className={`${HEAVY} text-5xl sm:text-7xl lg:text-[6.5rem] xl:text-[7.5rem] leading-[0.95]`}>
              ajudando <em className="italic underline decoration-[6px] underline-offset-[10px]">creators</em>
              <br />
              a vender
              <br />
              <span className="inline-block bg-white px-4 mt-4 -rotate-2 shadow-[6px_6px_0_#000]">ao vivo</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base sm:text-lg font-medium text-black/90">
              Conectamos <strong>creators de UGC e live commerce</strong> a marcas que querem vender mais. Receba produtos, faça lives
              e vídeos com briefing claro, ganhe cachê via PIX e comissão sobre cada venda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={openCreator} className={`${PILL} bg-white text-lg sm:text-xl hover:bg-black hover:text-[#DFE82A] transition-all`}>
                Quero entrar no squad
              </button>
              <button onClick={openBrand} className={`${PILL} text-lg sm:text-xl hover:bg-black hover:text-[#DFE82A] transition-all`}>
                Quero Contratar Creators
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px]">
              {/* Moldura editorial com sombra brutalista */}
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-black shadow-[10px_10px_0_#000] bg-[#E2703A]">
                <img
                  src="/images/hero-creator.jpg"
                  alt="Creator de sucesso com notebook e campanhas ativas"
                  className="w-full h-auto object-cover aspect-[3/4] block"
                  loading="eager"
                />
              </div>

              {/* Sticker flutuante superior: Ideia / UGC */}
              <div className="absolute -top-3 sm:-top-4 -left-3 sm:-left-4 bg-white border-2 border-black px-3.5 py-1.5 rounded-full shadow-[4px_4px_0_#000] flex items-center space-x-1.5 -rotate-3 text-xs font-bold text-black select-none">
                <span className="text-base">💡</span>
                <span>UGC & Lives de Venda</span>
              </div>

              {/* Sticker flutuante inferior: Sucesso / PIX */}
              <div className="absolute -bottom-3 sm:-bottom-4 -right-2 sm:-right-4 bg-black text-[#DFE82A] border-2 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0_#000] flex items-center space-x-2 rotate-2 text-xs font-bold select-none">
                <span className="text-base">👍</span>
                <div>
                  <p className="leading-none text-white text-[10px] uppercase font-normal">Cachê + Comissão</p>
                  <p className="leading-tight text-[#DFE82A] font-extrabold text-sm">Direto via PIX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* sub-nav estilo categorias */}
      <nav className="flex flex-wrap gap-x-8 gap-y-2 px-4 sm:px-8 lg:px-14 py-4 text-[11px] font-bold uppercase tracking-wide border-b border-black/10">
        {[
          ['para creators', 'para-creators'],
          ['para marcas', 'para-marcas'],
          ['sobre nós', 'sobre'],
          ['contato', 'contato'],
        ].map(([t, v]) => (
          <NavLink key={v} view={v} onNavigate={onNavigate} className="uppercase hover:underline">
            {t}
          </NavLink>
        ))}
      </nav>

      {/* 2. NÚMEROS + PROPOSTA (layout editorial) */}
      <section id="creators" className="max-w-6xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
        <h2 className={`${SERIF} text-4xl sm:text-5xl leading-tight max-w-3xl`}>
          Da live amadora à <em>creator profissional</em>: o processo em 5 passos
        </h2>
        <p className="mt-4 max-w-2xl text-black/70">
          Você não precisa de milhões de seguidores. Se você sabe segurar a audiência numa live e mostrar o produto de verdade,
          as marcas querem investir no seu talento.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 border-t border-black pt-10">
          {[
            ['Receba produtos para testar', 'Lançamentos de beleza, moda, casa, fitness e tech para apresentar nos seus vídeos e lives.'],
            ['Cachê por live e por vídeo', 'Faça lives de venda, unboxing, review e tutorial. Receba cachê via PIX a cada entrega validada.'],
            ['Comissão sobre as vendas', 'Links, cupons e carrinho no TikTok Shop para ganhar sobre tudo o que você vende ao vivo.'],
          ].map(([t, d], i) => (
            <article key={t}>
              <span className={`${HEAVY} text-6xl`}>0{i + 1}</span>
              <h3 className={`${SERIF} text-2xl mt-3`}>{t}</h3>
              <p className="mt-2 text-sm text-black/70 leading-relaxed">{d}</p>
            </article>
          ))}
        </div>

        <ol className="mt-16 grid grid-cols-1 sm:grid-cols-5 border-2 border-black">
          {[
            ['Inscreva-se', 'Cadastre seu perfil e portfólio no squad de creators.'],
            ['Curadoria', 'Avaliamos seus vídeos, nicho e engajamento real.'],
            ['Campanhas', 'Receba propostas e kits de marcas com briefing claro.'],
            ['Produção', 'Faça lives ou vídeos autorais seguindo as diretrizes.'],
            ['Recebimento', 'Cachê liberado via PIX com total transparência.'],
          ].map(([t, d], i) => (
            <li key={t} className={`p-5 border-black ${i < 4 ? 'border-b-2 sm:border-b-0 sm:border-r-2' : ''} ${i === 0 ? LIME : ''}`}>
              <p className="text-[11px] font-bold uppercase">Passo {i + 1}</p>
              <p className="font-bold mt-1">{t}</p>
              <p className="text-xs text-black/70 mt-1">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            ['18.000+', 'creators e manicures mapeadas na base', 'Perfis auditados para TikTok e Instagram'],
            ['100%', 'Campanhas com cachê garantido via PIX', 'Pagamento ágil na aprovação'],
            ['R$ 0', 'para creators participarem do squad', 'Sem mensalidade nem taxa de inscrição'],
          ].map(([n, t, s]) => (
            <div key={n}>
              <p className={`${HEAVY} normal-case text-5xl`}>{n}</p>
              <p className="text-sm font-medium mt-1">{t}</p>
              <p className="text-[10px] uppercase tracking-wide text-black/50 mt-1">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <Marquee className={`${LIME} text-black`} items={['Live commerce', 'TikTok Shop', 'Unboxing', 'Review', 'Tutorial', 'Afiliados', 'UGC para anúncios']} />

      {/* Academy: chamada para o artigo do squad */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 lg:pt-24">
        <p className="text-[11px] font-bold uppercase tracking-wide mb-4">Do nosso Academy</p>
        <NavLink view="squad" onNavigate={onNavigate} className="w-full text-left grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b-2 border-black pb-8 group">
          <h2 className={`${SERIF} md:col-span-9 text-4xl sm:text-5xl leading-tight group-hover:underline`}>
            Pare de contratar creators. <em>Monte um squad.</em>
          </h2>
          <span className={`${PILL} md:col-span-3 justify-center ${LIME} text-sm`}>Ler artigo <ArrowRight className="w-4 h-4" /></span>
        </NavLink>
      </section>

      {/* 3. CAMPANHAS EM DESTAQUE (Sempre com oportunidades ativas reais) */}
      <section id="campanhas" className="max-w-6xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block mb-1">
              Oportunidades em Aberto
            </span>
            <h2 className={`${SERIF} text-4xl sm:text-5xl`}>
              Campanhas em <em>destaque</em>
            </h2>
          </div>
          <button onClick={openCreator} className={`${PILL} ${LIME} text-sm hover:bg-black hover:text-[#DFE82A] transition-all`}>
            Quero participar <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {displayCampaigns.length === 0 && !isLoadingData ? (
          <p className="p-6 border-2 border-dashed border-black/30 rounded-2xl text-center font-semibold">Nenhuma campanha aberta neste momento. Cadastre-se para ser avisado(a) quando abrir a próxima.</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayCampaigns.slice(0, 3).map((camp) => (
            <CampaignCard key={camp.id} campaign={camp} onApply={openCreator} />
          ))}
        </div>
        )}
      </section>

      {/* 4. PARA MARCAS (bloco grafite, como o "Who are we?") */}
      <section id="marcas" className={`${INK} text-white`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-5">
            <h2 className={`${HEAVY} normal-case text-4xl sm:text-5xl`}>
              Para <em>marcas?</em>
            </h2>
            <p className="text-white/80 leading-relaxed">
              Sua marca ao vivo com quem realmente <em>faz a venda acontecer</em>. Pare de queimar verba com influenciadores
              genéricos: monte um squad de creators por nicho, cidade e audiência para fazer lives de venda e UGC de{' '}
              <strong>alta conversão</strong>.
            </p>
            <ul className="space-y-2 text-sm text-white/90">
              {['Curadoria de creators reais e verificados', 'Direitos de imagem de UGC para anúncios', 'Gestão de entregas e moderação centralizada', 'Métricas de engajamento, cliques e vendas'].map((t) => (
                <li key={t} className="flex gap-2"><span className="text-[#DFE82A]">●</span>{t}</li>
              ))}
            </ul>
            <button onClick={openBrand} className={`${PILL} border-white bg-white text-black text-sm uppercase hover:bg-[#DFE82A] hover:border-[#DFE82A] transition-all`}>
              Cadastrar Minha Marca
            </button>
          </div>
          <ol className="lg:col-span-6 divide-y divide-white/15 border-y border-white/15">
            {[
              ['Candidatura da marca', 'Insira produtos, categoria e objetivo da campanha.'],
              ['Seleção das creators', 'Apresentamos perfis compatíveis com sua marca.'],
              ['Envio & produção', 'Envie os kits e acompanhe a gravação do conteúdo.'],
              ['Aprovação do material', 'Valide vídeos e fotos antes da liberação do cachê.'],
              ['Direitos & métricas', 'Use os vídeos em tráfego pago e acompanhe resultados.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5 py-4">
                <span className="text-[#DFE82A] font-black text-xl w-8">0{i + 1}</span>
                <div>
                  <p className={`${SERIF} text-lg`}>{t}</p>
                  <p className="text-xs text-white/60">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. TOP CREATORS */}
      {displayCreators.length > 0 && (
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block mb-1">
              Comunidade Verificada
            </span>
            <h2 className={`${SERIF} text-4xl sm:text-5xl`}>
              Conheça nossos <em>top creators</em>
            </h2>
          </div>
          <button onClick={openCreator} className={`${PILL} bg-black text-white text-sm hover:bg-[#DFE82A] hover:text-black transition-all`}>
            Ver Todos os Creators <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayCreators.map((c) => (
            <article key={c.id} className="group cursor-pointer" onClick={openCreator}>
              <div className="aspect-[4/5] overflow-hidden bg-black/5 rounded-2xl border-2 border-black shadow-[4px_4px_0_#000]">
                <img
                  src={c.portfolio_cover_url || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500'}
                  alt={c.professional_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className={`${SERIF} text-xl mt-3 truncate font-bold text-foreground`}>{c.professional_name}</h3>
              <p className="text-xs font-bold uppercase mt-1 text-black/70">
                {c.instagram || c.tiktok} · {formatNumber(c.tiktok_followers || c.instagram_followers || 24000)} seguidores
              </p>
            </article>
          ))}
        </div>
      </section>
      )}

      {/* 6. ACADEMY */}
      <section id="academy" className="bg-[#F0EFEC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wide">Capacitação Gratuita para o Squad</p>
            <h2 className={`${SERIF} text-4xl sm:text-5xl`}>
              Squad <em>Academy</em>
            </h2>
            <p className="text-sm text-black/70 max-w-2xl leading-relaxed">
              Videoaulas e guias práticos: roteiro de live que vende, iluminação com celular, ganchos para Reels e TikTok, edição no
              CapCut e como precificar UGC. Acesso 100% liberado para creators cadastrados no squad.
            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <button onClick={openCreator} className={`${PILL} ${LIME} text-sm uppercase hover:bg-black hover:text-[#DFE82A] transition-all`}>
              Acessar Treinamento & Aulas
            </button>
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section className={`${LIME} px-4 sm:px-8 lg:px-14 py-16 lg:py-24 text-center`}>
        <h2 className={`${HEAVY} text-4xl sm:text-6xl leading-none`}>
          pronto para o <span className="inline-block bg-white px-3 rotate-1">próximo passo?</span>
        </h2>
        <p className="mt-6 max-w-xl mx-auto font-medium">
          Entre no squad e conecte-se hoje mesmo a marcas que pagam pelo que você faz de melhor: vender ao vivo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={openCreator} className={`${PILL} bg-black text-white hover:bg-white hover:text-black transition-all`}>
            Quero Entrar no Squad
          </button>
          <button onClick={openBrand} className={`${PILL} bg-white hover:bg-black hover:text-white transition-all`}>
            Cadastrar Minha Marca
          </button>
        </div>
      </section>
    </div>
  );
};
