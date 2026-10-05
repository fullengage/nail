import React, { useEffect, useState } from 'react';
import { ArrowRight, Bell, Loader2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { campaignFlow, CAMPAIGN_STATUS, humanError, type FlowCampaign, type Notification, type Participation } from '../../services/campaignFlow';

// Entrada da empresa: criar campanha, o que está andando, o que exige ação e o próximo passo.
// (As métricas de prospecção ficam no painel do admin.)
export const BrandHome: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [camps, setCamps] = useState<FlowCampaign[]>([]);
  const [parts, setParts] = useState<Record<string, Participation[]>>({});
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const user = await campaignFlow.session();
        setSignedIn(!!user);
        if (!user) return;
        const cs = await campaignFlow.myCampaigns();
        setCamps(cs);
        const active = cs.filter((c) => !['draft', 'completed', 'cancelled'].includes(c.status));
        const ps = await Promise.all(active.map((c) => campaignFlow.participants(c.id)));
        setParts(Object.fromEntries(active.map((c, i) => [c.id, ps[i]])));
        setNotes((await campaignFlow.notifications()).filter((n) => !n.read_at).slice(0, 5));
      } catch (e) { setErr(humanError(e)); } finally { setLoading(false); }
    })();
  }, []);

  const go = (id?: string) => { if (id) sessionStorage.setItem('squadra_open_campaign', id); onNavigate('campaigns'); };
  const create = () => onNavigate('brand-create-campaign');
  const all = Object.values(parts).flat();
  const count = (stage: string) => all.filter((p) => p.stage === stage).length;
  const pending = [
    { n: count('applied'), t: 'candidatura(s) para avaliar' },
    { n: all.filter((p) => p.stage === 'shipping' && p.shipping).length, t: 'produto(s) para enviar' },
    { n: count('submitted'), t: 'entrega(s) para revisar' },
    { n: all.filter((p) => p.payment_status === 'pendente').length, t: 'pagamento(s) para informar' },
  ].filter((x) => x.n > 0);
  const drafts = camps.filter((c) => c.status === 'draft');
  const running = camps.filter((c) => ['open', 'selecting', 'in_progress'].includes(c.status));
  const next = !camps.length ? { t: 'Crie sua primeira campanha', a: create }
    : drafts.length && !running.length ? { t: `Publique o rascunho “${drafts[0].title}”`, a: () => go(drafts[0].id) }
    : pending.length ? { t: `Resolver: ${pending[0].n} ${pending[0].t}`, a: () => go(Object.keys(parts).find((id) => parts[id].some((p) => ['applied', 'submitted', 'shipping', 'approved'].includes(p.stage)))) }
    : running.some((c) => !(parts[c.id] || []).length) ? { t: 'Convide creators para a campanha publicada', a: () => go(running.find((c) => !(parts[c.id] || []).length)?.id) }
    : { t: 'Acompanhe a produção das campanhas', a: () => go() };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">Painel da marca</h1>
          <p className="text-xs text-muted-foreground">Suas campanhas, o que precisa da sua ação e o próximo passo.</p>
        </div>
        <Button size="lg" onClick={create}><Plus className="w-4 h-4" />Criar campanha</Button>
      </div>

      {!signedIn && <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800">Modo demonstração: entre com sua conta de empresa para ver e publicar campanhas reais.</p>}
      {err && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700">{err}</p>}

      {loading ? <p className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Carregando…</p> : (
        <>
          <section className="p-5 rounded-2xl bg-primary border-2 border-black flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[11px] font-bold uppercase text-black/70">Próximo passo</p><p className="text-lg font-bold text-black">{next.t}</p></div>
            <Button variant="gold" onClick={next.a}>Ir agora <ArrowRight className="w-4 h-4" /></Button>
          </section>

          {!camps.length ? (
            <section className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
              <p className="text-base font-bold text-foreground">Crie sua primeira campanha para receber vídeos, divulgar produtos ou recrutar afiliados.</p>
              <p className="text-xs text-muted-foreground">São 3 passos: produto e resultado, creators e pagamento, briefing. Leva poucos minutos e fica salvo enquanto você preenche.</p>
            </section>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="lg:col-span-2 p-4 rounded-2xl bg-card border border-border space-y-2">
                <h2 className="text-sm font-bold text-foreground">Campanhas em andamento ({running.length})</h2>
                {running.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma publicada ainda.{drafts.length ? ` ${drafts.length} rascunho(s) esperando publicação.` : ''}</p>}
                <ul className="divide-y divide-border">
                  {[...running, ...drafts].map((c) => {
                    const st = CAMPAIGN_STATUS[c.status];
                    const ps = parts[c.id] || [];
                    return (
                      <li key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0"><p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground">{ps.filter((p) => p.hired_at).length}/{c.creator_slots} contratados · {ps.filter((p) => p.stage === 'applied').length} aguardando sua decisão</p></div>
                        <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${st.cls}`}>{st.label}</span><Button size="sm" variant="outline" onClick={() => go(c.id)}>Abrir</Button></div>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <h2 className="text-sm font-bold text-foreground">Exige sua ação</h2>
                {pending.length === 0 ? <p className="text-xs text-muted-foreground">Nada pendente.</p> : <ul className="space-y-1.5 text-xs">{pending.map((p) => <li key={p.t}><strong className="text-foreground">{p.n}</strong> {p.t}</li>)}</ul>}
                {notes.length > 0 && (<>
                  <h3 className="pt-2 text-xs font-bold text-foreground flex items-center gap-1"><Bell className="w-3.5 h-3.5" />Novidades</h3>
                  <ul className="space-y-1 text-[11px] text-muted-foreground">{notes.map((n) => <li key={n.id}><strong className="text-foreground">{n.title}</strong> · {n.body}</li>)}</ul>
                </>)}
              </section>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Quer explorar a base antes? <button className="underline font-bold" onClick={() => onNavigate('creators')}>Ver creators</button></p>
        </>
      )}
    </div>
  );
};
