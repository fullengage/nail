import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { LIME, INK, HEAVY, SERIF, PILL, WRAP, SiteActions } from './SiteLayout';
import { MissionSimulator } from '../../components/squadra/MissionSimulator';

// Planos & preços: o que a marca paga, como funciona e o que a protege.
// Só promessas que o produto cumpre hoje (pagamento após aprovação, direito de uso no briefing, base real).

export const FAQ_PLANOS: [string, string][] = [
  ['Quando eu pago o cachê dos creators?', 'Só depois que você aprova o conteúdo entregue. Conteúdo reprovado volta para ajuste e não é pago.'],
  ['Posso usar os vídeos em anúncios?', 'Sim. O prazo de uso em anúncios (3, 6 ou 12 meses) é definido na criação da campanha e fica registrado no briefing que o creator aceita.'],
  ['Qual a diferença entre missão e squad mensal?', 'A missão é uma campanha com começo e fim (ex.: um lançamento). O squad mensal mantém um time fixo de creators produzindo e fazendo lives todo mês.'],
  ['Os creators são reais?', 'Sim. Nossa base vem de perfis públicos do TikTok, e contatos e Instagram só são vinculados quando o próprio creator os publica no perfil ou no link da bio.'],
  ['Preciso fidelizar?', 'Não. A missão termina quando a campanha acaba, e o squad mensal pode ser pausado ou cancelado para o mês seguinte.'],
];

const STEPS: [string, string][] = [
  ['Defina o objetivo', 'Escolha o tipo (live de vendas, vídeos UGC, envio de produto ou afiliados) e uma meta com número.'],
  ['A Squad monta o time', 'Escolhemos os creators por nicho, alcance medido e histórico. Você vê o cachê e o total antes de confirmar.'],
  ['Briefing em 3 instruções', 'O que criar, como marcar a marca (hashtag/cupom) e o prazo. Simples, para o creator executar sem erro.'],
  ['Aprove e pague', 'Revise cada vídeo ou live. O cachê só sai depois da sua aprovação, e o custo por conteúdo aparece no painel.'],
];

const PLANS = [
  {
    name: 'Missão pontual',
    tag: 'Para lançamentos e testes',
    price: 'Cachê por creator',
    items: [
      'Campanha com início e fim',
      'Você define quantos creators e quanto pagar',
      'Lives de venda, vídeos UGC ou envio de produto',
      'Aprovação de cada conteúdo antes do pagamento',
      'Direito de uso em anúncios definido na campanha',
    ],
    cta: 'Criar uma missão',
  },
  {
    name: 'Squad mensal',
    tag: 'Para vender todo mês',
    price: 'Cachês mensais do squad',
    highlight: true,
    items: [
      'Time fixo de creators da sua marca',
      'Lives e vídeos novos todo mês para tráfego pago',
      'Briefing e guia da marca reaproveitados',
      'Cupons e links de afiliado por creator',
      'Pausa ou cancelamento para o mês seguinte',
    ],
    cta: 'Montar meu squad',
  },
];

const GUARANTEES: [string, string][] = [
  ['Paga só o que aprovar', 'Nenhum cachê é liberado sem a sua aprovação do conteúdo.'],
  ['Direito de uso por escrito', 'Prazo de uso em anúncios registrado em cada campanha.'],
  ['Creators reais', 'Perfis públicos verificados; nada de seguidores ou contatos inventados.'],
  ['Custo visível', 'Orçamento, valor pago e custo por conteúdo no painel, em tempo real.'],
];

