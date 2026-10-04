import React from 'react';
import { ArrowRight, Mail, AtSign } from 'lucide-react';
import { LIME, INK, HEAVY, SERIF, PILL, WRAP, Marquee, SiteActions } from './SiteLayout';
import { NavLink } from '../../components/common/NavLink';

type PageProps = { actions: SiteActions };

// Hero amarelo padrão das páginas internas
const PageHero: React.FC<{ kicker: string; title: React.ReactNode; text: string; children?: React.ReactNode }> = ({ kicker, title, text, children }) => (
  <section className={`${LIME} px-4 sm:px-8 lg:px-14 pt-12 pb-14`}>
    <p className="text-[11px] font-bold uppercase tracking-wide">{kicker}</p>
    <h1 className={`${HEAVY} text-5xl sm:text-7xl leading-[0.95] mt-3 max-w-5xl`}>{title}</h1>
    <p className="mt-6 max-w-2xl text-base sm:text-lg font-medium">{text}</p>
    {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
  </section>
);

const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block bg-white px-3 -rotate-1 shadow-[5px_5px_0_#000]">{children}</span>
);

const NumberedGrid: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 border-t border-black pt-10">
    {items.map(([t, d], i) => (
      <article key={t}>
        <span className={`${HEAVY} text-6xl`}>{String(i + 1).padStart(2, '0')}</span>
        <h3 className={`${SERIF} text-2xl mt-3`}>{t}</h3>
        <p className="mt-2 text-sm text-black/70 leading-relaxed">{d}</p>
      </article>
    ))}
  </div>
);

