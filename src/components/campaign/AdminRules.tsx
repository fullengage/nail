import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../services/campaignFlow';

// Admin: taxa e prazos da Squad (tabela squad_settings; o banco só aceita alteração de admin).
// Valem para campanhas publicadas depois da mudança (a taxa congela na publicação).
export const AdminRules: React.FC = () => {
  const [rows, setRows] = useState<{ key: string; value: number; label: string }[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    supabase?.from('squad_settings').select('key,value,label').order('key').then(({ data }) => setRows((data || []) as never));
  }, []);
  if (!rows.length) return null;
  const save = async () => {
    setMsg('');
    try {
      for (const r of rows) {
        const { error } = await supabase!.from('squad_settings').update({ value: r.value, updated_at: new Date().toISOString() }).eq('key', r.key);
        if (error) throw error;
      }
      setMsg('Regras salvas. Valem para campanhas publicadas a partir de agora.');
    } catch (e) { setMsg(humanError(e)); }
  };
  return (
    <details className="p-4 rounded-2xl bg-card border border-border text-xs">
      <summary className="font-bold cursor-pointer text-foreground">Regras da Squad (taxa e prazos)</summary>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((r, i) => (
          <label key={r.key} className="space-y-1">
            <span className="block font-bold text-foreground">{r.label}</span>
            <input type="number" min={0} value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} className="w-32 px-2 py-1.5 rounded-lg border border-border bg-background" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3"><Button size="sm" onClick={save}>Salvar regras</Button>{msg && <span role="status">{msg}</span>}</div>
    </details>
  );
};
