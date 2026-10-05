import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CampaignBuilder } from '../../components/campaign/CampaignBuilder';
import { CampaignWorkspace } from '../../components/campaign/CampaignWorkspace';
import { MissionSimulator } from '../../components/squadra/MissionSimulator';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { campaignFlow, CAMPAIGN_STATUS, humanError, type FlowCampaign } from '../../services/campaignFlow';
import { Draft, duplicateFrom, loadLocal, newDraft } from '../../lib/campaignDraft';

// Campanhas reais (banco): lista por estado → assistente → área de trabalho da campanha.
type View = { kind: 'list' } | { kind: 'build'; draft: Draft | null } | { kind: 'work'; id: string; justPublished?: boolean };

const br = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
const FILTERS: [string, string][] = [['all', 'Todas'], ['draft', 'Rascunhos'], ['open', 'Publicadas'], ['selecting', 'Em seleção'], ['in_progress', 'Em produção'], ['completed', 'Concluídas']];

export const CampaignsPage: React.FC<{ startBuilding?: boolean }> = ({ startBuilding }) => {
  const { role } = useAuth();
  const isAdmin = role === 'admin_master' || role === 'admin';
  const [view, setView] = useState<View>(() => {
    const open = sessionStorage.getItem('squadra_open_campaign');
    if (open) { sessionStorage.removeItem('squadra_open_campaign'); return { kind: 'work', id: open }; }
    return startBuilding ? { kind: 'build', draft: null } : { kind: 'list' };
  });
  const [items, setItems] = useState<FlowCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [signedIn, setSignedIn] = useState(true);
  const [showSim, setShowSim] = useState(false);
  const local = loadLocal();

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const user = await campaignFlow.session();
      setSignedIn(!!user);
      if (isAdmin && supabase) {
        const { data, error } = await supabase.from('campaigns').select('*').order('updated_at', { ascending: false });
        if (error) throw error;
        setItems((data || []) as FlowCampaign[]);
      } else setItems(await campaignFlow.myCampaigns());
    } catch (e) { setErr(humanError(e)); } finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { if (view.kind === 'list') load(); }, [view.kind, load]);

  if (view.kind === 'build') {
    return <CampaignBuilder initial={view.draft} onClose={() => setView({ kind: 'list' })} onPublished={(id) => setView({ kind: 'work', id, justPublished: true })} />;
  }
  if (view.kind === 'work') {
    return <CampaignWorkspace campaignId={view.id} justPublished={view.justPublished} onBack={() => setView({ kind: 'list' })}
      onEditDraft={(c) => {
        const base = duplicateFrom(c);
        // retomar o rascunho do banco: mesmo id, mesmo client_ref e mesmas datas
        setView({ kind: 'build', draft: { ...base, id: c.id, client_ref: c.client_ref || base.client_ref, title: c.title, step: 3,
          application_deadline: c.application_deadline || base.application_deadline, selection_deadline: c.selection_deadline || base.selection_deadline, delivery_deadline: c.delivery_deadline || base.delivery_deadline } });
      }}
      onDuplicate={(c) => setView({ kind: 'build', draft: duplicateFrom(c) })} />;
  }

  const shown = items.filter((c) => filter === 'all' || c.status === filter);
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">{isAdmin ? 'Campanhas (todas as marcas)' : 'Minhas campanhas'}</h1>
          <p className="text-xs text-muted-foreground">Do rascunho à entrega e ao pagamento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSim(!showSim)}><Sparkles className="w-3.5 h-3.5" />{showSim ? 'Fechar simulador' : 'Simular preço'}</Button>
          <Button onClick={() => setView({ kind: 'build', draft: null })}><Plus className="w-4 h-4" />{local ? 'Continuar rascunho' : 'Criar campanha'}</Button>
        </div>
      </div>

      {showSim && <MissionSimulator onApplyBudget={(p) => { const d = newDraft(); d.creator_slots = p.creatorCount; d.compensation.fee = p.pricePerVideo; setView({ kind: 'build', draft: d }); }} />}
      {!signedIn && <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800">Você está no modo demonstração (sem login). Pode montar o rascunho; para publicar, entre com sua conta de empresa.</p>}
      {local && <p className="p-3 rounded-xl bg-muted/50 border border-border text-xs">Você tem um rascunho em andamento: <strong>{local.title || 'sem nome'}</strong> (passo {local.step}). <button className="underline font-bold" onClick={() => setView({ kind: 'build', draft: null })}>Continuar</button></p>}
      {err && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{err}</p>}

      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap ${filter === k ? 'border-black text-foreground' : 'border-transparent text-muted-foreground'}`}>
            {l} ({k === 'all' ? items.length : items.filter((c) => c.status === k).length})
          </button>
        ))}
      </div>

      {loading ? <p className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Carregando…</p> :
        shown.length === 0 ? (
          <div className="py-14 text-center space-y-3 rounded-2xl border border-dashed border-border">
            <p className="text-sm font-bold text-foreground">{items.length ? 'Nenhuma campanha neste estado.' : 'Crie sua primeira campanha para receber vídeos, divulgar produtos ou recrutar afiliados.'}</p>
            {!items.length && <Button onClick={() => setView({ kind: 'build', draft: null })}><Plus className="w-4 h-4" />Criar campanha</Button>}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shown.map((c) => {
              const st = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.draft;
              return (
                <li key={c.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button className="text-left" onClick={() => setView({ kind: 'work', id: c.id })}>
                      <p className="font-bold text-foreground hover:underline">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">{c.product?.name || 'Produto não informado'} · {c.creator_slots} creators · atualizada em {br(c.updated_at)}</p>
                    </button>
                    {c.is_test && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700">TESTE</span>}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => setView({ kind: 'work', id: c.id })}>{c.status === 'draft' ? 'Abrir rascunho' : 'Acompanhar'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setView({ kind: 'build', draft: duplicateFrom(c) })}><Copy className="w-3.5 h-3.5" />Duplicar</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
};
