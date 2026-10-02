import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ScoreWeights } from '../../types/database';
import {
  Sliders,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Mail,
  UserPlus,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SquadraSettings: React.FC = () => {
  const { scoreWeights, setScoreWeights } = useData();

  // Pesos editáveis
  const [weights, setWeights] = useState<ScoreWeights>(scoreWeights);
  const [activeTab, setActiveTab] = useState<'weights' | 'users' | 'integrations'>('weights');

  // Convite de novo usuário
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'brand_admin' | 'manager' | 'analyst' | 'creator'>('manager');

  // Usuários cadastrados (mock demonstrativo coerente)
  const [userList, setUserList] = useState([
    { id: '1', name: 'Richard Wagner (Admin Master)', email: 'admin@squadra.com.br', role: 'admin_master', status: 'Ativo' },
    { id: '2', name: 'Camila Brand Manager', email: 'camila@glamgel.com.br', role: 'brand_admin', status: 'Ativo' },
    { id: '3', name: 'Lucas Analista de Campanhas', email: 'lucas@squadra.com.br', role: 'analyst', status: 'Ativo' },
    { id: '4', name: 'Mariana Gestora de Squads', email: 'mariana@squadra.com.br', role: 'manager', status: 'Ativo' }
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const totalWeight = weights.engagement + weights.audience + weights.nicheMatch + weights.deliveryHistory + weights.quality;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      showToast('A soma dos pesos deve totalizar exatamente 100%!');
      return;
    }
    setScoreWeights(weights);
    showToast('Pesos da Pontuação Operacional salvos com sucesso!');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setUserList([
      ...userList,
      {
        id: String(Date.now()),
        name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'Convite Enviado'
      }
    ]);

    setInviteEmail('');
    showToast(`Convite de acesso enviado para ${inviteEmail}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          Configurações da Plataforma
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Ajuste de pesos do algoritmo de pontuação operacional, permissões de usuários e integrações.
        </p>
      </div>

      {/* 2. Abas */}
      <div className="flex border-b border-border space-x-2 pb-px overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('weights')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'weights' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pesos do Score Operacional</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Papéis ({userList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'integrations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Integrações (APIs)</span>
        </button>
      </div>

      {/* ABA 1: PESOS DA PONTUAÇÃO OPERACIONAL */}
      {activeTab === 'weights' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-foreground">
                  Pesos da Pontuação Operacional (Match Score 0–100)
                </h3>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                  totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  Total: {totalWeight}% / 100%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure a relevância de cada pilar para a classificação automática dos creators na sua organização.
              </p>
            </div>

            <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
              
              {/* Engajamento */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Taxa de Engajamento (%)</span>
                  <span className="text-primary">{weights.engagement}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.engagement}
                  onChange={(e) => setWeights({ ...weights, engagement: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Tamanho da Audiência */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Volume de Seguidores & Alcance</span>
                  <span className="text-primary">{weights.audience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.audience}
                  onChange={(e) => setWeights({ ...weights, audience: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Aderência de Nicho */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Aderência ao Nicho da Marca</span>
                  <span className="text-primary">{weights.nicheMatch}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.nicheMatch}
                  onChange={(e) => setWeights({ ...weights, nicheMatch: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Histórico de Entregas */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Histórico de Pontualidade & Cumprimento de Briefing</span>
                  <span className="text-primary">{weights.deliveryHistory}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.deliveryHistory}
                  onChange={(e) => setWeights({ ...weights, deliveryHistory: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Qualidade Técnica */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Qualidade Técnica (Áudio, Iluminação, Enquadramento)</span>
                  <span className="text-primary">{weights.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.quality}
                  onChange={(e) => setWeights({ ...weights, quality: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={totalWeight !== 100} className="w-full">
                  Salvar Pesos Operacionais
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ABA 2: USUÁRIOS & PAPÉIS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Formulário de Convite */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-foreground">Convidar Novo Usuário</h3>
            
            <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-foreground">E-mail do Convidado</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@marca.com.br"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Papel (Role)</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none"
                >
                  <option value="brand_admin">Admin da Marca</option>
                  <option value="manager">Gerente de Squad</option>
                  <option value="analyst">Analista de Conteúdo</option>
                  <option value="creator">Creator Convidado</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-1 flex justify-end">
                <Button type="submit" className="flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Enviar Convite de Acesso</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Tabela de Usuários */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <h3 className="text-base font-bold font-display text-foreground mb-4">Membros da Organização</h3>
            
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Usuário</th>
                  <th className="pb-3 text-left">E-mail</th>
                  <th className="pb-3 text-left">Papel</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 pl-2 font-bold text-foreground">{u.name}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">
                      <span className="font-mono uppercase font-bold text-[11px] text-primary">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ABA 3: INTEGRAÇÕES "EM BREVE" */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Em Breve
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              TT
            </div>
            <div>
              <h3 className="font-bold font-display text-foreground text-sm">TikTok for Business API</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sincronização automática de métricas de views, retenção e autenticação de contas de creators.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Em Breve
            </span>
            <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold">
              IG
            </div>
            <div>
              <h3 className="font-bold font-display text-foreground text-sm">Instagram / Meta Graph API</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Coleta nativa de Stories, Reels e insights de engajamento com menção à marca.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Em Breve
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              TS
            </div>
            <div>
              <h3 className="font-bold font-display text-foreground text-sm">TikTok Shop Seller API</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Atribuição de comissões em tempo real nas compras feitas dentro das lives e vídeos.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Em Breve
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              WPP
            </div>
            <div>
              <h3 className="font-bold font-display text-foreground text-sm">WhatsApp Cloud API</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Disparo automatizado de convites de briefing, avisos de envio e lembretes de postagem.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Em Breve
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
              LOG
            </div>
            <div>
              <h3 className="font-bold font-display text-foreground text-sm">Melhor Envio & Correios</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Geração automática de etiquetas de frete reverso e rastreamento webhook de entrega.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
