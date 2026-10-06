// Fórmulas de métricas do creator. Rodar: node --experimental-strip-types scripts/creatorMetrics.check.mts
import { computeMetrics, reachPct, growth30d, suspicionAlerts, metricsQuality, audienceQuality } from '../src/lib/creatorQuality.ts';
const a = (c: unknown, m: string) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok', m); };
// caso real @agar293: ~19,7 mil seguidores, médias 1,5 mil views, 396 curtidas, 1 mil comentários, 287 compartilhamentos
const agar = computeMetrics([{ views: 1500, likes: 396, comments: 1000, shares: 287 }], 19700);
a(agar.er_by_views! > 100 && Math.abs(agar.er_by_views! - 112.2) < 0.01, `ER por views ${agar.er_by_views}% (> 100%)`);
a(Math.abs(agar.er_by_followers! - 8.54) < 0.01, `ER por seguidores ${agar.er_by_followers}%`);
const reach = reachPct(agar.avg_views, 19700)!;
a(reach > 7 && reach < 8, `alcance ${reach}% (7–8%)`);
const al = suspicionAlerts(agar);
a(al.length === 3, `3 alertas: ${al.map((x) => x.key).join(', ')}`);
const q = metricsQuality(agar, { engagement_rate: 6 });
a(q.key !== 'alta' && q.label !== 'Audiência engajada', `@agar293 não é "Audiência engajada" (${q.label})`);
// perfil saudável: ER 5% por views, sem alerta
const ok = computeMetrics([{ views: 10000, likes: 400, comments: 20, shares: 80 }, { views: 8000, likes: 300, comments: 10, shares: 40 }], 50000);
a(ok.avg_views === 9000 && ok.er_by_views === 4.72 && suspicionAlerts(ok).length === 0, `perfil saudável sem alerta (ER ${ok.er_by_views}%)`);
a(metricsQuality(ok, { engagement_rate: 0 }).key === 'alta', 'perfil saudável = Audiência engajada');
// sem posts / sem seguidores: nada inventado
const vazio = computeMetrics([], 1000);
a(vazio.avg_views === null && vazio.er_by_views === null && vazio.posts_analyzed === 0, 'sem posts → null');
a(reachPct(1000, 0) === null, 'sem seguidores → alcance null');
// crescimento
a(growth30d([{ collected_at: '2026-10-01', followers: 100 }]) === null, '1 coleta → crescimento null');
const g = growth30d([{ collected_at: '2026-10-05', followers: 20000 }, { collected_at: '2026-09-05', followers: 19000 }, { collected_at: '2026-08-01', followers: 15000 }])!;
a(g.delta === 1000 && g.pct === 5.26, `crescimento usa o snapshot ~30 dias antes (+${g.pct}%)`);
// compatível com quem só tem engagement_rate
a(audienceQuality({ engagement_rate: 4 }).key === 'alta' && metricsQuality(null, { engagement_rate: 4 }).key === 'alta', 'sem snapshot usa engagement_rate');
