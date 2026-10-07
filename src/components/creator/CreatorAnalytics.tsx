import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Eye, Heart, Loader2, MessageCircle, Play, Share2, ShieldCheck, Tag, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CreatorMetrics, CreatorProfile } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';
import { ER_BANDS, followersOf, growth30d, metricsQuality, pctBR, reachPct, suspicionAlerts, type MetricsSummary } from '../../lib/creatorQuality';
import { TikTokLink, InstagramLink } from '../ui/TikTokLink';
import { useAuth } from '../../context/AuthContext';

// sem snapshot o número de engajamento é o da busca inicial (definições diferentes): nunca vira "Audiência engajada"
function estimatedBadge(c: Pick<CreatorProfile, 'engagement_rate'>) {
  const e = Number(c.engagement_rate) || 0;
  const cls = 'bg-muted text-muted-foreground border-border';
  return e > 0
    ? { label: `Engajamento estimado na captação · ${pct(e)}`, why: 'Número da busca inicial do perfil, não medido post a post. Pode usar outra fórmula.', cls }
    : { label: 'Sem medição', why: 'Engajamento ainda não medido.', cls };
}

// Perfil do creator com análise de desempenho (snapshots de creator_metrics).
// Regra: sem medição, "—" e "Ainda não medido". Nada estimado, padrão ou de exemplo.
// Sem preço/CPM nem demografia: não há base real para isso ainda.

const num = (v: number | null | undefined) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : Math.round(v).toLocaleString('pt-BR'));
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`);
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
// tags internas (origem, faixa, porte) não são categoria de conteúdo
const isInternalTag = (t: string) => /^(origem:|[ABC] - |micro|médio|macro|teste$|sem Instagram$|UGC\/publi$)/i.test(t);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <section className={`p-4 rounded-2xl bg-card border border-border space-y-3 ${className}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
    {children}
  </section>
);
const Stat: React.FC<{ label: string; value: string; icon?: React.ReactNode; hint?: string; warn?: boolean }> = ({ label, value, icon, hint, warn }) => (
  <div className={`p-3 rounded-xl border ${warn ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-background'}`}>
    <p className="text-[11px] text-muted-foreground flex items-center gap-1">{icon}{label}</p>
    <p className="text-lg font-extrabold text-foreground">{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>}
  </div>
);

// barra de faixas com os limites reais do selo (não há base de comparação com outros creators)
const BANDS = [
  { to: ER_BANDS[0], label: 'Suspeita', cls: 'bg-red-400' },
  { to: ER_BANDS[1], label: 'Baixo', cls: 'bg-amber-300' },
  { to: ER_BANDS[2], label: 'Real', cls: 'bg-emerald-300' },
  { to: ER_BANDS[3], label: 'Engajada', cls: 'bg-emerald-500' },
  { to: Infinity, label: 'Fora da curva', cls: 'bg-amber-500' },
];
function bandPosition(er: number) {
  // cada faixa ocupa 1/5 da barra; dentro dela, posição proporcional (a última satura em 2× o limite)
  let from = 0;
  for (let i = 0; i < BANDS.length; i++) {
    const to = BANDS[i].to === Infinity ? ER_BANDS[3] * 2 : BANDS[i].to;
    if (er <= to || i === BANDS.length - 1) return Math.min(100, (i + Math.min(1, (er - from) / (to - from))) * 20);
    from = to;
  }
  return 100;
}
const ErBar: React.FC<{ er: number | null }> = ({ er }) => (
  <div className="space-y-1">
    <div className="relative h-3 rounded-full overflow-hidden flex" role="img" aria-label={er == null ? 'Sem medição' : `Engajamento ${pct(er)}`}>
      {BANDS.map((b) => <div key={b.label} className={`flex-1 ${b.cls}`} />)}
      {er != null && <div className="absolute top-[-3px] h-[18px] w-1.5 rounded bg-black ring-2 ring-white" style={{ left: `calc(${bandPosition(er)}% - 3px)` }} />}
    </div>
    <div className="grid grid-cols-5 text-[10px] text-muted-foreground">
      {BANDS.map((b, i) => <span key={b.label} className="text-center">{b.label}<br />{i === 0 ? `< ${pctBR(ER_BANDS[0])}` : i === 4 ? `> ${pctBR(ER_BANDS[3])}` : `${ER_BANDS[i - 1].toLocaleString('pt-BR')}–${pctBR(ER_BANDS[i])}`}</span>)}
    </div>
  </div>
);

