import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SB_URL || !SB_KEY) {
  console.error('Falta VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SB_URL, SB_KEY);

const handleOf = (h) => (h || '').replace(/^@/, '').trim().toLowerCase();
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function computeMetrics(posts, followers) {
  const n = posts.length;
  if (!n) {
    return {
      posts_analyzed: 0,
      period_days: null,
      avg_views: null,
      avg_likes: null,
      avg_comments: null,
      avg_shares: null,
      er_by_views: null,
      er_by_followers: null,
    };
  }

  const v = avg(posts.map((p) => p.views || 0));
  const l = avg(posts.map((p) => p.likes || 0));
  const c = avg(posts.map((p) => p.comments || 0));
  const s = avg(posts.map((p) => p.shares || 0));
  const inter = (l || 0) + (c || 0) + (s || 0);

  const dates = posts
    .map((p) => (p.created_at ? Date.parse(p.created_at) : NaN))
    .filter((d) => !Number.isNaN(d));

  return {
    posts_analyzed: n,
    period_days:
      dates.length > 1
        ? Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000))
        : null,
    avg_views: v == null ? null : r2(v),
    avg_likes: l == null ? null : r2(l),
    avg_comments: c == null ? null : r2(c),
    avg_shares: s == null ? null : r2(s),
    er_by_views: inter != null && v > 0 ? r2((inter / v) * 100) : null,
    er_by_followers: inter != null && followers > 0 ? r2((inter / followers) * 100) : null,
  };
}

const PAID_TAGS = /^(publi|ad|ads|parceriapaga|publicidade|patrocinado|sponsored)$/i;
const DAY = 86400000;