const DarkSteps: React.FC<{ title: React.ReactNode; steps: [string, string][]; cta: React.ReactNode }> = ({ title, steps, cta }) => (
  <section className={`${INK} text-white`}>
    <div className={`${WRAP} py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12`}>
      <div className="lg:col-span-5 space-y-6">
        <h2 className={`${HEAVY} normal-case text-4xl sm:text-5xl`}>{title}</h2>
        {cta}
      </div>
      <ol className="lg:col-span-7 divide-y divide-white/15 border-y border-white/15">
        {steps.map(([t, d], i) => (
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
);

const FAQ: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <section className={`${WRAP} py-16 lg:py-24`}>
    <h2 className={`${SERIF} text-4xl sm:text-5xl mb-8`}>
      Perguntas <em>frequentes</em>
    </h2>
    <div className="border-t-2 border-black">
      {items.map(([q, a]) => (
        <details key={q} className="group border-b-2 border-black py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-lg">
            {q}
            <span className="text-2xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-sm text-black/70 leading-relaxed max-w-3xl">{a}</p>
        </details>
      ))}
    </div>
  </section>
);

const btnDark = `${PILL} bg-black text-white hover:bg-white hover:text-black`;
const btnWhite = `${PILL} bg-white hover:bg-black hover:text-[#DFE82A]`;
const btnLight = `${PILL} border-white bg-white text-black text-sm uppercase hover:bg-[#DFE82A] hover:border-[#DFE82A]`;

/* ---------------- SOBRE ---------------- */
export const SobrePage: React.FC<PageProps> = ({ actions }) => (
  <>
    <PageHero
      kicker="Sobre a Squad UGC"
      title={<>a gente acredita em <Box>creators reais</Box></>}
      text="Nascemos para profissionalizar o UGC e o live commerce: conectar marcas a creators que mostram, testam e vendem o produto ao vivo."
    />
    <section className={`${WRAP} py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12`}>
      <h2 className={`${SERIF} lg:col-span-5 text-4xl sm:text-5xl leading-tight`}>
        Do <em>bico</em> à <em>profissão</em>.
      </h2>
      <div className="lg:col-span-7 space-y-5 text-black/80 leading-relaxed">
        <p>
          Creators decidem compras todos os dias: numa live no TikTok, num unboxing no Reels, num review no grupo de
          clientes. Mesmo assim, essa influência raramente é remunerada de forma profissional.
        </p>
        <p>
          A Squad UGC organiza esse ecossistema. Para as marcas, oferecemos curadoria, logística de envio, aprovação de conteúdo
          e métricas em um só painel. Para as creators, campanhas claras, cachê via PIX e capacitação gratuita.
        </p>
        <p className="font-semibold">Sem promessas infladas: dados reais, contratos claros e conteúdo que converte.</p>
      </div>
    </section>
    <Marquee className={`${LIME} text-black`} items={['Transparência', 'Curadoria', 'Pagamento via PIX', 'Dados reais', 'Conteúdo que converte']} />
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-12`}>
        Nossos <em>valores</em>
      </h2>
      <NumberedGrid
        items={[
          ['Creator em primeiro lugar', 'Remuneração justa, briefing claro e prazos respeitados. Ninguém trabalha de graça aqui.'],
          ['Honestidade nos números', 'Mostramos métricas reais e fontes verificáveis. Nada de vaidade inflada.'],
          ['Resultado para a marca', 'Conteúdo pensado para vender: UGC com direito de uso em anúncios e acompanhamento de vendas.'],
        ]}
      />
    </section>
    <section className={`${LIME} px-4 py-16 text-center`}>
      <h2 className={`${HEAVY} text-4xl sm:text-6xl`}>bora <Box>fazer parte?</Box></h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={actions.openCreator} className={btnDark}>Sou creator</button>
        <button onClick={actions.openBrand} className={btnWhite}>Sou marca</button>
      </div>
    </section>
  </>
);

/* ---------------- PARA CREATORS ---------------- */
export const ParaCreatorsPage: React.FC<PageProps> = ({ actions }) => (
  <>
    <PageHero
      kicker="Para creators"
      title={<>seu talento <em className="italic underline decoration-[6px] underline-offset-[10px]">vale</em> <Box>dinheiro</Box></>}
      text="Você não precisa de milhões de seguidores. Se você segura a audiência numa live e mostra o produto de verdade, as marcas querem você."
    >
      <button onClick={actions.openCreator} className={btnWhite + ' text-lg'}>Quero Entrar no Squad</button>
    </PageHero>
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-12`}>
        O que você <em>ganha</em>
      </h2>
      <NumberedGrid
        items={[
          ['Produtos para testar', 'Receba lançamentos das marcas parceiras para apresentar em vídeo e nas suas lives.'],
          ['Lives pagas', 'Cachê fixo por live de venda, com roteiro, cupom e produto no carrinho. Pagamento via PIX.'],
          ['Comissão sobre vendas', 'Links, cupons e TikTok Shop para ganhar sobre tudo o que você vende ao vivo ou em vídeo.'],
          ['Squad Academy', 'Aulas gratuitas de roteiro de live, iluminação com celular, edição no CapCut e precificação de UGC.'],
          ['UGC sob demanda', 'Unboxing, review e tutoriais pagos por entrega aprovada, para você produzir entre uma live e outra.'],
          ['Suporte humano', 'Um time para tirar dúvidas sobre briefing, prazos e pagamentos.'],
        ]}
      />
    </section>
    <DarkSteps
      title={<>Como <em>funciona?</em></>}
      steps={[
        ['Inscreva-se', 'Cadastre seu perfil e portfólio no squad de creators.'],
        ['Curadoria', 'Avaliamos suas lives, seus vídeos e o engajamento da sua audiência.'],
        ['Campanhas', 'Seja convidado para campanhas compatíveis com o seu nicho.'],
        ['Produção', 'Crie vídeos e fotos seguindo o briefing da marca.'],
        ['Recebimento', 'Cachê liberado via PIX com total transparência.'],
      ]}
      cta={<button onClick={actions.openCreator} className={btnLight}>Quero participar</button>}
    />
    <FAQ
      items={[
        ['Preciso ter muitos seguidores?', 'Não. Avaliamos desempenho em live, qualidade do conteúdo e engajamento. Microcreators são muito bem-vindos.'],
        ['Quanto custa participar?', 'Nada. A Squad UGC é gratuita para creators.'],
        ['Como recebo o cachê?', 'Via PIX, após a aprovação do conteúdo pela marca.'],
        ['Preciso já fazer live?', 'Não é obrigatório, mas é o nosso foco. Quem ainda não faz live pode começar pelo UGC e aprender na Squad Academy.'],
        ['Posso recusar uma campanha?', 'Sim. Você só aceita campanhas que fazem sentido para você e sua audiência.'],
      ]}
    />
  </>
);

/* ---------------- PARA MARCAS ---------------- */
export const ParaMarcasPage: React.FC<PageProps> = ({ actions }) => (
  <>
    <PageHero
      kicker="Para marcas"
      title={<>sua marca nas mãos de quem <Box>decide a compra</Box></>}
      text="Monte um squad de creators que vendem ao vivo e produzem UGC. Envie produtos, aprove conteúdos e acompanhe as vendas de cada live em um só painel."
    >
      <button onClick={actions.openBrand} className={btnDark + ' text-lg'}>Candidate sua marca (3 vagas)</button>
      <NavLink view="auth" onNavigate={actions.onNavigate} className={btnWhite + ' text-lg'}>Acessar painel</NavLink>
    </PageHero>
    <Marquee className="bg-black text-white" items={['Live commerce', 'TikTok Shop', 'UGC com direito de uso', 'Product seeding', 'Afiliados']} />
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-12`}>
        Tudo em um <em>painel</em>
      </h2>
      <NumberedGrid
        items={[
          ['Base de creators qualificada', 'Mais de 800 creators de TikTok mapeados, com score, nicho, contato e marcação de quem já vende em live.'],
          ['Pipeline de campanha', 'Kanban de 14 etapas, do convite à publicação, com squads e seleção em massa.'],
          ['Lives de venda', 'Agenda de lives do squad com roteiro, cupom e produto no carrinho, e os melhores cortes viram anúncio.'],
          ['Aprovação de conteúdo', 'Mosaico de entregas com comentários e fluxo de aprovação.'],
          ['Afiliados & GMV', 'Links, cupons, vendas e comissões por creator.'],
          ['Relatórios', 'Por campanha, creator, plataforma, região e período, com exportação CSV.'],
        ]}
      />
    </section>
    <DarkSteps
      title={<>Programa <em>marcas fundadoras</em></>}
      steps={[
        ['Candidatura da marca', 'Insira produtos, categoria e objetivo da campanha.'],
        ['Seleção das creators', 'Apresentamos perfis compatíveis com a sua marca.'],
        ['Envio & produção', 'Envie os kits e acompanhe a gravação do conteúdo.'],
        ['Aprovação do material', 'Valide vídeos e fotos antes da liberação do cachê.'],
        ['Direitos & métricas', 'Use os vídeos em tráfego pago e acompanhe resultados.'],
      ]}
      cta={
        <button onClick={actions.openBrand} className={btnLight}>
          Quero uma das 3 vagas <ArrowRight className="w-4 h-4" />
        </button>
      }
    />
    <section className={`${WRAP} pt-16 lg:pt-24`}>
      <NavLink view="squad" onNavigate={actions.onNavigate} className="group w-full text-left border-2 border-black p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-[#DFE82A] transition-colors">
        <p className="md:col-span-2 text-[11px] font-bold uppercase tracking-wide">Academy</p>
        <h3 className={`${SERIF} md:col-span-8 text-3xl leading-tight`}>Pare de contratar creators. <em>Monte um squad.</em></h3>
        <span className={`${PILL} md:col-span-2 justify-center bg-black text-white text-sm`}>Ler <ArrowRight className="w-4 h-4" /></span>
      </NavLink>
    </section>
    <FAQ
      items={[
        ['O que é o programa de marcas fundadoras?', 'Um piloto com 3 marcas, condições especiais e acompanhamento próximo do nosso time.'],
        ['Posso usar os conteúdos em anúncios?', 'Sim. Os contratos incluem direito de uso de imagem para tráfego pago.'],
        ['Como os creators são selecionados?', 'Por score operacional, nicho, região e histórico de entregas, com pesos configuráveis pela sua marca.'],
      ]}
    />
  </>
);

/* ---------------- CONTATO ---------------- */
export const ContatoPage: React.FC<PageProps> = ({ actions }) => (
  <>
    <PageHero
      kicker="Contato"
      title={<>vamos <Box>conversar?</Box></>}
      text="Escolha o caminho certo e a gente responde rápido."
    />
    <section className={`${WRAP} py-16 lg:py-24 grid grid-cols-1 md:grid-cols-2 gap-6`}>
      {[
        ['Sou creator', 'Cadastre-se no squad e receba propostas de campanhas com cachê via PIX.', actions.openCreator, 'Cadastrar como Creator'],
        ['Sou marca', 'Monte seu squad de creators e acelere suas vendas com UGC e lives.', actions.openBrand, 'Cadastrar Marca'],
      ].map(([t, d, fn, cta]) => (
        <div key={t as string} className="border-2 border-black p-8 flex flex-col justify-between gap-6 hover:bg-[#DFE82A] transition-colors">
          <div>
            <h2 className={`${SERIF} text-3xl`}>{t as string}</h2>
            <p className="mt-2 text-sm text-black/70">{d as string}</p>
          </div>
          <button onClick={fn as () => void} className={`${PILL} self-start bg-black text-white`}>
            {cta as string} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ))}
    </section>
    <section className={`${INK} text-white`}>
      <div className={`${WRAP} py-14 flex flex-wrap gap-10`}>
        <a href="mailto:contato@squadra.app" className="flex items-center gap-3 hover:text-[#DFE82A]">
          <Mail className="w-5 h-5" /> contato@squadra.app
        </a>
        <span className="flex items-center gap-3">
          <AtSign className="w-5 h-5" /> @squadra
        </span>
      </div>
    </section>
  </>
);
