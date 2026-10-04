import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { RetailPoint } from '../../types/database';
import { lookupCnpj, isValidCnpj, onlyDigits, formatCnpj, BULK_LIMIT, BULK_DELAY_MS } from '../../lib/brasilapi';
import {
  Store,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  MapPin,
  Building,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PdvMarketMap } from '../../components/squadra/PdvMarketMap';

export const SquadraRetail: React.FC = () => {
  const { retailPoints, sourceCounts, addRetailPoint, deleteRetailPoint, importRetailPointsCsv } = useData();
  const { role } = useAuth();
  // telefone/e-mail/gerente do PDV são só do time Squad UGC: empresas nunca veem
  const canSeeContacts = role === 'admin_master' || role === 'admin';
  // Importar e Exportar CSV são restritos exclusivamente ao Admin Geral (evita vazamento de base para empresas/contratantes)
  const canManageCsv = role === 'admin_master' || role === 'admin';
  // coluna CNPJ só quando há CNPJ real cadastrado (nada de placeholder)
  const hasCnpjLocal = retailPoints.some((p) => !!p.cnpj);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal Novo PDV
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const emptyPdv = {
    name: '',
    trade_name: '',
    network: '',
    cnpj: '',
    type: 'cosmetics' as RetailPoint['type'],
    status: 'active' as RetailPoint['status'],
    city: '',
    state: 'SP',
    address: '',
    phone: '',
    email: '',
    manager_name: ''
  };
  const [newPdv, setNewPdv] = useState(emptyPdv);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  // Busca o CNPJ na BrasilAPI (Receita Federal) e preenche o formulário
  const handleLookupCnpj = async () => {
    setCnpjInfo(null);
    if (!isValidCnpj(newPdv.cnpj)) {
      setCnpjInfo({ ok: false, text: 'CNPJ inválido. Confira os 14 dígitos.' });
      return;
    }
    if (retailPoints.some((r) => onlyDigits(r.cnpj || '') === onlyDigits(newPdv.cnpj)) || (serverMode && await supabaseService.retailCnpjExists(formatCnpj(newPdv.cnpj)))) {
      setCnpjInfo({ ok: false, text: 'Este CNPJ já está cadastrado nos seus PDVs.' });
      return;
    }
    setCnpjLoading(true);
    try {
      const r = await lookupCnpj(newPdv.cnpj);
      setNewPdv({ ...newPdv, ...r.point, manager_name: newPdv.manager_name });
      setCnpjInfo({ ok: r.point.status === 'active', text: `Receita Federal: ${r.situacao || 'situação não informada'} · ${r.cnae}` });
    } catch (err: any) {
      setCnpjInfo({ ok: false, text: err.message || 'Não foi possível consultar o CNPJ.' });
    } finally {
      setCnpjLoading(false);
    }
  };

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDeletePdv = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o PDV "${name}"? Os totais da rede e métricas em tempo real serão recalculados imediatamente.`)) {
      deleteRetailPoint(id);
      showToast(`PDV "${name}" removido com sucesso.`);
    }
  };

  // Base grande (mapeamento da Receita): busca, filtros, paginação e totais rodam no Supabase
  const [server, setServer] = useState<{ rows: RetailPoint[]; total: number } | null>(null);
  const [typeCounts, setTypeCounts] = useState<Record<string, number> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const serverMode = !!typeCounts && (typeCounts.total || 0) > 0;
  useEffect(() => {
    supabaseService.countRetailByType().then(setTypeCounts);
  }, [reloadKey]);
  useEffect(() => {
    if (!serverMode) return;
    const t = setTimeout(() => {
      supabaseService.queryRetailPoints({ q: search, state: selectedState, type: selectedType, page: currentPage, pageSize }).then((r) => r && setServer(r));
    }, 300); // espera o usuário parar de digitar
    return () => clearTimeout(t);
  }, [serverMode, search, selectedState, selectedType, currentPage, reloadKey]);
  const hasCnpj = serverMode || hasCnpjLocal;

  // Listas únicas para os selects
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  const statesList = useMemo(() => (serverMode ? UFS : Array.from(new Set(retailPoints.map(r => r.state))).sort()), [retailPoints, serverMode]);
  const networksList = useMemo(() => Array.from(new Set(retailPoints.map(r => r.network || r.name.split('-')[0].trim()))).sort(), [retailPoints]);

  // Filtragem local (modo pequeno, sem base mapeada)
  const filteredLocal = useMemo(() => {
    return retailPoints.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q) || (p.trade_name || '').toLowerCase().includes(q);
        const matchesCnpj = (p.cnpj || '').includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesManager = (p.manager_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCnpj && !matchesCity && !matchesManager) return false;
      }

      if (selectedState !== 'all' && p.state !== selectedState) return false;
      if (selectedType !== 'all' && p.type !== selectedType) return false;
      if (selectedNetwork !== 'all' && p.network !== selectedNetwork) return false;

      return true;
    });
  }, [retailPoints, search, selectedState, selectedType, selectedNetwork]);

  const totalFiltered = serverMode ? server?.total ?? 0 : filteredLocal.length;
  const totalAll = serverMode ? typeCounts?.total ?? 0 : retailPoints.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedPoints = useMemo(() => {
    if (serverMode) return server?.rows ?? [];
    const start = (currentPage - 1) * pageSize;
    return filteredLocal.slice(start, start + pageSize);
  }, [serverMode, server, filteredLocal, currentPage, pageSize]);
  // export: no modo banco exporta a página carregada (base inteira fica no CSV do mapeamento)
  const filteredPoints = serverMode ? paginatedPoints : filteredLocal;

  // Exportar CSV
  const handleExportCsv = () => {
    if (!canManageCsv) return;
    const headers = ['Nome', 'Rede', 'CNPJ', 'Tipo', 'Cidade', 'Estado', 'Endereco', ...(canSeeContacts ? ['Telefone', 'Email', 'Gerente'] : []), 'Status'];
    const rows = filteredPoints.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.network || '').replace(/"/g, '""')}"`,
      `"${p.cnpj || ''}"`,
      p.type,
      `"${p.city.replace(/"/g, '""')}"`,
      p.state,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      ...(canSeeContacts ? [`"${p.phone || ''}"`, `"${p.email || ''}"`, `"${(p.manager_name || '').replace(/"/g, '""')}"`] : []),
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `squadra_pdvs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${filteredPoints.length} PDVs exportados em CSV com sucesso!`);
  };

  // Importar CSV: aceita o formato completo ou só uma coluna de CNPJ (o resto vem da Receita via BrasilAPI)
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageCsv) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) return;
      const split = (l: string) => l.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''));
      const header = split(lines[0]).map(h => h.toLowerCase());
      const hasHeader = header.some(h => /nome|cnpj|cidade|rede/.test(h));
      const col = (name: RegExp, fallback: number) => {
        const i = header.findIndex(h => name.test(h));
        return hasHeader && i >= 0 ? i : hasHeader ? -1 : fallback;
      };
      const cnpjOnly = hasHeader && header.length === 1 && /cnpj/.test(header[0]);
      const idx = {
        name: cnpjOnly ? -1 : col(/^nome/, 0), network: col(/rede/, 1), cnpj: cnpjOnly ? 0 : col(/cnpj/, 2), type: col(/tipo/, 3),
        city: col(/cidade|munic/, 4), state: col(/^uf$|estado/, 5), address: col(/ender/, 6), phone: col(/telefone|fone/, 7),
        email: col(/e-?mail/, 8), manager: col(/gerente/, 9),
      };
      const get = (cols: string[], i: number) => (i >= 0 ? cols[i] || '' : '');

      const items: Partial<RetailPoint>[] = [];
      const toLookup: string[] = [];
      for (const line of lines.slice(hasHeader ? 1 : 0)) {
        const cols = split(line);
        const cnpj = get(cols, idx.cnpj) || (/^\d[\d./-]{13,17}$/.test(cols[0]) ? cols[0] : '');
        const name = get(cols, idx.name);
        const city = get(cols, idx.city);
        if ((!name || !city) && isValidCnpj(cnpj)) {
          toLookup.push(cnpj);
          continue;
        }
        if (!name) continue;
        items.push({
          name, network: get(cols, idx.network) || name, cnpj,
          type: (get(cols, idx.type) as RetailPoint['type']) || 'cosmetics',
          city, state: get(cols, idx.state).toUpperCase(), address: get(cols, idx.address),
          phone: get(cols, idx.phone), email: get(cols, idx.email), manager_name: get(cols, idx.manager),
        });
      }

      // completa pela BrasilAPI: no máximo BULK_LIMIT por vez, com intervalo (regras de uso da BrasilAPI)
      const known = new Set(retailPoints.map(r => onlyDigits(r.cnpj || '')));
      const queue = [...new Set(toLookup.map(onlyDigits))].filter(c => !known.has(c)).slice(0, BULK_LIMIT);
      let failed = 0;
      for (const [i, c] of queue.entries()) {
        setImportProgress(`Consultando CNPJ ${i + 1} de ${queue.length} na Receita Federal…`);
        try {
          const r = await lookupCnpj(c);
          items.push(r.point);
        } catch {
          failed++;
        }
        if (i < queue.length - 1) await new Promise(res => setTimeout(res, BULK_DELAY_MS));
      }
      setImportProgress(null);

      const count = importRetailPointsCsv(items);
      setTimeout(() => setReloadKey((k) => k + 1), 2000);
      const leftover = Math.max(0, new Set(toLookup.map(onlyDigits)).size - queue.length - [...new Set(toLookup.map(onlyDigits))].filter(c => known.has(c)).length);
      showToast([
        `${count} PDVs importados`,
        failed && `${failed} CNPJs não encontrados`,
        leftover && `${leftover} ficaram para a próxima importação (limite de ${BULK_LIMIT} consultas por vez)`,
      ].filter(Boolean).join(' · '));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSavePdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdv.name || !newPdv.city) return;
    if (newPdv.cnpj && retailPoints.some((r) => onlyDigits(r.cnpj || '') === onlyDigits(newPdv.cnpj))) {
      setCnpjInfo({ ok: false, text: 'Este CNPJ já está cadastrado nos seus PDVs.' });
      return;
    }

    addRetailPoint({
      name: newPdv.name,
      trade_name: newPdv.trade_name || newPdv.name,
      network: newPdv.network || newPdv.name,
      cnpj: newPdv.cnpj || '',
      type: newPdv.type,
      city: newPdv.city,
      state: newPdv.state,
      address: newPdv.address,
      phone: newPdv.phone,
      email: newPdv.email,
      manager_name: newPdv.manager_name,
      status: newPdv.status
    });

    setIsAddModalOpen(false);
    setNewPdv(emptyPdv);
    setCnpjInfo(null);
    setTimeout(() => setReloadKey((k) => k + 1), 1500);
    showToast('Ponto de Venda cadastrado com sucesso!');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'perfumery': return 'Perfumaria';
      case 'cosmetics': return 'Cosméticos';
      case 'pharmacy': return 'Drogaria / Farmácia';
      case 'salon': return 'Salão / Studio';
      case 'distributor': return 'Distribuidor';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Feedback */}
      {importProgress && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-black border-2 border-black px-4 py-3 rounded-full shadow-xl text-xs font-bold">
          {importProgress}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            {canSeeContacts ? 'Pontos de Venda (PDVs)' : 'Mapa de PDVs · sob consulta'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {serverMode ? (<>Mapa de mercado com <strong>{totalAll.toLocaleString('pt-BR')} PDVs ativos</strong> das principais redes (dados abertos da Receita Federal). {canSeeContacts ? 'Abra uma rede para ver as lojas.' : 'Escolha o estado, veja a oportunidade e solicite um projeto ao nosso time.'}</>) : (<>Mapeamento geográfico de <strong>{sourceCounts.retail_points.toLocaleString('pt-BR')} PDVs</strong> com {retailPoints.length} unidades ativas no CRM.</>)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import / Export CSV - Apenas Admin Geral (evita vazamento de base para empresas) */}
          {canManageCsv && (
            <>
              <label className="cursor-pointer px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{importProgress ? 'Importando…' : 'Importar CSV'}</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={!!importProgress} />
              </label>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Exportar CSV</span>
              </button>
            </>
          )}

          {canSeeContacts && (
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-1">
              <Plus className="w-4 h-4" />
              <span>Novo PDV</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Mapa de mercado: uma linha por rede (detalhe loja a loja só para o time Squad UGC) */}
      {serverMode ? (
        <PdvMarketMap canSeeDetails={canSeeContacts} />
      ) : (
      <>
      {/* 2. Filtros */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por nome, rede, cidade ou CNPJ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Todos os Estados (UF)</option>
              {statesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Todos os Tipos de PDV</option>
              <option value="cosmetics">Lojas de Cosméticos</option>
              <option value="perfumery">Perfumarias</option>
              <option value="pharmacy">Drogarias & Farmácias</option>
              <option value="salon">Salões & Estética</option>
              <option value="distributor">Distribuidores</option>
            </select>
          </div>

          {serverMode ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {[['pharmacy', 'Farmácias'], ['cosmetics', 'Cosméticos'], ['salon', 'Salões'], ['distributor', 'Atacado']].map(([t, l]) => (
                <span key={t}><strong className="text-foreground">{(typeCounts?.[t] || 0).toLocaleString('pt-BR')}</strong> {l}</span>
              ))}
            </div>
          ) : (
          <div>
            <select
              value={selectedNetwork}
              onChange={(e) => { setSelectedNetwork(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none text-foreground"
            >
              <option value="all">Todas as Redes</option>
              {networksList.map(net => (
                <option key={net} value={net}>{net}</option>
              ))}
            </select>
          </div>
          )}

        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
          <span className="text-muted-foreground">Mostrando <strong>{totalFiltered.toLocaleString('pt-BR')}</strong> de {totalAll.toLocaleString('pt-BR')} unidades mapeadas</span>
          {(search || selectedState !== 'all' || selectedType !== 'all' || selectedNetwork !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedState('all');
                setSelectedType('all');
                setSelectedNetwork('all');
                setCurrentPage(1);
              }}
              className="text-primary hover:underline font-bold text-xs"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabela de PDVs */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Ponto de Venda / Razão Social</th>
                <th className="pb-3 text-left">Rede</th>
                <th className="pb-3 text-left">Tipo</th>
                <th className="pb-3 text-left">Localização</th>
                {hasCnpj && <th className="pb-3 text-left">CNPJ</th>}
                {canSeeContacts && <th className="pb-3 text-left">Contato / Gerente</th>}
                <th className="pb-3 text-center">Status</th>
                {canManageCsv && <th className="pb-3 text-right pr-2">Ação</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedPoints.map((point) => (
                <tr key={point.id} className="hover:bg-muted/40 transition-colors">
                  
                  {/* Nome */}
                  <td className="py-3 pl-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{point.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{point.address}</p>
                      </div>
                    </div>
                  </td>

                  {/* Rede */}
                  <td className="py-3 font-semibold text-foreground">
                    {point.network || 'Independente'}
                  </td>

                  {/* Tipo */}
                  <td className="py-3">
                    <Badge variant="secondary" size="sm">
                      {getTypeLabel(point.type)}
                    </Badge>
                  </td>

                  {/* Localização */}
                  <td className="py-3">
                    <div className="flex items-center space-x-1 text-muted-foreground font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{point.city} - {point.state}</span>
                    </div>
                  </td>

                  {/* CNPJ */}
                  {hasCnpj && (
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">
                      {point.cnpj || '—'}
                    </td>
                  )}

                  {/* Contato / Gerente: só time Squad UGC e só o que existe */}
                  {canSeeContacts && (
                    <td className="py-3">
                      {point.manager_name && <p className="font-medium text-foreground">{point.manager_name}</p>}
                      {(point.phone || point.email) && <p className="text-[11px] text-muted-foreground">{point.phone || point.email}</p>}
                      {!point.manager_name && !point.phone && !point.email && <span className="text-muted-foreground">—</span>}
                    </td>
                  )}

                  {/* Status */}
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      point.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {point.status === 'active' ? 'Ativo' : 'Lead'}
                    </span>
                  </td>

                  {/* Ação */}
                  {canManageCsv && (
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => handleDeletePdv(point.id, point.name)}
                        title="Remover PDV"
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
          <span className="text-muted-foreground">
            Página <strong>{currentPage}</strong> de {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted text-xs font-semibold"
            >
              Anterior
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted text-xs font-semibold"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Modal: Novo PDV */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-foreground text-base">Cadastrar Novo Ponto de Venda</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePdv} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">CNPJ (preenche o resto automaticamente)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPdv.cnpj}
                    onChange={(e) => { setNewPdv({ ...newPdv, cnpj: e.target.value }); setCnpjInfo(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookupCnpj(); } }}
                    placeholder="00.000.000/0000-00"
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button type="button" onClick={handleLookupCnpj} disabled={cnpjLoading || onlyDigits(newPdv.cnpj).length < 14}>
                    {cnpjLoading ? 'Buscando…' : 'Buscar CNPJ'}
                  </Button>
                </div>
                {cnpjInfo && (
                  <p className={`font-semibold ${cnpjInfo.ok ? 'text-emerald-600' : 'text-red-600'}`}>{cnpjInfo.text}</p>
                )}
                <p className="text-[10px] text-muted-foreground">Dados oficiais da Receita Federal via BrasilAPI.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nome da Unidade / Loja *</label>
                <input
                  type="text"
                  required
                  value={newPdv.name}
                  onChange={(e) => setNewPdv({ ...newPdv, name: e.target.value })}
                  placeholder="Preenchido pelo CNPJ ou digite"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Rede</label>
                  <input
                    type="text"
                    value={newPdv.network}
                    onChange={(e) => setNewPdv({ ...newPdv, network: e.target.value })}
                    placeholder="Ex: Danny Cosméticos"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tipo de PDV</label>
                  <select
                    value={newPdv.type}
                    onChange={(e) => setNewPdv({ ...newPdv, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  >
                    <option value="cosmetics">Loja de Cosméticos</option>
                    <option value="perfumery">Perfumaria</option>
                    <option value="pharmacy">Drogaria / Farmácia</option>
                    <option value="salon">Salão de Beleza</option>
                    <option value="distributor">Distribuidor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={newPdv.city}
                    onChange={(e) => setNewPdv({ ...newPdv, city: e.target.value })}
                    placeholder="Ex: Campinas"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newPdv.state}
                    onChange={(e) => setNewPdv({ ...newPdv, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Endereço Completo</label>
                <input
                  type="text"
                  value={newPdv.address}
                  onChange={(e) => setNewPdv({ ...newPdv, address: e.target.value })}
                  placeholder="Rua das Acácias, 150 - Centro"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Gerente Responsável</label>
                  <input
                    type="text"
                    value={newPdv.manager_name}
                    onChange={(e) => setNewPdv({ ...newPdv, manager_name: e.target.value })}
                    placeholder="Nome do gerente"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar PDV</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
