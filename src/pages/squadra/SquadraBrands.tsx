import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { BrandProfile } from '../../types/database';
import {
  Building2,
  Plus,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Sparkles,
  ShieldCheck,
  X,
  Globe,
  MapPin,
  Check
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SquadraBrands: React.FC = () => {
  const {
    brands,
    selectedBrandId,
    setSelectedBrandId,
    addBrand,
    updateBrand,
    deleteBrand,
    cleanMockData
  } = useData();

  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandProfile | null>(null);
  const [isCleanConfirmOpen, setIsCleanConfirmOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    brand_name: '',
    company_name: '',
    cnpj: '',
    city: 'São Paulo',
    state: 'SP',
    description: '',
    website: '',
    logo_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300'
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectBrand = (brandId: string, brandName: string) => {
    setSelectedBrandId(brandId);
    showToast(`Marca ativa alterada para "${brandName}"!`);
  };

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter(
      b =>
        b.brand_name.toLowerCase().includes(q) ||
        b.company_name.toLowerCase().includes(q) ||
        b.cnpj.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const openCreateModal = () => {
    setFormData({
      brand_name: '',
      company_name: '',
      cnpj: '',
      city: 'São Paulo',
      state: 'SP',
      description: '',
      website: '',
      logo_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300'
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (brand: BrandProfile) => {
    setEditingBrand(brand);
    setFormData({
      brand_name: brand.brand_name,
      company_name: brand.company_name,
      cnpj: brand.cnpj,
      city: brand.city,
      state: brand.state,
      description: brand.description,
      website: brand.website || '',
      logo_url: brand.logo_url
    });
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand_name.trim()) return;

    addBrand({
      user_id: `user-b-${Date.now()}`,
      brand_name: formData.brand_name.trim(),
      company_name: formData.company_name.trim() || formData.brand_name.trim(),
      cnpj: formData.cnpj.trim() || '00.000.000/0001-00',
      city: formData.city,
      state: formData.state,
      description: formData.description.trim() || 'Marca cadastrada na organização Squadra.',
      website: formData.website.trim() || undefined,
      logo_url: formData.logo_url,
      contact_name: 'Administrador da Marca',
      contact_email: 'contato@marca.com.br',
      contact_phone: '(11) 98888-0000',
      status: 'active',
      updated_at: new Date().toISOString()
    });

    setIsCreateModalOpen(false);
    showToast(`Marca "${formData.brand_name}" cadastrada com sucesso!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    updateBrand(editingBrand.id, {
      brand_name: formData.brand_name.trim(),
      company_name: formData.company_name.trim(),
      cnpj: formData.cnpj.trim(),
      city: formData.city,
      state: formData.state,
      description: formData.description.trim(),
      website: formData.website.trim() || undefined,
      logo_url: formData.logo_url
    });

    setEditingBrand(null);
    showToast(`Marca "${formData.brand_name}" atualizada!`);
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a marca "${name}"?`)) {
      deleteBrand(id);
      showToast(`Marca "${name}" removida.`);
    }
  };

  const handleCleanMockups = () => {
    cleanMockData();
    setIsCleanConfirmOpen(false);
    showToast('Mockups limpos! Base oficial de marcas e dados reais restaurada.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-border/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Marcas & Multiempresa
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
              {brands.length} Marcas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerenciamento centralizado de marcas da organização com catálogo de campanhas e pontuação isolada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão para limpar mockups e restaurar dados reais */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCleanConfirmOpen(true)}
            className="flex items-center space-x-1.5 text-muted-foreground hover:text-foreground"
            title="Limpa caches de mockups e restaura dados reais oficiais"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Mockups & Restaurar Base</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Marca</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra de Busca */}
      <div className="flex items-center space-x-3 bg-card border border-border rounded-2xl p-2 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar marcas por nome, CNPJ ou cidade..."
          className="bg-transparent border-0 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Grid de Marcas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => {
          const isActive = selectedBrandId === brand.id;

          return (
            <div
              key={brand.id}
              className={`p-6 rounded-3xl bg-card border transition-all space-y-4 relative flex flex-col justify-between ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-md'
                  : 'border-border hover:border-primary/40 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* Top Badge & Actions */}
                <div className="flex items-center justify-between">
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary text-primary-foreground">
                      Marca Ativa
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Multiempresa
                    </span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(brand)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Editar Marca"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {brands.length > 1 && (
                      <button
                        onClick={() => handleDeleteBrand(brand.id, brand.brand_name)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir Marca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo e Nome */}
                <div className="flex items-center space-x-3.5">
                  <img
                    src={brand.logo_url}
                    alt={brand.brand_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-border shadow-sm bg-muted"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold font-display text-foreground text-base truncate">
                      {brand.brand_name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{brand.company_name}</p>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {brand.description}
                </p>

                {/* Dados Cadastrais */}
                <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="font-mono text-foreground font-semibold">{brand.cnpj}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Localização:</span>
                    <span className="text-foreground flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{brand.city} - {brand.state}</span>
                    </span>
                  </div>
                  {brand.website && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Site:</span>
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center space-x-1 truncate max-w-[160px]"
                      >
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{brand.website.replace('https://', '')}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Ativação */}
              <div className="pt-2">
                <Button
                  variant={isActive ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleSelectBrand(brand.id, brand.brand_name)}
                  className="w-full flex items-center justify-center space-x-1.5"
                >
                  {isActive ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Marca Selecionada</span>
                    </>
                  ) : (
                    <span>Ativar esta Marca</span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-3xl p-8 space-y-3">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-foreground">Nenhuma marca encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não encontramos marcas com o termo &quot;{search}&quot;. Tente outro filtro ou cadastre uma nova marca.
          </p>
          <Button size="sm" onClick={openCreateModal}>
            Cadastrar Nova Marca
          </Button>
        </div>
      )}

      {/* MODAL: Cadastrar Nova Marca */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-foreground text-lg">Cadastrar Nova Marca</h3>
                  <p className="text-xs text-muted-foreground">Adicione uma marca ao ambiente multiempresa</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nome Comercial da Marca *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    placeholder="Ex: Squadra Nutrition"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Razão Social</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Ex: Squadra Suplementos Ltda"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-foreground">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-foreground">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-foreground">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Descrição Institucional</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o posicionamento da marca, nicho e diferenciais..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Website Oficial</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://squadra.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">URL do Logo</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Salvar e Cadastrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Marca */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-foreground text-lg">Editar Marca</h3>
                  <p className="text-xs text-muted-foreground">{editingBrand.brand_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBrand(null)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nome Comercial *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Razão Social</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Descrição</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">URL do Logo</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingBrand(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Limpeza de Mockups */}
      {isCleanConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="font-bold font-display text-foreground text-lg">
              Limpar Mockups & Restaurar Base Oficial?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta ação removerá todos os caches temporários do navegador (mockups antigos de esmaltes/unhas) e restaurará os dados reais oficiais alinhados à planilha do cliente (Suplementação, Bem-Estar 50+, Academia, Alimentação Funcional e PDVs).
            </p>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCleanConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCleanMockups}
              >
                Confirmar Limpeza
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SquadraBrands;
