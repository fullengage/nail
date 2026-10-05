import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { LIME, HEAVY, SERIF, PILL, WRAP, SiteActions } from './SiteLayout';
import { audienceQuality } from '../../lib/creatorQuality';

// Calculadora de engajamento grátis (Instagram e TikTok): atrai creators e marcas pelo Google/IA.
// Mesma régua do selo "Audiência real" do painel.
// Medianas medidas na base Squad UGC em out/2026 (393 perfis de Instagram, 863 de TikTok).
const MEDIANA = { instagram: 2.77, tiktok: 6.83 };

export const FAQ_FERRAMENTAS: [string, string][] = [
  ['Como calcular a taxa de engajamento no Instagram?', 'Some a média de curtidas e comentários dos últimos posts e divida pelo número de seguidores. Multiplique por 100 para ter a porcentagem.'],
  ['Como calcular a taxa de engajamento no TikTok?', 'No TikTok o alcance não depende só dos seguidores. Some curtidas, comentários e compartilhamentos médios e divida pela média de visualizações dos vídeos.'],
  ['Qual é uma boa taxa de engajamento?', 'Na base da Squad UGC, a mediana é 2,77% no Instagram e 6,83% no TikTok. Abaixo de 1% a audiência é pouco ativa; abaixo de 0,1% costuma indicar perfil parado ou seguidores comprados.'],
  ['Como saber se um perfil tem seguidores falsos?', 'Muitos seguidores com pouquíssimas curtidas e comentários é o principal sinal. Use a calculadora com a média dos últimos 12 posts.'],
];

const num = (v: string) => Number(v.replace(/\./g, '').replace(',', '.')) || 0;

export const FerramentasPage: React.FC<{ actions: SiteActions }> = ({ actions }) => {
  const [rede, setRede] = useState<'instagram' | 'tiktok'>('instagram');
  const [f, setF] = useState({ base: '', likes: '', comments: '', shares: '' });
  const base = num(f.base);
  const inter = num(f.likes) + num(f.comments) + (rede === 'tiktok' ? num(f.shares) : 0);
  const rate = base ? Math.round((inter / base) * 10000) / 100 : 0;
  const q = audienceQuality({ engagement_rate: rate });
  const field = (k: keyof typeof f, label: string) => (
    <label className="block">
      <span className="text-xs font-bold uppercase">{label}</span>
      <input inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder="0"
        className="mt-1 w-full border-2 border-black px-4 py-3 text-lg font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-[#DFE82A]" />
    </label>
  );

  return (
    <>
      <section className={`${LIME} px-4 sm:px-8 lg:px-14 pt-12 pb-14`}>
        <p className="text-[11px] font-bold uppercase tracking-wide">Ferramenta grátis</p>
        <h1 className={`${HEAVY} text-5xl sm:text-7xl leading-[0.95] mt-3 max-w-5xl`}>
          calculadora de <span className="inline-block bg-white px-3 -rotate-1 shadow-[5px_5px_0_#000]">engajamento</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base sm:text-lg font-medium">
          Descubra em segundos se um perfil do Instagram ou TikTok tem audiência real, comparado com creators brasileiros da base Squad UGC.
        </p>
      </section>

      <section className={`${WRAP} py-16 grid grid-cols-1 lg:grid-cols-2 gap-10`}>
        <div className="space-y-5">
          <div className="flex gap-2">
            {(['instagram', 'tiktok'] as const).map((r) => (
              <button key={r} onClick={() => setRede(r)} className={`${PILL} ${rede === r ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>
                {r === 'instagram' ? 'Instagram' : 'TikTok'}
              </button>
            ))}
          </div>
          {field('base', rede === 'instagram' ? 'Seguidores' : 'Média de visualizações por vídeo')}
          <div className="grid grid-cols-2 gap-4">
            {field('likes', 'Média de curtidas')}
            {field('comments', 'Média de comentários')}
          </div>
          {rede === 'tiktok' && field('shares', 'Média de compartilhamentos')}
          <p className="text-xs text-black/60">Use a média dos últimos 12 posts (ou vídeos). Nada é salvo nem enviado.</p>
        </div>

        <div className="border-2 border-black p-8 flex flex-col gap-4 shadow-[8px_8px_0_#000]">
          <p className="text-xs font-bold uppercase">Taxa de engajamento</p>
          <p className={`${HEAVY} text-7xl`}>{rate.toLocaleString('pt-BR')}%</p>
          {base > 0 && (
            <>
              <span className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${q.cls}`}>
                <ShieldCheck className="w-4 h-4" />{q.label}
              </span>
              <p className="text-sm text-black/75">{q.why}</p>
              <p className="text-sm">
                Mediana dos creators da Squad UGC no {rede === 'instagram' ? 'Instagram' : 'TikTok'}: <strong>{MEDIANA[rede].toLocaleString('pt-BR')}%</strong>.{' '}
                {rate >= MEDIANA[rede] ? 'Este perfil está acima da mediana.' : 'Este perfil está abaixo da mediana.'}
              </p>
            </>
          )}
          <div className="mt-auto pt-4 border-t-2 border-black flex flex-wrap gap-3">
            <button onClick={actions.openBrand} className={`${PILL} bg-black text-white hover:bg-[#DFE82A] hover:text-black`}>
              Quero creators com audiência real <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={actions.openCreator} className={`${PILL} bg-white hover:bg-black hover:text-white`}>Sou creator</button>
          </div>
        </div>
      </section>

      <section className={`${WRAP} pb-20`}>
        <h2 className={`${SERIF} text-4xl mb-8`}>Perguntas <em>frequentes</em></h2>
        <dl className="divide-y-2 divide-black border-y-2 border-black">
          {FAQ_FERRAMENTAS.map(([p, r]) => (
            <div key={p} className="py-5">
              <dt className="font-bold text-lg">{p}</dt>
              <dd className="mt-2 text-black/75 leading-relaxed">{r}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
};
