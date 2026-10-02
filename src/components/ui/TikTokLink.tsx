import React from 'react';

// @handle → https://www.tiktok.com/@handle (aceita "@x", "x" ou URL completa)
export const tiktokUrl = (handle?: string | null): string | null => {
  const h = (handle || '').trim().replace(/^https?:\/\/(www\.)?tiktok\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
  return h ? `https://www.tiktok.com/@${h}` : null;
};

// @ clicável; sem TikTok mostra o fallback (ex.: instagram) como texto
export const TikTokLink: React.FC<{ handle?: string | null; fallback?: string | null; className?: string }> = ({ handle, fallback, className = '' }) => {
  const url = tiktokUrl(handle);
  if (!url) return <span className={className}>{fallback}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()} // não dispara o clique da linha/card
      className={`hover:text-foreground hover:underline ${className}`}
    >
      @{url.split('@')[1]}
    </a>
  );
};

// @handle → https://www.instagram.com/handle (só quando o creator informou o Instagram)
export const instagramUrl = (handle?: string | null): string | null => {
  const h = (handle || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
  return h ? `https://www.instagram.com/${h}` : null;
};

export const InstagramLink: React.FC<{ handle?: string | null; className?: string }> = ({ handle, className = '' }) => {
  const url = instagramUrl(handle);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={`hover:text-foreground hover:underline ${className}`}>
      IG @{url.split('.com/')[1]}
    </a>
  );
};
