import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { LIME, INK, HEAVY, SERIF, PILL, WRAP, SiteActions } from './SiteLayout';
import { supabaseService } from '../../services/supabaseService';

// Piloto Squad: oferta de entrada a preço fechado, com pedido registrado em ncp_brand_leads
// (origin = piloto_squad). O pagamento é combinado por e-mail (Pix do sinal, nota pela Fullweb);
// nada de cobrança automática aqui. Só promessas que a operação cumpre: entrega de vídeos, não de vendas.

export const PILOTO_PACOTES = [
  { id: 'piloto-10', nome: 'Piloto 10 creators', creators: 10, videos: 20, preco: 3900, destaque: true },
  { id: 'piloto-5', nome: 'Piloto 5 creators', creators: 5, videos: 10, preco: 2200, destaque: false },
] as const;

export const FAQ_PILOTO: [string, string][] = [
  ['O que eu recebo no piloto?', 'Creators escolhidos pela Squad gravam e publicam vídeos com o seu produto na vitrine do TikTok Shop. No fim, você recebe um relatório com os vídeos, as visualizações e as vendas atribuídas a cada creator.'],
  ['Como funciona o pagamento?', 'Metade na contratação e metade na entrega dos vídeos, por Pix, com nota fiscal de serviço. A comissão de afiliado sobre as vendas é paga pelo TikTok direto ao creator, conforme a comissão configurada na sua loja.'],
  ['Vocês garantem vendas?', 'Não. Garantimos a entrega dos vídeos publicados no prazo. O volume de vendas depende do produto, do preço e da comissão oferecida.'],
  ['Eu escolho os creators?', 'A seleção é feita pela Squad, com base em nicho, alcance medido e histórico de venda no TikTok Shop. Você vê o perfil de quem foi contratado para a sua campanha.'],
  ['O que eu preciso enviar?', 'Uma unidade do produto para cada creator e o produto ativo na sua loja do TikTok Shop, com comissão de afiliado habilitada.'],
  ['Posso usar os vídeos em anúncios?', 'Sim. O direito de uso em anúncios fica registrado no briefing que o creator aceita.'],
];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const input = 'w-full border-2 border-black bg-white px-3 py-2.5 text-sm focus:outline-none focus:bg-[#DFE82A]/20';
const label = 'block text-[11px] font-bold uppercase tracking-wide mb-1';

