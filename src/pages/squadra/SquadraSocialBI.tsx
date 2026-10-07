import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { supabaseService } from '../../services/supabaseService';
import { metricsQuality, reachPct, sizeOf, SIZES, suspicionAlerts, type SizeKey } from '../../lib/creatorQuality';
import { TikTokLink, InstagramLink } from '../../components/ui/TikTokLink';
import type { CreatorMetrics, CreatorProfile } from '../../types/database';

// BI de redes sociais: só medições reais (creator_metrics, última coleta por creator e rede).
// Medianas (não médias) para um viral não distorcer o grupo. Sem medição: "—".

const num = (v: number | null | undefined) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : Math.round(v).toLocaleString('pt-BR'));
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`);
function median(xs: (number | null | undefined)[]): number | null {
  const s = xs.filter((x): x is number => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

type Row = CreatorMetrics & { c: CreatorProfile | undefined; reach: number | null; q: ReturnType<typeof metricsQuality>; alerts: ReturnType<typeof suspicionAlerts> };
const QUALITY_ORDER: [string, string][] = [['alta', 'Audiência engajada (3–40%)'], ['real', 'Audiência real (1–3%)'], ['baixa', 'Engajamento baixo (0,1–1%)'], ['suspeita', 'Audiência suspeita (< 0,1%)'], ['verificar', 'Atípico / fora da curva']];
const SORTS = { er: 'Engajamento sobre views', views: 'Média de views', reach: 'Alcance', followers: 'Seguidores' } as const;

const Tile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="p-4 rounded-2xl bg-card border border-border">
    <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
    <p className="text-2xl font-black text-foreground">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);
const Th: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => <th className={`px-2 py-1.5 font-bold text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
const Td: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => <td className={`px-2 py-1.5 ${right ? 'text-right tabular-nums' : ''}`}>{children}</td>;

// tabela de grupo (porte, nicho): mesmas colunas, medianas
const GroupTable: React.FC<{ title: string; groups: [string, Row[]][] }> = ({ title, groups }) => (
  <section className="p-4 rounded-2xl bg-card border border-border space-y-2 overflow-x-auto">
    <h2 className="text-sm font-bold text-foreground">{title}</h2>
    <table className="w-full text-xs">
      <thead><tr className="border-b border-border"><Th>Grupo</Th><Th right>Creators</Th><Th right>Seguidores</Th><Th right>Views/post</Th><Th right>Engaj. s/ views</Th><Th right>Alcance</Th></tr></thead>
      <tbody className="divide-y divide-border">
        {groups.map(([g, rs]) => (
          <tr key={g}><Td>{g}</Td><Td right>{rs.length}</Td><Td right>{num(median(rs.map((r) => r.followers)))}</Td><Td right>{num(median(rs.map((r) => r.avg_views)))}</Td><Td right>{pct(median(rs.map((r) => r.er_by_views)))}</Td><Td right>{pct(median(rs.map((r) => r.reach)))}</Td></tr>
        ))}
      </tbody>
    </table>
    <p className="text-[10px] text-muted-foreground">Medianas da última medição de cada creator.</p>
  </section>
);

