import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Search, Send, Store, X, CheckCircle2 } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';
import { RetailPoint } from '../../types/database';
import { Button } from '../ui/Button';

// Mapa de PDVs como serviço SOB CONSULTA:
// - a marca vê o tamanho da oportunidade (redes, lojas, cidades por UF) e pede um projeto;
// - o detalhe loja a loja (endereço, CNPJ, contato) é só do time Squad UGC (canSeeDetails).

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
const TYPE_LABEL: Record<string, string> = {
  pharmacy: 'Farmácias e drogarias',
  cosmetics: 'Cosméticos e perfumaria',
  salon: 'Salões e estética',
  distributor: 'Atacado e distribuidores',
  perfumery: 'Perfumarias',
};
const fmt = (n: number) => n.toLocaleString('pt-BR');

type Slim = { network: string; type: string; city: string; state: string };
interface Rede {
  name: string;
  type: string;
  stores: number;
  cities: number;
  states: number;
  topCities: string[];
  ufs: string[];
}

const cache = new Map<string, Slim[]>();

export const PdvMarketMap: React.FC<{ canSeeDetails: boolean }> = ({ canSeeDetails }) => {
  const { user } = useAuth();
  const [uf, setUf] = useState('all');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Slim[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(30);
  const [open, setOpen] = useState<string | null>(null);
  const [stores, setStores] = useState<Record<string, RetailPoint[] | 'loading'>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [projectOpen, setProjectOpen] = useState(false);

  useEffect(() => {
    const key = `${uf}|${type}`;
    setLimit(30);
    setOpen(null);
    if (cache.has(key)) {
      setRows(cache.get(key)!);
      return;
    }
    setLoading(true);
    supabaseService.retailSlim({ state: uf, type }).then((r) => {
      const data = r || [];
      cache.set(key, data);
      setRows(data);
      setLoading(false);
    });
  }, [uf, type]);

  // agrega por rede: uma linha por rede, com lojas/cidades/UFs (nada de repetição por endereço)
  const redes = useMemo<Rede[]>(() => {
    const m = new Map<string, { types: Map<string, number>; cities: Map<string, number>; ufs: Map<string, number>; stores: number }>();
    for (const r of rows || []) {
      const k = r.network || 'Sem rede';
      let e = m.get(k);
      if (!e) m.set(k, (e = { types: new Map(), cities: new Map(), ufs: new Map(), stores: 0 }));
      e.stores++;
      e.types.set(r.type, (e.types.get(r.type) || 0) + 1);
      const c = `${r.city}/${r.state}`;
      e.cities.set(c, (e.cities.get(c) || 0) + 1);
      e.ufs.set(r.state, (e.ufs.get(r.state) || 0) + 1);
    }
    const top = (mm: Map<string, number>) => [...mm.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return [...m.entries()]
      .map(([name, e]) => ({ name, type: top(e.types)[0], stores: e.stores, cities: e.cities.size, states: e.ufs.size, topCities: top(e.cities).slice(0, 4), ufs: top(e.ufs) }))
      .sort((a, b) => b.stores - a.stores);
  }, [rows]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? redes.filter((r) => r.name.toLowerCase().includes(s) || r.topCities.some((c) => c.toLowerCase().includes(s))) : redes;
  }, [redes, q]);

  const totals = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const r of rows || []) byType[r.type] = (byType[r.type] || 0) + 1;
    return { stores: rows?.length || 0, redes: redes.length, cities: new Set((rows || []).map((r) => `${r.city}/${r.state}`)).size, byType };
  }, [rows, redes]);

  const toggleStores = (name: string) => {
    if (open === name) return setOpen(null);
    setOpen(name);
    if (!canSeeDetails || stores[name]) return;
    setStores((s) => ({ ...s, [name]: 'loading' }));
    supabaseService.retailStoresOf(name, uf).then((list) => setStores((s) => ({ ...s, [name]: list || [] })));
  };

  const ufLabel = uf === 'all' ? 'no Brasil' : `em ${uf}`;

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={uf} onChange={(e) => setUf(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground">
          <option value="all">Todos os estados</option>
          {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground">
          <option value="all">Todos os tipos</option>
          {Object.entries(TYPE_LABEL).filter(([k]) => k !== 'perfumery').map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar rede ou cidade…" className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground" />
        </div>
      </div>

      {/* Tamanho da oportunidade */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-primary border-2 border-black text-black">
          <p className="text-[10px] uppercase font-bold">PDVs {ufLabel}</p>
          <p className="text-2xl font-extrabold">{loading ? '…' : fmt(totals.stores)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Redes</p>
          <p className="text-2xl font-extrabold">{loading ? '…' : fmt(totals.redes)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Cidades</p>
          <p className="text-2xl font-extrabold">{loading ? '…' : fmt(totals.cities)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-[11px] space-y-0.5">
          {Object.entries(totals.byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
            <p key={t} className="flex justify-between gap-2"><span className="text-muted-foreground">{TYPE_LABEL[t] || t}</span><strong>{fmt(n)}</strong></p>
          ))}
        </div>
      </div>

      {/* Pedidos de projeto recebidos (time Squad UGC) */}
      {canSeeDetails && <ProjectRequests />}

      {/* Chamada do serviço sob consulta (marcas) */}
      {!canSeeDetails && (
        <div className="p-5 rounded-2xl bg-[#2A2A2A] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#DFE82A]">Serviço sob consulta</p>
            <p className="text-lg font-bold mt-1">Quer ganhar market share {ufLabel}?</p>
            <p className="text-xs text-white/70 mt-1 max-w-2xl">
              Nosso time monta o projeto: indica o distribuidor certo, prioriza as redes e passa o contato de quem decide a compra em cada uma.
              {picked.length > 0 && <> Você marcou <strong>{picked.length}</strong> redes de interesse.</>}
            </p>
          </div>
          <button onClick={() => setProjectOpen(true)} className="rounded-full bg-[#DFE82A] text-black font-bold text-sm px-5 py-2.5 border-2 border-[#DFE82A] hover:bg-white shrink-0">
            Solicitar projeto {uf !== 'all' ? `para ${uf}` : ''}
          </button>
        </div>
      )}

      {/* Uma linha por rede */}
      <div className="rounded-2xl bg-card border border-border shadow-sm divide-y divide-border">
        <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span><strong className="text-foreground">{fmt(shown.length)}</strong> redes {ufLabel}</span>
          {!canSeeDetails && <span>Marque as redes que interessam e solicite o projeto.</span>}
        </div>
        {loading && <p className="p-6 text-center text-xs text-muted-foreground">Carregando o mapa…</p>}
        {!loading && shown.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">Nenhuma rede encontrada com esses filtros.</p>}
        {!loading && shown.slice(0, limit).map((r) => {
          const isOpen = open === r.name;
          const st = stores[r.name];
          return (
            <div key={r.name}>
              <div className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40">
                {!canSeeDetails && (
                  <input
                    type="checkbox"
                    checked={picked.includes(r.name)}
                    onChange={() => setPicked((p) => (p.includes(r.name) ? p.filter((x) => x !== r.name) : [...p, r.name]))}
                    className="w-4 h-4 accent-black"
                    aria-label={`Tenho interesse em ${r.name}`}
                  />
                )}
                <div className="w-9 h-9 rounded-lg bg-primary/30 flex items-center justify-center shrink-0"><Store className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {TYPE_LABEL[r.type] || r.type} · <strong className="text-foreground">{fmt(r.stores)} {r.stores === 1 ? 'loja' : 'lojas'}</strong> em {fmt(r.cities)} {r.cities === 1 ? 'cidade' : 'cidades'}
                    {uf === 'all' && <> · {r.states} {r.states === 1 ? 'estado' : 'estados'}</>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {r.topCities.join(' · ')}{r.cities > r.topCities.length ? ` e mais ${fmt(r.cities - r.topCities.length)}` : ''}
                  </p>
                </div>
                {canSeeDetails && (
                  <button onClick={() => toggleStores(r.name)} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-full border border-border hover:border-foreground">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />} Ver lojas
                  </button>
                )}
              </div>
              {canSeeDetails && isOpen && (
                <div className="px-4 pb-4 pl-16">
                  {st === 'loading' || !st ? (
                    <p className="text-xs text-muted-foreground">Carregando lojas…</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-border divide-y divide-border text-[11px]">
                      {st.map((p) => (
                        <div key={p.id} className="px-3 py-2 grid grid-cols-1 md:grid-cols-12 gap-1">
                          <span className="md:col-span-3 font-semibold">{p.city} - {p.state}</span>
                          <span className="md:col-span-5 text-muted-foreground">{p.address}</span>
                          <span className="md:col-span-2 font-mono text-muted-foreground">{p.cnpj}</span>
                          <span className="md:col-span-2 text-muted-foreground">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!loading && shown.length > limit && (
          <div className="p-3 text-center">
            <button onClick={() => setLimit((l) => l + 30)} className="text-xs font-bold underline">Mostrar mais redes ({fmt(shown.length - limit)} restantes)</button>
          </div>
        )}
      </div>

      {projectOpen && (
        <ProjectRequest
          uf={uf}
          type={type}
          redes={picked}
          totals={{ stores: totals.stores, redes: totals.redes }}
          defaults={{ name: user?.full_name || '', email: user?.email || '' }}
          onClose={() => setProjectOpen(false)}
        />
      )}
    </div>
  );
};

// Pedido de projeto: vira lead de marca (origem pdv_projeto) para o time Squad UGC
const ProjectRequest: React.FC<{
  uf: string; type: string; redes: string[]; totals: { stores: number; redes: number };
  defaults: { name: string; email: string }; onClose: () => void;
}> = ({ uf, type, redes, totals, defaults, onClose }) => {
  const [f, setF] = useState({ name: defaults.name, company: '', email: defaults.email, whatsapp: '', goal: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const ok = f.name.trim() && f.company.trim() && /\S+@\S+\.\S+/.test(f.email) && f.whatsapp.replace(/\D/g, '').length >= 10;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || sending) return;
    setSending(true);
    const notes = [
      `Projeto de PDVs | UF: ${uf === 'all' ? 'Brasil' : uf} | Tipo: ${type === 'all' ? 'todos' : TYPE_LABEL[type] || type}`,
      `Mercado visto: ${totals.stores} PDVs em ${totals.redes} redes`,
      redes.length ? `Redes de interesse: ${redes.join(', ')}` : '',
      f.goal && `Objetivo: ${f.goal}`,
    ].filter(Boolean).join('\n');
    const res = await supabaseService.submitBrandLead({ name: f.name, company: f.company, email: f.email, whatsapp: f.whatsapp, origin: 'pdv_projeto', notes });
    setSending(false);
    setDone(res.success ? 'ok' : res.message || 'Não foi possível enviar.');
  };

  const input = 'w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Serviço sob consulta</p>
            <h3 className="text-lg font-bold font-display">Projeto de expansão {uf !== 'all' ? `em ${uf}` : ''}</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>
        {done === 'ok' ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <p className="font-bold">Pedido recebido!</p>
            <p className="text-xs text-muted-foreground">Nosso time vai montar o projeto e falar com você pelo WhatsApp ou e-mail.</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              {fmt(totals.stores)} PDVs em {fmt(totals.redes)} redes{redes.length ? `, com ${redes.length} redes marcadas` : ''}. Indicamos o distribuidor e o contato de quem decide a compra em cada rede.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Seu nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={input} placeholder="Marca / empresa" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
              <input className={input} placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <input className={input} placeholder="WhatsApp com DDD" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
            </div>
            <textarea className={input} rows={3} placeholder="Objetivo (ex.: entrar em 300 farmácias no RJ em 6 meses)" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} />
            {done && <p className="text-red-600 font-semibold">{done}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={!ok || sending}><Send className="w-4 h-4" /> {sending ? 'Enviando…' : 'Solicitar projeto'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Lista de pedidos de projeto de PDV (leads com origin = pdv_projeto)
const ProjectRequests: React.FC = () => {
  const [state, setState] = useState<{ rows: any[]; error?: string } | null>(null);
  useEffect(() => {
    supabaseService.getBrandLeads('pdv_projeto').then(setState);
  }, []);
  if (!state) return null;
  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-bold">Pedidos de projeto de PDV</p>
        <span className="text-xs text-muted-foreground">{state.rows.length} recebidos</span>
      </div>
      {state.error === 'sem_tabela' && (
        <p className="p-4 text-xs text-amber-700">A tabela de pedidos ainda não existe no banco. Rode a migração <strong>20261004_leads_e_cache.sql</strong> no SQL Editor do Supabase.</p>
      )}
      {state.error === 'sem_permissao' && (
        <p className="p-4 text-xs text-muted-foreground">Entre com um usuário admin (login real) para ver os pedidos.</p>
      )}
      {!state.error && state.rows.length === 0 && <p className="p-4 text-xs text-muted-foreground">Nenhum pedido ainda.</p>}
      {state.rows.length > 0 && (
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {state.rows.map((l) => (
            <div key={l.id} className="px-4 py-3 text-xs grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3">
                <p className="font-bold">{l.company}</p>
                <p className="text-muted-foreground">{l.name} · {new Date(l.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <p className="md:col-span-6 whitespace-pre-line text-muted-foreground">{l.notes}</p>
              <div className="md:col-span-3 space-y-0.5">
                <a className="block hover:underline" href={`mailto:${l.email}`}>{l.email}</a>
                <a className="block hover:underline" href={`https://wa.me/${String(l.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{l.whatsapp}</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