// o chamador passa key={creator.id}, então cada creator começa do zero (sem setState no efeito)
interface Props {
  creator: CreatorProfile;
  actions?: React.ReactNode;      // botões do contexto (convidar, parecidos…)
  privateSlot?: React.ReactNode;  // contatos: o chamador só passa para admin
}

export const CreatorAnalytics: React.FC<Props> = ({ creator, actions, privateSlot }) => {
  const { role } = useAuth();
  const isAdmin = role === 'admin_master' || role === 'admin';
  const [rows, setRows] = useState<CreatorMetrics[] | null>(null);
  const [status, setStatus] = useState<'migracao' | 'login' | null>(null);
  useEffect(() => {
    let alive = true;
    supabaseService.getCreatorMetrics(creator.id).then((r) => { if (alive) { setRows(r.rows); setStatus(r.error); } });
    return () => { alive = false; };
  }, [creator.id]);

  const tiktok = useMemo(() => (rows || []).filter((r) => r.platform === 'tiktok'), [rows]);
  const insta = useMemo(() => (rows || []).filter((r) => r.platform === 'instagram'), [rows]);
  const [pick, setPick] = useState<'tiktok' | 'instagram' | null>(null);
  const plat = pick || (tiktok.length || !insta.length ? 'tiktok' : 'instagram');
  const snaps = plat === 'tiktok' ? tiktok : insta;
  const isIG = plat === 'instagram';
  const last = snaps[0] || null;
  const m: MetricsSummary | null = last;
  const q = metricsQuality(m, creator);
  const alerts = suspicionAlerts(m);
  const followers = last?.followers ?? (followersOf(creator) || null);
  const reach = reachPct(last?.avg_views, last?.followers);
  const growth = growth30d(snaps);
  const history = [...snaps].reverse().filter((r) => r.followers != null).map((r) => ({ d: date(r.collected_at), seguidores: r.followers }));
  const categories = [...new Set([...(creator.specialties || []), ...(creator.tags || []).filter((t) => !isInternalTag(t))])];
  const commentsOverLikes = alerts.some((a) => a.key === 'comments_over_likes');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      {/* coluna lateral */}
      <aside className="space-y-3 lg:sticky lg:top-0 self-start">
        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full bg-black text-[#DFE82A] font-black text-2xl flex items-center justify-center">{creator.professional_name.slice(0, 2).toUpperCase()}</div>
          <h2 className="font-bold text-foreground leading-tight">{creator.professional_name}</h2>
          <p className="text-xs text-muted-foreground">
            <TikTokLink handle={creator.tiktok} />{creator.instagram && <> · <InstagramLink handle={creator.instagram} /></>}
          </p>
          <p className="text-xs text-foreground"><strong>{num(followers)}</strong> seguidores{[creator.city, creator.state].filter(Boolean).length ? ` · ${[creator.city, creator.state].filter(Boolean).join('/')}` : ''}</p>
          {(() => { const b = last ? q : estimatedBadge(creator); return <span title={b.why} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${b.cls}`}><ShieldCheck className="w-3.5 h-3.5" />{b.label}</span>; })()}
          {creator.bio && <p className="text-[11px] text-muted-foreground text-left leading-relaxed">{creator.bio}</p>}
          {actions && <div className="flex flex-col gap-2 pt-1">{actions}</div>}
        </div>
        {categories.length > 0 && (
          <div className="p-3 rounded-2xl bg-card border border-border">
            <p className="text-[11px] font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Categorias</p>
            <div className="flex flex-wrap gap-1.5">{categories.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold">{t}</span>)}</div>
          </div>
        )}
        {privateSlot}
      </aside>

      {/* análise */}
      <div className="space-y-4 min-w-0">
        {rows == null ? (
          <p className="p-6 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Carregando métricas…</p>
        ) : !last ? (
          <div className="p-6 rounded-2xl border border-dashed border-border space-y-3">
            <p className="text-base font-bold text-foreground">Ainda não medido</p>
            <p className="text-xs text-muted-foreground">
              {status === 'migracao' ? 'As métricas por post ficam disponíveis depois da migração 20261007 no banco.'
                : status === 'login' ? 'Entre com sua conta para ver as métricas por post.'
                : 'Ainda não coletamos os posts deste creator. Médias, engajamento, alcance, histórico e publis aparecem depois da primeira medição.'}
            </p>
            <p className="text-xs text-foreground"><strong>Previsão:</strong> sem data marcada (a medição é feita sob demanda, antes de indicar o creator para uma campanha).</p>
            {isAdmin && creator.tiktok && status !== 'migracao' && (
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">Como medir (TikTok, ~US$ 0,09):</p>
                <code className="block p-2 rounded-lg bg-muted text-[11px] break-all">node --experimental-strip-types --env-file=.env scripts/medir-creator-tiktok.mjs --usuario {creator.tiktok}</code>
                <p className="text-muted-foreground">Depois grave com <code>--apply</code>.</p>
              </div>
            )}
          </div>
        ) : null}

        {tiktok.length > 0 && insta.length > 0 && (
          <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit" role="tablist" aria-label="Rede">
            {(['tiktok', 'instagram'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={plat === k} onClick={() => setPick(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${plat === k ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{k === 'tiktok' ? 'TikTok' : 'Instagram'}</button>
            ))}
          </div>
        )}

        {last && (<>

        {/* vídeos recentes */}
        {last && last.recent_posts?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {last.recent_posts.map((p, i) => (
              <a key={i} href={p.url || '#'} target="_blank" rel="noreferrer" className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border group">
                <Play className="absolute inset-0 m-auto w-6 h-6 text-muted-foreground" aria-hidden />
                {p.cover && <img src={p.cover} alt={`Vídeo de ${date(p.created_at)}`} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="relative w-full h-full object-cover group-hover:scale-105 transition" />}
                {p.views != null && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Eye className="w-3 h-3" />{num(p.views)}</span>}
              </a>
            ))}
          </div>
        )}

        {/* média de views + ER + crescimento */}
        <Card title="Média de visualizações por post">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-black text-foreground">{num(last?.avg_views)}</p>
            {last && <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${q.cls}`}>{q.label}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Stat label="Engajamento sobre views" value={pct(last?.er_by_views)} hint={isIG ? '(curtidas + comentários) ÷ views dos vídeos' : '(curtidas + comentários + compartilhamentos) ÷ views'} />
            <Stat label="Crescimento de seguidores (30 dias)" value={growth?.pct == null ? '—' : `${growth.pct > 0 ? '+' : ''}${pct(growth.pct)}`} hint={growth ? `${growth.delta > 0 ? '+' : ''}${growth.delta.toLocaleString('pt-BR')} desde ${date(growth.from)}` : 'Precisa de 2 medições com intervalo'} />
          </div>
          {last && <p className="text-[11px] text-muted-foreground">Médias de {last.posts_analyzed} publicações{last.period_days ? ` dos últimos ${last.period_days} dias` : ''} · posts fixados no topo não entram{isIG ? ' · no Instagram, views e engajamento sobre views contam só os vídeos (foto não tem view)' : ''}.</p>}
        </Card>

        {/* taxa de engajamento com faixas */}
        <Card title="Taxa de engajamento">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <p><span className="text-2xl font-black text-foreground">{pct(last?.er_by_views)}</span> <span className="text-xs text-muted-foreground">sobre views</span></p>
            <p><span className="text-lg font-bold text-foreground">{pct(last?.er_by_followers)}</span> <span className="text-xs text-muted-foreground">sobre seguidores</span></p>
          </div>
          <ErBar er={last?.er_by_views ?? null} />
          <p className="text-[11px] text-muted-foreground">Faixas do selo Squad UGC (engajamento sobre views). Não comparamos com outros creators porque ainda não temos base para isso.</p>
        </Card>

        {/* alcance + médias + alertas */}
        <Card title="Alcance e médias por post">
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-2xl font-black text-foreground">{pct(reach)}</p>
            <p className="text-xs text-muted-foreground">{reach == null ? 'dos seguidores veem cada vídeo' : `dos seguidores veem cada vídeo (média de ${num(last?.avg_views)} views para ${num(last?.followers)} seguidores)`}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Stat label="Views" value={num(last?.avg_views)} icon={<Eye className="w-3.5 h-3.5" />} />
            <Stat label="Curtidas" value={num(last?.avg_likes)} icon={<Heart className="w-3.5 h-3.5" />} warn={commentsOverLikes} />
            <Stat label="Comentários" value={num(last?.avg_comments)} icon={<MessageCircle className="w-3.5 h-3.5" />} warn={alerts.length > 0 && alerts.some((a) => a.key !== 'er_too_high')} />
            <Stat label="Compartilhamentos" value={num(last?.avg_shares)} icon={<Share2 className="w-3.5 h-3.5" />} hint={isIG && last ? 'O Instagram não informa' : undefined} />
          </div>
          {alerts.length > 0 && (
            <ul className="space-y-2" aria-label="Alertas de engajamento">
              {alerts.map((a) => (
                <li key={a.key} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong className="text-amber-900">{a.title}.</strong> <span className="text-foreground">{a.why}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* crescimento */}
        <Card title="Histórico de seguidores">
          {history.length < 2 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />O gráfico aparece a partir da segunda medição (cada coleta guarda os seguidores daquele dia).</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => num(v)} />
                  <Tooltip formatter={(v) => [Number(v).toLocaleString('pt-BR'), 'Seguidores']} />
                  <Line type="monotone" dataKey="seguidores" stroke="#111" strokeWidth={2} dot={{ r: 3, fill: '#DFE82A', stroke: '#111' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* publis */}
          <Card title="Publis nos últimos 180 dias">
            <p className="text-2xl font-black text-foreground">{last?.paid_posts_180d == null ? '—' : last.paid_posts_180d}</p>
            <p className="text-[11px] text-muted-foreground">{last?.paid_posts_180d == null ? 'Não informado pela coleta.' : 'Posts com marcação de parceria paga ou #publi/#ad/#parceriapaga, entre os analisados.'}</p>
            {last && last.top_hashtags?.length > 0 && <p className="text-[11px] text-muted-foreground">Hashtags mais usadas: {last.top_hashtags.slice(0, 6).map((h) => `#${h}`).join(' ')}</p>}
          </Card>
          {/* preço: reservado, sem número até existir base real */}
          <Card title="Faixa de preço">
            <p className="text-2xl font-black text-muted-foreground">—</p>
            <p className="text-[11px] text-muted-foreground">Aparece quando houver cachês reais de campanhas pagas na plataforma para comparar. Não estimamos preço.</p>
          </Card>
        </div>

        {/* o que medimos de verdade */}
        {last && (
          <Card title="O que medimos">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {['Seguidores no dia da coleta', isIG ? 'Curtidas e comentários por post; views dos vídeos' : 'Views, curtidas, comentários e compartilhamentos por post', 'Engajamento sobre views e sobre seguidores', 'Alcance (views ÷ seguidores)', 'Sinais de engajamento atípico', 'Publis marcadas e hashtags'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{t}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{isIG ? 'Instagram' : 'TikTok'} · medido em {date(last.collected_at)} · {last.posts_analyzed} posts analisados. Não medimos demografia nem autenticidade da audiência.</p>
          </Card>
        )}
        </>)}
      </div>
    </div>
  );
};