export const SquadraSocialBI: React.FC = () => {
  const { creators } = useData();
  const [metrics, setMetrics] = useState<CreatorMetrics[] | null>(null);
  const [status, setStatus] = useState<'migracao' | 'login' | null>(null);
  const [platform, setPlatform] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [sort, setSort] = useState<keyof typeof SORTS>('er');
  useEffect(() => { supabaseService.getLatestMetrics().then((r) => { setMetrics(r.rows); setStatus(r.error); }); }, []);

  const byId = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);
  const rows: Row[] = useMemo(() => (metrics || [])
    .filter((m) => platform === 'all' || m.platform === platform)
    .map((m) => ({ ...m, c: byId.get(m.creator_id), reach: reachPct(m.avg_views, m.followers), q: metricsQuality(m, { engagement_rate: 0 }), alerts: suspicionAlerts(m) })), [metrics, platform, byId]);

  if (metrics == null) return <p className="py-20 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Carregando medições…</p>;

  const measured = new Set(rows.map((r) => r.creator_id)).size;
  const base = creators.filter((c) => !(c.tags || []).includes('teste')).length;
  const quality = QUALITY_ORDER.map(([k, l]) => [l, rows.filter((r) => r.q.key === k).length] as const);
  const qMax = Math.max(1, ...quality.map(([, n]) => n));
  const bySize = (Object.keys(SIZES) as SizeKey[]).map((k) => [SIZES[k].label, rows.filter((r) => r.followers != null && sizeOf(r.followers) === k)] as [string, Row[]]).filter(([, rs]) => rs.length);
  const nicheMap = new Map<string, Row[]>();
  rows.forEach((r) => { const n = r.c?.specialties?.[0] || 'Sem nicho informado'; nicheMap.set(n, [...(nicheMap.get(n) || []), r]); });
  const byNiche = [...nicheMap].sort((a, b) => b[1].length - a[1].length).slice(0, 12);
  // ranking: só quem tem engajamento confiável (sem alerta, faixa real ou engajada)
  const key = { er: 'er_by_views', views: 'avg_views', reach: 'reach', followers: 'followers' }[sort] as 'er_by_views' | 'avg_views' | 'reach' | 'followers';
  const ranking = rows.filter((r) => ['alta', 'real'].includes(r.q.key) && (r[key] ?? null) != null).sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, 30);
  const suspicious = rows.filter((r) => r.alerts.length || r.q.key === 'suspeita');
  const dates = rows.map((r) => r.collected_at).sort();

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">BI de redes sociais</h1>
          <p className="text-xs text-muted-foreground">Medições reais dos posts de cada creator{dates.length ? ` · coletas de ${new Date(dates[0]).toLocaleDateString('pt-BR')} a ${new Date(dates[dates.length - 1]).toLocaleDateString('pt-BR')}` : ''}.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit" role="tablist" aria-label="Rede">
          {([['all', 'Todas'], ['tiktok', 'TikTok'], ['instagram', 'Instagram']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={platform === k} onClick={() => setPlatform(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${platform === k ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{l}</button>
          ))}
        </div>
      </div>

      {status && <p role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800">{status === 'migracao' ? 'A tabela de medições ainda não existe no banco: rode a migração 20261007_creator_metrics no Supabase.' : 'Entre com a conta de administrador para ver as medições.'}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile label="Creators medidos" value={measured.toLocaleString('pt-BR')} hint={base ? `de ${base.toLocaleString('pt-BR')} na base (${pct((measured / base) * 100)})` : undefined} />
        <Tile label="Engajamento s/ views" value={pct(median(rows.map((r) => r.er_by_views)))} hint="mediana" />
        <Tile label="Alcance" value={pct(median(rows.map((r) => r.reach)))} hint="mediana · views ÷ seguidores" />
        <Tile label="Views por post" value={num(median(rows.map((r) => r.avg_views)))} hint="mediana" />
        <Tile label="Com sinal suspeito" value={suspicious.length.toLocaleString('pt-BR')} hint={rows.length ? `${pct((suspicious.length / rows.length) * 100)} dos medidos` : undefined} />
      </div>

      {rows.length === 0 ? (
        <p className="p-6 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Nenhuma medição {platform === 'all' ? '' : `de ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} `}ainda. Rode <code>scripts/importar-metricas-apify.mjs --apply</code> ou o coletor de TikTok.</p>
      ) : (<>
        <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
          <h2 className="text-sm font-bold text-foreground">Qualidade da audiência (creators por faixa de engajamento)</h2>
          <ul className="space-y-1.5">
            {quality.map(([l, n]) => (
              <li key={l} className="grid grid-cols-[190px_1fr_60px] items-center gap-2 text-xs" title={`${l}: ${n} creators (${pct((n / rows.length) * 100)})`}>
                <span className="text-muted-foreground">{l}</span>
                <span className="h-4 rounded-r bg-muted"><span className="block h-4 rounded-r bg-foreground" style={{ width: `${(n / qMax) * 100}%` }} /></span>
                <span className="text-right font-bold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground">Faixas do selo Squad UGC sobre o engajamento por view. "Atípico" = mais comentários que curtidas, comentários demais para as views ou engajamento acima de 40%.</p>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GroupTable title="Por porte" groups={bySize} />
          <GroupTable title="Por nicho (12 maiores)" groups={byNiche} />
        </div>

        <section className="p-4 rounded-2xl bg-card border border-border space-y-2 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-foreground">Ranking (30 primeiros, só audiência real ou engajada)</h2>
            <select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="px-2 py-1 rounded-lg border border-border bg-background text-xs">
              {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border"><Th>#</Th><Th>Creator</Th><Th>Rede</Th><Th right>Seguidores</Th><Th right>Views/post</Th><Th right>Engaj. s/ views</Th><Th right>Alcance</Th><Th right>Posts</Th></tr></thead>
            <tbody className="divide-y divide-border">
              {ranking.map((r, i) => (
                <tr key={r.id}>
                  <Td>{i + 1}</Td>
                  <Td><span className="font-bold">{r.c?.professional_name || '—'}</span> <span className="text-muted-foreground">{r.platform === 'tiktok' ? <TikTokLink handle={r.c?.tiktok} /> : <InstagramLink handle={r.c?.instagram} />}</span></Td>
                  <Td>{r.platform === 'tiktok' ? 'TikTok' : 'Instagram'}</Td>
                  <Td right>{num(r.followers)}</Td><Td right>{num(r.avg_views)}</Td><Td right>{pct(r.er_by_views)}</Td><Td right>{pct(r.reach)}</Td><Td right>{r.posts_analyzed}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {suspicious.length > 0 && (
          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-700" />Conferir antes de contratar ({suspicious.length})</h2>
            <ul className="divide-y divide-border text-xs max-h-80 overflow-y-auto">
              {suspicious.slice(0, 100).map((r) => (
                <li key={r.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                  <span><strong>{r.c?.professional_name || '—'}</strong> · {r.platform === 'tiktok' ? 'TikTok' : 'Instagram'} · {num(r.followers)} seguidores</span>
                  <span className="text-amber-800">{r.alerts.length ? r.alerts.map((a) => a.title).join(' · ') : `Engajamento ${pct(r.er_by_views)}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>)}

      <p className="text-[11px] text-muted-foreground">Não medimos demografia, autenticidade da audiência nem preço: não há base real para isso ainda. Instagram não informa compartilhamentos e só vídeo tem views.</p>
    </div>
  );
};