export const PilotoPage: React.FC<{ actions: SiteActions }> = () => {
  const [pacote, setPacote] = useState<string>(PILOTO_PACOTES[0].id);
  const [f, setF] = useState({ nome: '', marca: '', email: '', whatsapp: '', loja: '', produto: '', site: '' });
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  const escolhido = PILOTO_PACOTES.find((p) => p.id === pacote) || PILOTO_PACOTES[0];
  const sinal = escolhido.preco / 2;
  const ok = f.nome.trim() && f.marca.trim() && /\S+@\S+\.\S+/.test(f.email) && f.whatsapp.replace(/\D/g, '').length >= 10 && f.produto.trim();

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.site) return; // campo-isca contra robôs
    if (!ok || sending) return;
    setSending(true);
    setErro(null);
    const res = await supabaseService.submitBrandLead({
      name: f.nome.trim(),
      company: f.marca.trim(),
      email: f.email.trim().toLowerCase(),
      whatsapp: f.whatsapp.trim(),
      sales_channel: 'TikTok Shop / Live commerce',
      budget_tier: `${escolhido.nome} · ${brl(escolhido.preco)}`,
      origin: 'piloto_squad',
      notes: `Pedido de piloto: ${escolhido.nome} (${escolhido.videos} vídeos) por ${brl(escolhido.preco)}; sinal ${brl(sinal)}.\nProduto: ${f.produto.trim()}\nLoja: ${f.loja.trim() || 'não informada'}`,
    });
    setSending(false);
    if (res.success) setFeito(true);
    else setErro(res.message || 'Não foi possível registrar o pedido. Tente de novo em instantes.');
  };

  return (
    <>
      <section className={`${LIME} px-4 sm:px-8 lg:px-14 pt-12 pb-14`}>
        <p className="text-[11px] font-bold uppercase tracking-wide">Piloto Squad · TikTok Shop</p>
        <h1 className={`${HEAVY} text-5xl sm:text-7xl leading-[0.95] mt-3 max-w-5xl`}>
          20 vídeos de creators reais em <span className="inline-block bg-white px-3 -rotate-1 shadow-[5px_5px_0_#000]">21 dias</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base sm:text-lg font-medium">
          Seu produto na mão de creators que já vendem no TikTok Shop. A Squad escolhe, acompanha a gravação e entrega os vídeos publicados na vitrine, com relatório de vendas por creator. Preço fechado.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#pedido" className={`${PILL} bg-black text-white text-lg`}>Pedir meu piloto <ArrowRight className="w-4 h-4" /></a>
          <a href="#como-funciona" className={`${PILL} bg-white text-lg`}>Como funciona</a>
        </div>
      </section>

      <section id="como-funciona" className={`${WRAP} py-16 lg:py-20`}>
        <h2 className={`${SERIF} text-4xl sm:text-5xl mb-10`}>Do pedido ao <em>relatório</em></h2>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-6 border-t border-black pt-8">
          {[
            ['Você pede', 'Escolhe o pacote e conta qual produto quer divulgar.'],
            ['Sinal por Pix', 'Enviamos a proposta e a cobrança de 50% por e-mail, com nota fiscal.'],
            ['Envio dos produtos', 'Você manda uma unidade para cada creator do squad.'],
            ['Gravação e publicação', 'Cada creator publica 2 vídeos com o produto na vitrine.'],
            ['Relatório e saldo', 'Vídeos, visualizações e vendas por creator. Os 50% finais são pagos na entrega.'],
          ].map(([t, d], i) => (
            <li key={t}>
              <span className={`${HEAVY} text-5xl`}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={`${SERIF} text-xl mt-2`}>{t}</h3>
              <p className="mt-1 text-sm text-black/70 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pedido" className={`${INK} text-white`}>
        <div className={`${WRAP} py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10`}>
          <div className="lg:col-span-5 space-y-4">
            <h2 className={`${HEAVY} normal-case text-4xl sm:text-5xl`}>Escolha o <em className="text-[#DFE82A]">pacote</em></h2>
            {PILOTO_PACOTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPacote(p.id)}
                aria-pressed={pacote === p.id}
                className={`w-full text-left border-2 p-5 transition-colors ${pacote === p.id ? 'border-[#DFE82A] bg-[#DFE82A] text-black' : 'border-white/30 hover:border-white'}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`${SERIF} text-2xl`}>{p.nome}</p>
                  <p className={`${HEAVY} text-3xl`}>{brl(p.preco)}</p>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {[`${p.creators} creators escolhidos pela Squad`, `${p.videos} vídeos publicados na vitrine`, 'Entrega em 21 dias após a chegada dos produtos', 'Relatório de vendas por creator', 'Direito de uso dos vídeos em anúncios'].map((it) => (
                    <li key={it} className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" /> {it}</li>
                  ))}
                </ul>
              </button>
            ))}
            <p className="text-xs text-white/60">
              50% na contratação e 50% na entrega, por Pix, com nota fiscal de serviço. A comissão de afiliado sobre as vendas é paga pelo TikTok direto ao creator.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white text-black p-6 sm:p-8">
            {feito ? (
              <div role="status" className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wide">Pedido registrado</p>
                <h3 className={`${SERIF} text-3xl`}>Recebemos o seu pedido, {f.nome.split(' ')[0]}.</h3>
                <div className="border-2 border-black p-4 text-sm space-y-1">
                  <p><strong>{escolhido.nome}</strong> para {f.marca}</p>
                  <p>Valor total: {brl(escolhido.preco)}</p>
                  <p>Sinal para começar: {brl(sinal)}</p>
                </div>
                <ol className="text-sm space-y-2 list-decimal pl-5">
                  <li>Em até 1 dia útil você recebe em <strong>{f.email}</strong> a proposta e a cobrança Pix do sinal.</li>
                  <li>Com o sinal confirmado, enviamos o endereço para remessa dos produtos e começamos a seleção dos creators.</li>
                  <li>Os 21 dias contam a partir da chegada dos produtos.</li>
                </ol>
                <p className="text-xs text-black/60">O pedido só vira contrato depois do pagamento do sinal. Até lá você pode desistir sem custo.</p>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4" noValidate>
                <h3 className={`${SERIF} text-3xl`}>Pedir o piloto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={label} htmlFor="p-nome">Seu nome *</label>
                    <input id="p-nome" className={input} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoComplete="name" required />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-marca">Marca *</label>
                    <input id="p-marca" className={input} value={f.marca} onChange={(e) => setF({ ...f, marca: e.target.value })} autoComplete="organization" required />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-email">E-mail *</label>
                    <input id="p-email" type="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-whats">WhatsApp com DDD *</label>
                    <input id="p-whats" type="tel" className={input} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} autoComplete="tel" required />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="p-produto">Produto que você quer divulgar e preço de venda *</label>
                  <input id="p-produto" className={input} placeholder="Ex.: Body splash 200 ml, R$ 79" value={f.produto} onChange={(e) => setF({ ...f, produto: e.target.value })} required />
                </div>
                <div>
                  <label className={label} htmlFor="p-loja">Link da sua loja no TikTok Shop (se já tiver)</label>
                  <input id="p-loja" className={input} placeholder="https://www.tiktok.com/@suamarca" value={f.loja} onChange={(e) => setF({ ...f, loja: e.target.value })} />
                </div>
                <input type="text" name="site" tabIndex={-1} autoComplete="off" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} className="hidden" aria-hidden="true" />
                {erro && <p role="alert" className="text-sm font-semibold text-red-700">{erro}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
                  <p className="text-sm">
                    <strong>{escolhido.nome}</strong> · {brl(escolhido.preco)} · sinal de {brl(sinal)}
                  </p>
                  <button type="submit" disabled={!ok || sending} className={`${PILL} bg-black text-white disabled:opacity-40`}>
                    {sending ? 'Enviando…' : 'Registrar pedido'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-black/60">Registrar o pedido não gera cobrança. Seus dados são usados só para o contato comercial deste piloto.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className={`${WRAP} py-16 lg:py-20`}>
        <h2 className={`${SERIF} text-4xl sm:text-5xl mb-8`}>Perguntas <em>frequentes</em></h2>
        <div className="divide-y divide-black border-y border-black">
          {FAQ_PILOTO.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className={`${SERIF} text-xl cursor-pointer list-none flex justify-between gap-4`}>
                {q} <span className="group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-sm text-black/70 max-w-3xl">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
};
