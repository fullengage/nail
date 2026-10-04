import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LIME, INK, HEAVY, SERIF, PILL, WRAP, Marquee, SiteActions } from './SiteLayout';
import { NavLink } from '../../components/common/NavLink';

// Artigo "Academy para marcas": por que montar um squad próprio de creators.
// Texto autoral da Squad UGC (pauta inspirada no tema "comunidades de creators").

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className={`${SERIF} text-3xl sm:text-4xl leading-tight mt-16 mb-5`}>{children}</h2>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-base sm:text-lg leading-relaxed text-black/80 mb-5">{children}</p>
);

export const ArtigoSquadPage: React.FC<{ actions: SiteActions }> = ({ actions }) => (
  <article>
    <header className={`${LIME} px-4 sm:px-8 lg:px-14 pt-12 pb-14`}>
      <p className="text-[11px] font-bold uppercase tracking-wide">Academy para marcas · leitura de 6 min</p>
      <h1 className={`${HEAVY} text-5xl sm:text-7xl leading-[0.95] mt-3 max-w-5xl`}>
        pare de contratar creators. <span className="inline-block bg-white px-3 -rotate-1 shadow-[5px_5px_0_#000]">monte um squad.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-base sm:text-lg font-medium">
        Como um time fixo de creators aprovados pela sua marca transforma UGC em rotina: mais vídeos, menos retrabalho e
        criativos que aguentam o ritmo dos anúncios.
      </p>
    </header>

    <div className={`${WRAP} py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12`}>
      <div className="lg:col-span-8">
        <P>
          Ninguém para o dedo no feed por causa de um logo. O que segura a atenção é gente de verdade mostrando o produto na
          mão, com sotaque, bancada bagunçada e opinião sincera. É por isso que o conteúdo gerado por creators e clientes, o
          famoso <strong>UGC</strong>, virou a matéria-prima dos anúncios que mais convertem.
        </P>
        <P>
          Quem já tentou produzir UGC com frequência conhece o outro lado: caçar perfis um a um, negociar cada vídeo, repetir o
          briefing, esperar semanas e, no fim, receber um material que não tem a cara da marca. Funciona uma vez. Não escala.
        </P>
        <P>
          A virada acontece quando a marca deixa de comprar vídeos avulsos e passa a ter <em>o próprio time</em>. Na Squad UGC a
          gente chama isso de squad.
        </P>

        <H2>Afinal, o que é um squad de creators?</H2>
        <P>
          É um grupo fechado de creators escolhidos pela marca, que já conhece o produto, o tom de voz e as regras do jogo. Em
          vez de recomeçar do zero a cada campanha, você dispara uma demanda e o squad entrega: unboxing, tutorial, antes e
          depois, review, depoimento.
        </P>
        <P>
          Pense menos em "campanha de influência" e mais em <strong>uma linha de produção de conteúdo autêntico</strong>, que
          abastece orgânico, mídia paga, e-commerce e até o material de ponto de venda.
        </P>

        <H2>Por que isso muda o jogo para quem quer escala</H2>
        <P>
          Os algoritmos recompensam volume e variedade de criativos, e um anúncio cansa em poucos dias. Quem depende de uma ou
          duas produções por mês fica sem munição. Com um squad, a conta muda:
        </P>
        <ul className="border-t-2 border-black mb-6">
          {[
            ['Ritmo', 'Uma demanda vira vários vídeos em poucos dias, porque o time já está aquecido e aprovado.'],
            ['Consistência', 'Todo mundo trabalha com o mesmo guia de marca, então o conteúdo varia na forma, não na mensagem.'],
            ['Teste contínuo', 'Mais variações de gancho, roteiro e formato para descobrir rápido o que vende e escalar a verba.'],
            ['Menos atrito', 'Convite, envio de produto, aprovação e pagamento no mesmo fluxo, sem planilha paralela.'],
          ].map(([t, d]) => (
            <li key={t} className="border-b-2 border-black py-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-black uppercase text-sm">{t}</span>
              <span className="sm:col-span-3 text-black/80">{d}</span>
            </li>
          ))}
        </ul>

        <H2>Como isso aparece na prática</H2>
        <P>
          Três cenários comuns entre as marcas com quem conversamos (ilustrativos, para você enxergar o modelo
          aplicado):
        </P>
        <div className="space-y-6 mb-6">
          {[
            ['Lançamento com lives em sequência', 'Em vez de uma grande influenciadora, 20 creators do squad recebem o produto e fazem lives de venda na mesma semana. Os melhores trechos viram cortes para anúncio, e a marca descobre rápido qual argumento converte.'],
            ['Produto que precisa de prova', 'Um produto só convence quando alguém mostra o resultado. O squad grava o "dia 1" e o "dia 30" de uso real, e o vídeo vira o anúncio principal da campanha.'],
            ['Vitrine permanente no TikTok Shop', 'Creators afiliados do squad mantêm o produto no carrinho das lives com cupom próprio. Cada live vira venda rastreável por creator.'],
          ].map(([t, d], i) => (
            <div key={t} className="flex gap-5">
              <span className={`${HEAVY} text-4xl shrink-0`}>0{i + 1}</span>
              <div>
                <h3 className={`${SERIF} text-xl`}>{t}</h3>
                <p className="text-sm text-black/70 leading-relaxed mt-1">{d}</p>
              </div>
            </div>
          ))}
        </div>
        <P>
          O ponto em comum: o squad não é só uma fonte de vídeo. Ele cria uma rede de pessoas que conhecem, usam e defendem a
          marca, e isso reduz custo, gera confiança e melhora o resultado de mídia ao mesmo tempo.
        </P>
      </div>

      <aside className="lg:col-span-4">
        <div className={`${INK} text-white p-6 lg:sticky lg:top-24 space-y-4`}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#DFE82A]">Resumo rápido</p>
          <ul className="space-y-3 text-sm text-white/85">
            <li>• UGC converte porque parece gente, não propaganda.</li>
            <li>• Vídeo avulso não escala; time fixo sim.</li>
            <li>• Squad = creators aprovados + briefing padrão + fluxo único.</li>
            <li>• Mais criativos, testes mais rápidos, custo menor por vídeo.</li>
          </ul>
          <button onClick={actions.openBrand} className={`${PILL} border-white bg-white text-black text-sm hover:bg-[#DFE82A] hover:border-[#DFE82A]`}>
            Quero montar meu squad
          </button>
        </div>
      </aside>
    </div>

    <Marquee className="bg-black text-white" items={['Monte', 'Convoque', 'Aprove', 'Escale']} />

    {/* Passo a passo na Squad UGC */}
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-4`}>
        Seu squad na <em>Squad UGC</em>, em 3 movimentos
      </h2>
      <p className="text-black/70 max-w-2xl mb-12">Tudo acontece no mesmo painel, do primeiro convite ao relatório de vendas.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-black">
        {[
          ['Monte o time', ['Defina o perfil ideal: nicho, formato (live, vídeo, foto), cidade e audiência.', 'Filtre a base por score operacional e engajamento.', 'Publique o link de inscrição ou convide creators específicos.']],
          ['Aprove quem combina', ['Veja portfólio, métricas e histórico de entregas.', 'Aprove em massa e organize por tags e squads.', 'Formalize termos de uso de imagem para anúncios.']],
          ['Dispare a demanda', ['Briefing com objetivo, formato, prazo e referências.', 'Envio do produto com rastreio dentro do painel.', 'Receba, comente, aprove e pague via PIX.']],
        ].map(([t, items], i) => (
          <div key={t as string} className={`p-6 border-black ${i < 2 ? 'border-b-2 md:border-b-0 md:border-r-2' : ''} ${i === 0 ? LIME : ''}`}>
            <p className="text-[11px] font-bold uppercase">Passo {i + 1}</p>
            <h3 className={`${HEAVY} normal-case text-2xl mt-1 mb-4`}>{t as string}</h3>
            <ul className="space-y-2 text-sm text-black/80">
              {(items as string[]).map((x) => <li key={x}>— {x}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>

    {/* O que vem junto */}
    <section className={`${INK} text-white`}>
      <div className={`${WRAP} py-16 lg:py-24`}>
        <h2 className={`${HEAVY} normal-case text-4xl sm:text-5xl mb-10`}>
          o que vem <em>junto?</em>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {[
            ['Curadoria sua', 'Só entra no squad quem a marca aprova. Você decide quem fala por você.'],
            ['Onboarding da marca', 'Um vídeo e um guia de apresentação que deixam o squad afinado antes do primeiro post.'],
            ['Kit de criação', 'Logos, referências, roteiros-modelo e o que não pode faltar, tudo num lugar só.'],
            ['Regras claras', 'Termos de uso e direito de imagem definidos por campanha, sem zona cinzenta.'],
            ['Logística integrada', 'Envio de produtos com rastreio e status por creator.'],
            ['Um painel para tudo', 'Pipeline, mensagens, aprovações, pagamentos, afiliados e relatórios.'],
          ].map(([t, d]) => (
            <div key={t}>
              <p className={`${SERIF} text-xl text-[#DFE82A]`}>{t}</p>
              <p className="text-sm text-white/70 mt-1 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Resultado */}
    <section className={`${WRAP} py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10`}>
      <h2 className={`${SERIF} lg:col-span-5 text-4xl sm:text-5xl leading-tight`}>
        O que muda no <em>resultado</em>
      </h2>
      <ul className="lg:col-span-7 border-t-2 border-black">
        {[
          'Criativos novos toda semana para alimentar o tráfego pago.',
          'Mais confiança no anúncio, porque quem aparece usa o produto de verdade.',
          'Custo por vídeo menor: menos negociação, menos briefing repetido.',
          'Vendas atribuídas por creator com cupons e links de afiliado.',
        ].map((t) => (
          <li key={t} className="border-b-2 border-black py-4 font-medium">{t}</li>
        ))}
      </ul>
    </section>

    {/* Conclusão */}
    <section className={`${LIME} px-4 sm:px-8 lg:px-14 py-16 lg:py-24`}>
      <div className="max-w-4xl">
        <p className="text-[11px] font-bold uppercase tracking-wide">Para fechar</p>
        <h2 className={`${HEAVY} text-4xl sm:text-6xl leading-none mt-3`}>
          de campanha pontual a <span className="inline-block bg-white px-3 rotate-1">conteúdo sem parar</span>
        </h2>
        <p className="mt-6 text-lg font-medium max-w-2xl">
          O UGC que vende não nasce de uma contratação isolada, nasce de um time que entende e defende a sua marca. A Squad UGC
          existe para você montar esse time, colocar ele para rodar e medir o que ele entrega.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={actions.openBrand} className={`${PILL} bg-black text-white hover:bg-white hover:text-black`}>
            Montar meu squad <ArrowRight className="w-4 h-4" />
          </button>
          <NavLink view="para-marcas" onNavigate={actions.onNavigate} className={`${PILL} bg-white hover:bg-black hover:text-[#DFE82A]`}>
            Ver soluções para marcas
          </NavLink>
        </div>
      </div>
    </section>
  </article>
);
