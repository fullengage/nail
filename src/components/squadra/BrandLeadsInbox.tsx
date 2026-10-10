import React, { useEffect, useState } from 'react';
import { supabaseService } from '../../services/supabaseService';

// Caixa de entrada das marcas que se candidataram pelo site (ncp_brand_leads).
// A leitura é só de admin (RLS); para os demais a consulta volta vazia e o bloco some.
// Pedidos de projeto de PDV (origin = pdv_projeto) continuam na tela de PDVs.
const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em contato',
  proposta: 'Proposta enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export const BrandLeadsInbox: React.FC = () => {
  const [state, setState] = useState<{ rows: any[]; error?: string } | null>(null);

  useEffect(() => {
    supabaseService.getBrandLeads().then((res) =>
      setState({ ...res, rows: res.rows.filter((l) => l.origin !== 'pdv_projeto') })
    );
  }, []);

  if (!state || state.error === 'sem_permissao') return null;

  const novos = state.rows.filter((l) => (l.status || 'novo') === 'novo').length;

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">Marcas que pediram contato pelo site</p>
          <p className="text-xs text-muted-foreground">Responder em até 48h úteis, como o formulário promete.</p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          {state.rows.length} recebidos · {novos} sem resposta
        </span>
      </div>
      {state.error === 'sem_tabela' && (
        <p className="p-4 text-xs text-amber-700">
          A tabela de leads ainda não existe no banco. Rode a migração <strong>20261004_leads_e_cache.sql</strong> no SQL Editor do Supabase.
        </p>
      )}
      {!state.error && state.rows.length === 0 && (
        <p className="p-4 text-xs text-muted-foreground">Nenhuma marca se candidatou ainda.</p>
      )}
      {state.rows.length > 0 && (
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {state.rows.map((l) => (
            <div key={l.id} className="px-4 py-3 text-xs grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-4">
                <p className="font-bold text-foreground">{l.company}</p>
                <p className="text-muted-foreground">
                  {l.name}{l.role ? ` · ${l.role}` : ''}
                </p>
                <p className="text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div className="md:col-span-4 text-muted-foreground space-y-0.5">
                <p>{l.category || '—'}</p>
                <p>{l.sales_channel || '—'}</p>
                <p>{l.budget_tier || '—'}</p>
              </div>
              <div className="md:col-span-4 space-y-0.5">
                <p className="font-semibold text-foreground">{STATUS_LABEL[l.status] || 'Novo'}</p>
                <a className="block hover:underline" href={`mailto:${l.email}`}>{l.email}</a>
                <a
                  className="block hover:underline"
                  href={`https://wa.me/55${String(l.whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.whatsapp}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