async function run() {
  console.log('--- 1. Carregando creators do banco ---');
  const creators = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('creators')
      .select('id, professional_name, tiktok, instagram, instagram_followers, tiktok_followers')
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    creators.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`Creators na base: ${creators.length}`);

  const dbTt = new Map();
  const dbIg = new Map();
  for (const c of creators) {
    if (c.tiktok) dbTt.set(handleOf(c.tiktok), c);
    if (c.instagram) dbIg.set(handleOf(c.instagram), c);
  }

  // --- 2. Coletando posts do TikTok dos arquivos locais ---
  console.log('--- 2. Lendo arquivos do TikTok ---');
  const ttVideosByCreator = new Map();
  const ttDirs = ['data/apify/free-tiktok-scraper', 'data/apify/tiktok-scraper'];
  for (const d of ttDirs) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.json')) continue;
      try {
        const arr = JSON.parse(readFileSync(path.join(d, f), 'utf8'));
        if (Array.isArray(arr)) {
          for (const v of arr) {
            const u = handleOf(v.authorMeta?.name);
            if (dbTt.has(u)) {
              const c = dbTt.get(u);
              if (!ttVideosByCreator.has(c.id)) ttVideosByCreator.set(c.id, { creator: c, videos: [] });
              ttVideosByCreator.get(c.id).videos.push(v);
            }
          }
        }
      } catch (e) {}
    }
  }

  // tt-metricas.json
  if (existsSync('data/tt-metricas.json')) {
    try {
      const ttMet = JSON.parse(readFileSync('data/tt-metricas.json', 'utf8'));
      for (const [h, item] of Object.entries(ttMet)) {
        const u = handleOf(h);
        if (dbTt.has(u) && item.raw && Array.isArray(item.raw)) {
          const c = dbTt.get(u);
          if (!ttVideosByCreator.has(c.id)) ttVideosByCreator.set(c.id, { creator: c, videos: [] });
          ttVideosByCreator.get(c.id).videos.push(...item.raw);
        }
      }
    } catch (e) {}
  }
  console.log(`Creators com videos TikTok encontrados: ${ttVideosByCreator.size}`);

  // --- 3. Coletando posts do Instagram dos arquivos locais ---
  console.log('--- 3. Lendo arquivos do Instagram ---');
  const igPostsByCreator = new Map();
  const igDir = 'data/apify/instagram-profile-scraper';
  if (existsSync(igDir)) {
    for (const f of readdirSync(igDir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const arr = JSON.parse(readFileSync(path.join(igDir, f), 'utf8'));
        if (Array.isArray(arr)) {
          for (const p of arr) {
            const u = handleOf(p.username);
            if (dbIg.has(u) && p.latestPosts && p.latestPosts.length > 0) {
              const c = dbIg.get(u);
              if (!igPostsByCreator.has(c.id)) igPostsByCreator.set(c.id, { creator: c, profile: p });
            }
          }
        }
      } catch (e) {}
    }
  }
  console.log(`Creators com posts Instagram encontrados: ${igPostsByCreator.size}`);

  const rowsToInsert = [];
  const now = Date.now();

  // Gerar linhas do TikTok
  for (const [creatorId, { creator, videos }] of ttVideosByCreator) {
    // deduplicar vídeos por id / webVideoUrl
    const seen = new Set();
    const uniqueVids = [];
    for (const v of videos) {
      const vidKey = v.id || v.webVideoUrl || v.createTime;
      if (vidKey && seen.has(vidKey)) continue;
      if (vidKey) seen.add(vidKey);
      uniqueVids.push(v);
    }

    const posts = uniqueVids
      .map((v) => ({
        views: v.playCount || 0,
        likes: v.diggCount || 0,
        comments: v.commentCount || 0,
        shares: v.shareCount || 0,
        created_at: v.createTimeISO || (v.createTime ? new Date(v.createTime * 1000).toISOString() : null),
        url: v.webVideoUrl || null,
        cover: v.videoMeta?.coverUrl || v.videoMeta?.originalCoverUrl || null,
        hashtags: (v.hashtags || []).map((h) => (h.name || '').toLowerCase()).filter(Boolean),
        paid: v.isAd === true || v.isSponsored === true || (v.hashtags || []).some((h) => PAID_TAGS.test(h.name || '')),
        paidKnown: 'isAd' in v || 'isSponsored' in v || Array.isArray(v.hashtags),
        pinned: v.isPinned === true,
      }))
      .filter((p) => !p.pinned)
      .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0))
      .slice(0, 30);

    if (posts.length === 0) continue;

    const fans = uniqueVids.find((v) => v.authorMeta?.fans != null)?.authorMeta.fans ?? creator.tiktok_followers ?? null;
    const m = computeMetrics(posts, fans);

    const tagCount = {};
    posts.flatMap((p) => p.hashtags).forEach((t) => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    });

    const recent180 = posts.filter((p) => p.created_at && now - Date.parse(p.created_at) <= 180 * DAY);
    const paidPosts = posts.some((p) => p.paidKnown) ? recent180.filter((p) => p.paid).length : null;

    rowsToInsert.push({
      creator_id: creatorId,
      platform: 'tiktok',
      collected_at: posts[0]?.created_at || new Date().toISOString(),
      followers: fans,
      posts_analyzed: m.posts_analyzed,
      period_days: m.period_days,
      avg_views: m.avg_views,
      avg_likes: m.avg_likes,
      avg_comments: m.avg_comments,
      avg_shares: m.avg_shares,
      er_by_views: m.er_by_views,
      er_by_followers: m.er_by_followers,
      paid_posts_180d: paidPosts,
      top_hashtags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t),
      recent_posts: posts.slice(0, 6).map((p) => ({ url: p.url, cover: p.cover, views: p.views, created_at: p.created_at })),
    });
  }

  // Gerar linhas do Instagram
  for (const [creatorId, { creator, profile }] of igPostsByCreator) {
    const rawPosts = (profile.latestPosts || [])
      .map((p) => ({
        views: p.videoViewCount || p.videoPlayCount || (p.likesCount ? p.likesCount * 3 : 0),
        likes: p.likesCount || 0,
        comments: p.commentsCount || 0,
        shares: 0,
        created_at: p.timestamp || null,
        url: p.url || null,
        cover: p.displayUrl || null,
        hashtags: (p.hashtags || []).map((h) => h.toLowerCase()),
        paid: (p.hashtags || []).some((h) => PAID_TAGS.test(h)),
        pinned: p.isPinned === true,
      }))
      .filter((p) => !p.pinned)
      .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0))
      .slice(0, 30);

    if (rawPosts.length === 0) continue;

    const followers = profile.followersCount ?? creator.instagram_followers ?? null;
    const m = computeMetrics(rawPosts, followers);

    const tagCount = {};
    rawPosts.flatMap((p) => p.hashtags).forEach((t) => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    });

    const recent180 = rawPosts.filter((p) => p.created_at && now - Date.parse(p.created_at) <= 180 * DAY);

    rowsToInsert.push({
      creator_id: creatorId,
      platform: 'instagram',
      collected_at: rawPosts[0]?.created_at || new Date().toISOString(),
      followers,
      posts_analyzed: m.posts_analyzed,
      period_days: m.period_days,
      avg_views: m.avg_views,
      avg_likes: m.avg_likes,
      avg_comments: m.avg_comments,
      avg_shares: 0,
      er_by_views: m.er_by_views,
      er_by_followers: m.er_by_followers,
      paid_posts_180d: recent180.filter((p) => p.paid).length,
      top_hashtags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t),
      recent_posts: rawPosts.slice(0, 6).map((p) => ({ url: p.url, cover: p.cover, views: p.views, created_at: p.created_at })),
    });
  }

  console.log(`--- 4. Inserindo ${rowsToInsert.length} snapshots em creator_metrics ---`);
  
  // Limpar snapshots antigos se houver
  await supabase.from('creator_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const chunk = rowsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('creator_metrics').insert(chunk);
    if (error) {
      console.error(`Erro ao inserir lote ${i}:`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`Gravados: ${inserted}/${rowsToInsert.length}\r`);
    }
  }

  console.log(`\nFinalizado com sucesso! ${inserted} snapshots salvos no banco Supabase.`);
}

run().catch((err) => {
  console.error('Falha na execução:', err);
  process.exit(1);
});
