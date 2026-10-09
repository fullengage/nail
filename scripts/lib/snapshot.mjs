// Posts do Apify → snapshot de creator_metrics (TikTok e Instagram). Fórmulas em src/lib/creatorQuality.ts.
import { computeMetrics } from '../../src/lib/creatorQuality.ts';

export const POSTS = 12; // vídeos por perfil na coleta (decisão: 12 = média estável a ~US$ 0,036/creator)
export const MIN_POSTS = 3; // menos que isso não é média: fica "Ainda não medido"
const PAID_TAGS = /^(publi|ad|ads|parceriapaga|publicidade|patrocinado|sponsored)$/i;
const DAY = 86400000;
const byDate = (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0);

function extras(posts, now) {
  const tagCount = {};
  posts.flatMap((p) => p.hashtags).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; });
  const recent180 = posts.filter((p) => p.created_at && now - Date.parse(p.created_at) <= 180 * DAY);
  return {
    paid_posts_180d: posts.some((p) => p.paidKnown) ? recent180.filter((p) => p.paid).length : null,
    top_hashtags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t),
    recent_posts: posts.slice(0, 6).map((p) => ({ url: p.url, cover: p.cover, views: p.views, created_at: p.created_at })),
  };
}

// ---------- TikTok (clockworks free-tiktok-scraper / tiktok-scraper) ----------
export function postOf(v) {
  return {
    views: v.playCount || 0, likes: v.diggCount || 0, comments: v.commentCount || 0, shares: v.shareCount || 0,
    created_at: v.createTimeISO || (v.createTime ? new Date(v.createTime * 1000).toISOString() : null),
    url: v.webVideoUrl || null, cover: v.videoMeta?.coverUrl || v.videoMeta?.originalCoverUrl || null,
    hashtags: (v.hashtags || []).map((h) => (h.name || '').toLowerCase()).filter(Boolean),
    // parceria paga: flag do TikTok ou hashtag #publi/#ad/#parceriapaga
    paid: v.isAd === true || v.isSponsored === true || (v.hashtags || []).some((h) => PAID_TAGS.test(h.name || '')),
    paidKnown: 'isAd' in v || 'isSponsored' in v || Array.isArray(v.hashtags),
    pinned: v.isPinned === true,
  };
}
export function snapshotOf(videos, now = Date.now()) {
  // vídeos fixados no topo são antigos e costumam ser os mais virais: ficam fora da média
  const posts = videos.map(postOf).filter((p) => !p.pinned).sort(byDate).slice(0, POSTS);
  const followers = videos.find((v) => v.authorMeta?.fans != null)?.authorMeta.fans ?? null;
  return { platform: 'tiktok', followers, ...computeMetrics(posts, followers), ...extras(posts, now) };
}

// ---------- Instagram (apify instagram-profile-scraper: perfil com latestPosts) ----------
// Instagram não informa compartilhamentos (fica null) e só vídeo tem views:
// views e engajamento sobre views vêm só dos vídeos; curtidas, comentários e ER/seguidores, de todos os posts.
// Post com curtidas ocultas (likesCount < 0) fica fora.
export function igSnapshotOf(profile, now = Date.now()) {
  const posts = (profile.latestPosts || [])
    .filter((p) => !p.isPinned && p.likesCount >= 0)
    .map((p) => ({
      views: p.videoViewCount || 0, likes: p.likesCount || 0, comments: Math.max(0, p.commentsCount || 0), shares: 0,
      created_at: p.timestamp || null, url: p.url || null, cover: p.displayUrl || null,
      hashtags: (p.hashtags || []).map((h) => String(h).toLowerCase()),
      paid: p.paidPartnership === true || (p.hashtags || []).some((h) => PAID_TAGS.test(String(h))),
      paidKnown: 'paidPartnership' in p || Array.isArray(p.hashtags),
      video: p.videoViewCount > 0,
    }))
    .sort(byDate).slice(0, POSTS);
  const followers = profile.followersCount ?? null;
  const all = computeMetrics(posts, followers);
  const vids = computeMetrics(posts.filter((p) => p.video), followers);
  return {
    platform: 'instagram', followers, ...all,
    avg_views: vids.avg_views, er_by_views: vids.er_by_views, avg_shares: null,
    ...extras(posts, now),
    recent_posts: posts.slice(0, 6).map((p) => ({ url: p.url, cover: p.cover, views: p.video ? p.views : null, created_at: p.created_at })),
  };
}

// auto-checagem (caso @agar293 no TikTok; Instagram com foto + vídeo)
{
  const v = { playCount: 1500, diggCount: 396, commentCount: 1000, shareCount: 287, createTimeISO: new Date().toISOString(), authorMeta: { fans: 19700 }, hashtags: [{ name: 'publi' }], isAd: false };
  const s = snapshotOf([v, { ...v, hashtags: [] }]);
  console.assert(s.er_by_views === 112.2 && s.er_by_followers === 8.54, 'ER', s);
  console.assert(s.avg_views === 1500 && s.posts_analyzed === 2, 'médias', s);
  console.assert(s.paid_posts_180d === 1, 'publi pela hashtag', s);
  console.assert(snapshotOf([{ playCount: 10, diggCount: 1, commentCount: 0, shareCount: 0 }]).paid_posts_180d === null, 'sem campo de parceria → null');
  console.assert(snapshotOf([v, { ...v, playCount: 999999, isPinned: true }]).avg_views === 1500, 'fixado fora da média');
  const ig = igSnapshotOf({ followersCount: 1000, latestPosts: [
    { likesCount: 100, commentsCount: 10, videoViewCount: 2000, timestamp: '2026-10-01T00:00:00Z', hashtags: [] },
    { likesCount: 50, commentsCount: 0, timestamp: '2026-09-30T00:00:00Z', hashtags: ['publi'] },
    { likesCount: -1, commentsCount: 5, timestamp: '2026-09-29T00:00:00Z' },
  ] }, Date.parse('2026-10-06'));
  console.assert(ig.posts_analyzed === 2 && ig.avg_likes === 75 && ig.avg_comments === 5, 'IG médias sem curtida oculta', ig);
  console.assert(ig.avg_views === 2000 && ig.er_by_views === 5.5, 'IG views só de vídeo', ig);
  console.assert(ig.er_by_followers === 8 && ig.avg_shares === null && ig.paid_posts_180d === 1, 'IG ER/seg, sem compart., publi', ig);
}
