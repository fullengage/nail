import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SquadraReports: React.FC = () => {
  const { campaigns, creators } = useData();
  const { role } = useAuth();
  // Exportar relatório em CSV é restrito ao Admin Geral (evita exportação massiva por empresas)
  const canExportCsv = role === 'admin_master' || role === 'admin';

  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30d');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportReportCsv = () => {
    if (!canExportCsv) return;
    const headers = ['Relatório', 'Período', 'Plataforma', 'Nicho', 'Região', 'Total_Creators_Avaliados', 'Views_Totais', 'Engajamento_Medio', 'GMV_Total_R$'];
    const row = [
      '"Consolidado de Performance - Squad UGC"',
      filterPeriod,
      filterPlatform,
      filterNiche,
      filterRegion,
      creators.length,
      '2840000',
      '4.5%',
      '258450.00'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `squadra_relatorio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório exportado em CSV com sucesso!');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Relatórios & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Geração de relatórios cruzados por campanha, creator, plataforma, região e nicho de atuação.
          </p>
        </div>

        {canExportCsv && (
          <Button onClick={handleExportReportCsv} className="flex items-center space-x-1.5 shadow-md shadow-primary/20">
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Relatório CSV</span>
          </Button>
        )}
      </div>

      {/* 2. Filtros Cruzados */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parâmetros de Análise</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Campanha</label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Plataforma</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">Todas as Redes</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram (Reels & Stories)</option>
              <option value="youtube">YouTube Shorts</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Região / UF</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">Brasil Completo</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="PR">Paraná (PR)</option>
              <option value="RS">Rio Grande do Sul (RS)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Nicho</label>
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="all">Todos os Nichos</option>
              <option value="bem-estar">Bem-estar</option>
              <option value="academia">Academia & Fitness</option>
              <option value="alimentacao">Alimentação & Nutrição</option>
              <option value="beleza">Beleza & Unhas</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Período</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="year">Ano Atual (2026)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. Tabela Consolidada do Relatório */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="text-base font-bold font-display text-foreground">Resultados Consolidados da Amostra</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
            <span className="text-muted-foreground block text-[11px]">Creators Qualificados</span>
            <span className="text-xl font-bold font-display text-foreground">{creators.length}</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
            <span className="text-muted-foreground block text-[11px]">Alcance Estimado (Views)</span>
            <span className="text-xl font-bold font-display text-primary">2.84M</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
            <span className="text-muted-foreground block text-[11px]">Engajamento Médio</span>
            <span className="text-xl font-bold font-display text-emerald-600">4.52%</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
            <span className="text-muted-foreground block text-[11px]">Receita Atribuída (GMV)</span>
            <span className="text-xl font-bold font-display text-foreground">R$ 258.450,00</span>
          </div>
        </div>
      </div>

    </div>
  );
};
