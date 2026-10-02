import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { RetailPoint } from '../../types/database';
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
  X
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SquadraRetail: React.FC = () => {
  const { retailPoints, sourceCounts, addRetailPoint, importRetailPointsCsv } = useData();

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
  const [newPdv, setNewPdv] = useState({
    name: '',
    network: '',
    cnpj: '',
    type: 'cosmetics' as const,
    city: '',
    state: 'SP',
    address: '',
    phone: '',
    email: '',
    manager_name: ''
  });

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Listas únicas para os selects
  const statesList = useMemo(() => Array.from(new Set(retailPoints.map(r => r.state))).sort(), [retailPoints]);
  const networksList = useMemo(() => Array.from(new Set(retailPoints.map(r => r.network || r.name.split('-')[0].trim()))).sort(), [retailPoints]);

  // Filtragem
  const filteredPoints = useMemo(() => {
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

  const totalPages = Math.ceil(filteredPoints.length / pageSize) || 1;
  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPoints.slice(start, start + pageSize);
  }, [filteredPoints, currentPage, pageSize]);

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = ['Nome', 'Rede', 'CNPJ', 'Tipo', 'Cidade', 'Estado', 'Endereco', 'Telefone', 'Email', 'Gerente', 'Status'];
    const rows = filteredPoints.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.network || '').replace(/"/g, '""')}"`,
      `"${p.cnpj || ''}"`,
      p.type,
      `"${p.city.replace(/"/g, '""')}"`,
      p.state,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      `"${(p.manager_name || '').replace(/"/g, '""')}"`,
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

  // Importar CSV
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      const items: Partial<RetailPoint>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols[0]) {
          items.push({
            name: cols[0],
            network: cols[1] || cols[0],
            cnpj: cols[2] || '',
            type: (cols[3] as any) || 'cosmetics',
            city: cols[4] || 'São Paulo',
            state: cols[5] || 'SP',
            address: cols[6] || '',
            phone: cols[7] || '',
            email: cols[8] || '',
            manager_name: cols[9] || ''
          });
        }
      }

      const count = importRetailPointsCsv(items);
      showToast(`${count} novos PDVs importados com sucesso!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSavePdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdv.name || !newPdv.city) return;

    addRetailPoint({
      name: newPdv.name,
      trade_name: newPdv.name,
      network: newPdv.network || newPdv.name,
      cnpj: newPdv.cnpj || '00.000.000/0001-00',
      type: newPdv.type,
      city: newPdv.city,
      state: newPdv.state,
      address: newPdv.address,
      phone: newPdv.phone,
      email: newPdv.email,
      manager_name: newPdv.manager_name,
      status: 'active'
    });

    setIsAddModalOpen(false);
    setNewPdv({
      name: '',
      network: '',
      cnpj: '',
      type: 'cosmetics',
      city: '',
      state: 'SP',
      address: '',
      phone: '',
      email: '',
      manager_name: ''
    });
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
            Pontos de Venda (PDVs)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Mapeamento geográfico de <strong>{sourceCounts.retail_points.toLocaleString('pt-BR')} PDVs</strong> com {retailPoints.length} unidades ativas no CRM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Importar CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
          </label>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Exportar CSV</span>
          </button>

          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-1">
            <Plus className="w-4 h-4" />
            <span>Novo PDV</span>
          </Button>
        </div>
      </div>

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
              <option value="salon">Salões & Nail Studios</option>
              <option value="distributor">Distribuidores</option>
            </select>
          </div>

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

        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
          <span className="text-muted-foreground">Mostrando <strong>{filteredPoints.length}</strong> de {retailPoints.length} unidades mapeadas</span>
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
                <th className="pb-3 text-left">CNPJ</th>
                <th className="pb-3 text-left">Contato / Gerente</th>
                <th className="pb-3 text-center">Status</th>
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
                  <td className="py-3 font-mono text-[11px] text-muted-foreground">
                    {point.cnpj || '00.000.000/0001-00'}
                  </td>

                  {/* Contato / Gerente */}
                  <td className="py-3">
                    <p className="font-medium text-foreground">{point.manager_name || 'Gerente Loja'}</p>
                    <p className="text-[11px] text-muted-foreground">{point.phone || point.email}</p>
                  </td>

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
                <label className="font-semibold text-foreground">Nome da Unidade / Loja *</label>
                <input
                  type="text"
                  required
                  value={newPdv.name}
                  onChange={(e) => setNewPdv({ ...newPdv, name: e.target.value })}
                  placeholder="Ex: Danny Cosméticos - Loja 04"
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">CNPJ</label>
                  <input
                    type="text"
                    value={newPdv.cnpj}
                    onChange={(e) => setNewPdv({ ...newPdv, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
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