export const PlanosPage: React.FC<{ actions: SiteActions }> = ({ actions }) => (
  <>
    <section className={`${LIME} px-4 sm:px-8 lg:px-14 pt-12 pb-14`}>
      <p className="text-[11px] font-bold uppercase tracking-wide">Planos & preços</p>
      <h1 className={`${HEAVY} text-5xl sm:text-7xl leading-[0.95] mt-3 max-w-5xl`}>
        você só paga o que <span className="inline-block bg-white px-3 -rotate-1 shadow-[5px_5px_0_#000]">aprovar</span>
      </h1>
      <p className="mt-6 max-w-2xl text-base sm:text-lg font-medium">
        Você define quantos creators quer e quanto pagar por vídeo ou live. O cachê de cada creator só é liberado depois que você aprova o conteúdo.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={actions.openBrand} className={`${PILL} bg-black text-white hover:bg-white hover:text-black text-lg`}>
          Falar com a gente <ArrowRight className="w-4 h-4" />
        </button>
        <a href="#simulador" className={`${PILL} bg-white hover:bg-black hover:text-[#DFE82A] text-lg`}>Simular preço</a>
      </div>
    </section>

    {/* Como funciona */}
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-12`}>Como <em>funciona</em></h2>
      <ol className="grid grid-cols-1 md:grid-cols-4 border-2 border-black">
        {STEPS.map(([t, d], i) => (
          <li key={t} className={`p-6 border-black ${i < 3 ? 'border-b-2 md:border-b-0 md:border-r-2' : ''} ${i === 3 ? LIME : ''}`}>
            <p className="text-[11px] font-bold uppercase">Passo {i + 1}</p>
            <h3 className={`${HEAVY} normal-case text-xl mt-1 mb-2`}>{t}</h3>
            <p className="text-sm text-black/75 leading-relaxed">{d}</p>
          </li>
        ))}
      </ol>
    </section>

    {/* Modalidades */}
    <section className={`${INK} text-white`}>
      <div className={`${WRAP} py-16 lg:py-24`}>
        <h2 className={`${HEAVY} normal-case text-4xl sm:text-5xl mb-10`}>
          escolha o <em>formato</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((p) => (
            <div key={p.name} className={`p-8 border-2 ${p.highlight ? 'border-[#DFE82A] bg-[#DFE82A] text-black' : 'border-white/20'} flex flex-col gap-6`}>
              <div>
                <p className={`text-[11px] font-bold uppercase ${p.highlight ? 'text-black/70' : 'text-[#DFE82A]'}`}>{p.tag}</p>
                <h3 className={`${SERIF} text-3xl mt-1`}>{p.name}</h3>
                <p className={`mt-2 font-bold ${p.highlight ? '' : 'text-white/80'}`}>{p.price}</p>
              </div>
              <ul className="space-y-2 text-sm flex-1">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2"><Check className="w-4 h-4 shrink-0 mt-0.5" />{it}</li>
                ))}
              </ul>
              <button onClick={actions.openBrand} className={`${PILL} self-start ${p.highlight ? 'bg-black text-white hover:bg-white hover:text-black' : 'border-white bg-white text-black hover:bg-[#DFE82A] hover:border-[#DFE82A]'}`}>
                {p.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Simulador com dados reais da base */}
    <section id="simulador" className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-4`}>Quanto <em>custa</em>?</h2>
      <p className="text-black/70 max-w-2xl mb-8">Arraste para ver o investimento em cachês e quantos creators reais da nossa base estão naquela faixa.</p>
      <MissionSimulator onApplyBudget={() => actions.openBrand()} />
    </section>

    {/* Garantias */}
    <section className={`${LIME}`}>
      <div className={`${WRAP} py-16 lg:py-20`}>
        <h2 className={`${HEAVY} text-4xl sm:text-5xl mb-10`}>por que dá para <span className="inline-block bg-white px-3 rotate-1">confiar</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GUARANTEES.map(([t, d]) => (
            <div key={t} className="border-2 border-black bg-white p-5">
              <p className="font-black text-lg">{t}</p>
              <p className="text-sm text-black/75 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className={`${WRAP} py-16 lg:py-24`}>
      <h2 className={`${SERIF} text-4xl sm:text-5xl mb-8`}>Perguntas <em>frequentes</em></h2>
      <div className="border-t-2 border-black">
        {FAQ_PLANOS.map(([q, a]) => (
          <details key={q} className="group border-b-2 border-black py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-lg">
              {q}
              <span className="text-2xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-black/70 leading-relaxed max-w-3xl">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-12">
        <button onClick={actions.openBrand} className={`${PILL} bg-black text-white hover:bg-[#DFE82A] hover:text-black`}>
          Candidatar minha marca <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  </>
);
